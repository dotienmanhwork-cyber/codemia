package vn.codemia.api.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.config.AiProviderConfig;
import vn.codemia.api.dto.request.ChatRequest;
import vn.codemia.api.dto.request.CodeReviewRequest;
import vn.codemia.api.dto.request.QuizQuestionRequest;
import vn.codemia.api.dto.response.*;
import vn.codemia.api.entity.Lesson;
import vn.codemia.api.enums.AiFeature;
import vn.codemia.api.enums.AiProviderType;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.repository.LessonRepository;
import vn.codemia.api.service.AiService;
import vn.codemia.api.service.TranscriptService;
import vn.codemia.api.service.ai.AiProvider;
import vn.codemia.api.service.ai.impl.ClaudeProvider;
import vn.codemia.api.service.ai.impl.GeminiProvider;
import vn.codemia.api.service.ai.impl.GroqFastProvider;
import vn.codemia.api.service.ai.impl.GroqProvider;
import vn.codemia.api.service.ai.impl.OpenAiProvider;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

	private final AiProviderConfig  aiProviderConfig;
	private final LessonRepository  lessonRepository;
	private final TranscriptService transcriptService;
	private final ClaudeProvider    claudeProvider;
	private final OpenAiProvider    openAiProvider;
	private final GeminiProvider    geminiProvider;
	private final GroqProvider      groqProvider;
	private final GroqFastProvider  groqFastProvider;
	private final ObjectMapper      objectMapper;

	// ── Provider map ──────────────────────────────────────────────────────
	private Map<AiProviderType, AiProvider> providerMap() {
		Map<AiProviderType, AiProvider> map = new EnumMap<>(AiProviderType.class);
		map.put(AiProviderType.CLAUDE,    claudeProvider);
		map.put(AiProviderType.OPENAI,    openAiProvider);
		map.put(AiProviderType.GEMINI,    geminiProvider);
		map.put(AiProviderType.GROQ,      groqProvider);
		map.put(AiProviderType.GROQ_FAST, groqFastProvider);
		return map;
	}

	// ── Fallback engine ───────────────────────────────────────────────────
	private record AiResult(String text, AiProviderType usedProvider) {}

	private AiResult callWithFallback(AiFeature feature, String systemPrompt, String userPrompt) {
		if (!aiProviderConfig.isFeatureEnabled(feature)) {
			log.warn("[AI] Feature {} is disabled, rejecting request", feature);
			throw new AppException(ErrorCode.AI_FEATURE_DISABLED);
		}

		List<AiProviderType> order = aiProviderConfig.getProviderOrder(feature);
		Map<AiProviderType, AiProvider> providers = providerMap();
		Exception lastError = null;

		for (AiProviderType providerType : order) {
			AiProvider provider = providers.get(providerType);
			try {
				log.info("[AI] Trying {} for feature={}", providerType, feature);
				String result = provider.call(systemPrompt, userPrompt);
				log.info("[AI] Success with {}", providerType);
				return new AiResult(result, providerType);
			} catch (Exception e) {
				log.warn("[AI] {} failed ({}), trying next...", providerType, e.getMessage());
				log.error("[AI] Stack trace:", e);
				lastError = e;
			}
		}

		log.error("[AI] All providers failed for feature={}", feature, lastError);
		throw new AppException(ErrorCode.AI_UNAVAILABLE);
	}

	// ── CHAT ──────────────────────────────────────────────────────────────

	@Override
	public ChatResponse chat(ChatRequest request) {
		String userPrompt = request.getMessage();

		if (request.getLessonId() != null) {
			try {
				Lesson lesson = lessonRepository.findById(request.getLessonId()).orElse(null);
				if (lesson != null) {
					if (lesson.getType() == vn.codemia.api.enums.LessonType.TEXT && lesson.getContent() != null && !lesson.getContent().isBlank()) {
						// ── Gửi full text của bài viết làm ngữ cảnh ──
						String cleanText = lesson.getContent().replaceAll("<[^>]*>", ""); // Loại bỏ các thẻ HTML để tối ưu token
						
						userPrompt = "Bài học: \"" + lesson.getTitle() + "\" (Dạng bài viết)\n"
								+ "Nội dung bài học:\n"
								+ (cleanText.length() > 6000 ? cleanText.substring(0, 6000) + "\n...(còn tiếp)" : cleanText)
								+ "\n\nCâu hỏi của học viên: " + request.getMessage();
						log.info("[AI] Chat with TEXT lesson content lessonId={}", request.getLessonId());
					} else if (lesson.getTranscript() != null && !lesson.getTranscript().isBlank()) {
						// ── Lấy đoạn transcript xung quanh timestamp học viên đang xem ──
						// Luôn dùng window ±3 phút — kể cả khi không có timestamp (mặc định ts=0, đầu video)
						String contextTranscript;
						String timestampLabel = "";

						int ts = (request.getTimestampSeconds() != null) ? request.getTimestampSeconds() : 0;

						if (request.getTimestampSeconds() != null) {
							int h = ts / 3600;
							int m = (ts % 3600) / 60;
							int s = ts % 60;
							timestampLabel = String.format("[%02d:%02d:%02d]", h, m, s);
						}

						String window = transcriptService.getTranscriptWindow(lesson.getId(), ts, 180);

						if (window != null && !window.isBlank()) {
							contextTranscript = window;
							log.info("[AI] Chat with transcript window lessonId={}, ts={}s, windowLen={}",
									request.getLessonId(), ts, window.length());
						} else {
							// Window rỗng (transcript chưa có timestamp info) → fallback toàn bộ giới hạn 6000 ký tự
							contextTranscript = lesson.getTranscript().length() > 6000
									? lesson.getTranscript().substring(0, 6000) + "\n...(còn tiếp)"
									: lesson.getTranscript();
							log.info("[AI] Chat transcript window empty, fallback full lessonId={}", request.getLessonId());
						}

						// ── Tóm tắt bài học (đã có cache) — cho AI biết bức tranh toàn bài ──
						String summaryContext = "";
						if (lesson.getAiSummaryCache() != null && !lesson.getAiSummaryCache().isBlank()) {
							summaryContext = "\n\nTóm tắt toàn bài:\n" + lesson.getAiSummaryCache();
						}

						userPrompt = "Bài học: \"" + lesson.getTitle() + "\""
								+ (timestampLabel.isBlank() ? "" : "\nHọc viên đang xem tại: " + timestampLabel)
								+ summaryContext
								+ "\n\nĐoạn transcript liên quan:\n"
								+ contextTranscript
								+ "\n\nCâu hỏi của học viên: " + request.getMessage();
					}
				}
			} catch (Exception e) {
				log.warn("[AI] Failed to load lesson context: {} — fallback to plain chat", e.getMessage());
			}
		}

		String quizRule = request.isQuizMode() ? """

				QUY TẮC VỀ BÀI QUIZ — TUYỆT ĐỐI TUÂN THỦ (ƯU TIÊN CAO NHẤT):
				- Học viên đang trong bài kiểm tra quiz. Đây là phần kiểm tra kiến thức, không phải học.
				- TUYỆT ĐỐI không trả lời bất kỳ câu hỏi nào liên quan đến nội dung, khái niệm,
				  hay đáp án trong bài quiz, dù học viên hỏi trực tiếp hay vòng vo.
				- KHÔNG giải thích khái niệm, KHÔNG gợi ý hướng, KHÔNG dùng kiến thức ngoài.
				- Với MỌI câu hỏi không ngoại lệ, chỉ được trả lời đúng 1 câu này:
				  "Bạn đang làm bài quiz rồi đó 😊 Hãy tự suy nghĩ và chọn đáp án nhé,
				  sau khi nộp bài mình sẽ giải thích chi tiết hơn!"
				""" : "";

		// ── Rule sau khi nộp bài: giải thích cả câu đúng lẫn câu sai ──
		String quizReviewRule = "";
		if (!request.isQuizMode()
				&& request.getQuizPassedQuestions() != null
				&& !request.getQuizPassedQuestions().isEmpty()) {
			quizReviewRule = """

					QUY TẮC SAU KHI NỘP QUIZ — TUYỆT ĐỐI TUÂN THỦ (ƯU TIÊN CAO NHẤT):
					Học viên vừa nộp xong bài quiz. Bây giờ là lúc giúp học viên HIỂU sâu hơn.

					QUY TẮC:
					1. Được phép giải thích tất cả câu hỏi quiz mà học viên hỏi — kể cả câu đúng lẫn câu sai.
					2. Khi giải thích: ưu tiên dựa vào transcript và tóm tắt bài học được cung cấp.
					   Nếu không có đủ thông tin trong transcript → nói: "Bạn có thể xem lại video để hiểu rõ hơn nhé!"
					3. KHÔNG dùng kiến thức bên ngoài để suy diễn — chỉ giải thích theo cách bài học trình bày.
					4. Khuyến khích học viên xem lại video để củng cố kiến thức sau khi giải thích.
					""";
		}

		String system = """
				Bạn là trợ lý học tập của nền tảng Codemia. Nhiệm vụ của bạn là giúp học viên HIỂU dựa trên nội dung bài học, không phải làm thay.

				NGUYÊN TẮC BẮT BUỘC VỀ NGUỒN TRẢ LỜI:
				1. Trả lời bằng tiếng Việt, ngắn gọn, thân thiện.
				2. Bạn được cung cấp hai nguồn ngữ cảnh (tùy thuộc vào loại bài học):
				   - Dạng video: "Đoạn transcript liên quan" và "Tóm tắt toàn bài".
				   - Dạng văn bản: "Nội dung bài học" chứa toàn bộ văn bản của bài học.
				3. Trả lời bám sát theo ngữ cảnh bài học đã được cung cấp.
				4. Nếu câu hỏi CÓ liên quan đến bài học → trả lời theo nội dung đó.
				5. Nếu câu hỏi KHÔNG liên quan đến bài học này → trả lời đúng một câu:
				   "Câu hỏi này nằm ngoài nội dung bài học, bạn có thể xem lại bài viết / video nhé!"
				   TUYỆT ĐỐI không đề cập đến transcript, tóm tắt, hay bất kỳ khái niệm kỹ thuật nội bộ nào.
				6. KHÔNG dùng kiến thức bên ngoài để suy diễn thêm — chỉ trả lời đúng theo cách bài học trình bày.

				QUY TẮC VỀ BÀI TẬP CODE — TUYỆT ĐỐI TUÂN THỦ:
				- KHÔNG BAO GIỜ viết code hoàn chỉnh giải bài tập cho học viên, dù họ yêu cầu trực tiếp hay gián tiếp.
				- KHÔNG viết hàm, thuật toán, hay đoạn code có thể copy-paste thẳng vào bài nộp.
				- Thay vào đó, CHỈ được:
				  * Gợi ý hướng tiếp cận (ví dụ: "Bạn có thể dùng vòng lặp for-each để duyệt mảng")
				  * Giải thích khái niệm liên quan (ví dụ: "Mảng rỗng có length = 0, bạn cần check điều kiện này")
				  * Hỏi ngược lại để dẫn dắt (ví dụ: "Bạn đã thử kiểm tra trường hợp mảng rỗng chưa?")
				  * Chỉ ra lỗi tư duy mà KHÔNG sửa code trực tiếp

				Nếu học viên cố tình hỏi theo cách khác để lấy đáp án (ví dụ: "viết cho tôi 1 ví dụ tương tự", "giải thích từng dòng code cần viết"), hãy nhận ra ý định đó và từ chối khéo léo, sau đó gợi ý hint thay thế.
				""" + quizRule + quizReviewRule;


		AiResult result = callWithFallback(AiFeature.CHAT, system, userPrompt);

		return ChatResponse.builder()
				.reply(result.text())
				.usedProvider(result.usedProvider())
				.build();
	}

	// ── SUMMARY ───────────────────────────────────────────────────────────

	@Override
	@Transactional
	public SummaryResponse summarizeLesson(Integer lessonId) {
		Lesson lesson = lessonRepository.findById(lessonId)
				.orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

		if (lesson.getAiSummaryCache() != null && !lesson.getAiSummaryCache().isBlank()) {
			log.info("[AI] Summary cache hit for lessonId={}", lessonId);
			return SummaryResponse.builder()
					.lessonId(lessonId)
					.summary(lesson.getAiSummaryCache())
					.fromCache(true)
					.usedProvider(null)
					.build();
		}

		String system = "Bạn là AI tóm tắt bài học lập trình. "
				+ "Tóm tắt nội dung trong 3-5 gạch đầu dòng, "
				+ "dùng tiếng Việt, tập trung vào các điểm kiến thức cốt lõi. "
				+ "Bỏ qua các đoạn giới thiệu, quảng cáo, cảm ơn.";

		String prompt;
		if (lesson.getTranscript() != null && !lesson.getTranscript().isBlank()) {
			String transcriptSnippet = lesson.getTranscript().length() > 6000
					? lesson.getTranscript().substring(0, 6000) + "\n...(còn tiếp)"
					: lesson.getTranscript();

			prompt = "Bài học: \"" + lesson.getTitle() + "\"\n"
					+ "Loại bài: " + lesson.getType() + "\n\n"
					+ "Transcript (phụ đề video):\n"
					+ transcriptSnippet + "\n\n"
					+ "Hãy tóm tắt nội dung bài học dựa trên transcript trên.";

			log.info("[AI] Summarizing lessonId={} WITH transcript ({} chars)",
					lessonId, lesson.getTranscript().length());
		} else {
			prompt = "Bài học: \"" + lesson.getTitle() + "\"\n"
					+ "Loại bài: " + lesson.getType() + "\n"
					+ "Hãy tóm tắt nội dung bài học này.";

			log.warn("[AI] Summarizing lessonId={} WITHOUT transcript (title only)", lessonId);
		}

		AiResult result = callWithFallback(AiFeature.SUMMARY, system, prompt);

		lesson.setAiSummaryCache(result.text());
		lessonRepository.save(lesson);

		return SummaryResponse.builder()
				.lessonId(lessonId)
				.summary(result.text())
				.fromCache(false)
				.usedProvider(result.usedProvider())
				.build();
	}

	// ── CODE REVIEW ───────────────────────────────────────────────────────

	@Override
	public CodeReviewResponse reviewCode(CodeReviewRequest request) {
		String system = "Bạn là senior engineer chuyên review code. "
				+ "Phân tích code về: tính đúng đắn, hiệu suất, bảo mật, khả năng đọc hiểu. "
				+ "Gợi ý cải thiện cụ thể. Dùng ngôn ngữ phù hợp với người học.";
		String prompt = "Language: " + request.getLanguage()
				+ (request.getContext() != null ? "\nContext: " + request.getContext() : "")
				+ "\n\nCode cần review:\n```" + request.getLanguage() + "\n"
				+ request.getCode() + "\n```";

		AiResult result = callWithFallback(AiFeature.CODE_REVIEW, system, prompt);

		return CodeReviewResponse.builder()
				.review(result.text())
				.language(request.getLanguage())
				.usedProvider(result.usedProvider())
				.build();
	}

	// ── CODE RUN — fallback khi bài chưa có test cases ───────────────────
	// FIXED: return type đổi thành AiRunCodeResponse, tách khỏi Piston RunCodeResponse

	@Override
	public AiRunCodeResponse runCode(String code, String language,
	                                 String description, List<String> requirements) {

		String requirementText = requirements.isEmpty()
				? "(không có yêu cầu cụ thể)"
				: requirements.stream()
				  .map(r -> "- " + r)
				  .collect(Collectors.joining("\n"));

		String system = "Bạn là code reviewer của nền tảng học lập trình Codemia. "
				+ "Nhiệm vụ: phân tích code và trả về JSON theo đúng format yêu cầu. "
				+ "QUAN TRỌNG: chỉ trả về JSON thuần túy, không markdown, không giải thích thêm.";

		String userPrompt = """
				Đề bài:
				%s

				Yêu cầu bài tập:
				%s

				Code của học viên (%s):
				```
				%s
				```

				Trả về JSON với cấu trúc sau:
				{
				  "hasError": true hoặc false,
				  "issues": ["vấn đề 1", "vấn đề 2"],
				  "errorExplanation": "giải thích tổng thể nếu hasError=true, null nếu không có lỗi",
				  "suggestions": ["gợi ý hướng sửa 1", "gợi ý 2"]
				}

				Lưu ý: KHÔNG đưa code hoàn chỉnh trong suggestions. Chỉ gợi ý hướng đi.
				""".formatted(description, requirementText, language, code);

		AiResult result = callWithFallback(AiFeature.CODE_RUN, system, userPrompt);

		try {
			String cleanJson = stripMarkdownJson(result.text());
			AiRunCodeResponse response = objectMapper.readValue(cleanJson, AiRunCodeResponse.class);
			response.setUsedProvider(result.usedProvider());
			return response;
		} catch (Exception e) {
			log.error("[AI] Failed to parse runCode response: {}", result.text(), e);
			return AiRunCodeResponse.builder()
					.hasError(true)
					.issues(List.of("Không thể phân tích phản hồi từ AI"))
					.errorExplanation("Có lỗi xảy ra khi phân tích code. Vui lòng thử lại.")
					.suggestions(List.of())
					.usedProvider(result.usedProvider())
					.build();
		}
	}

	// ── EXPLAIN FAILURES — AI giải thích sau khi Piston đã chấm ─────────

	@Override
	public String explainFailures(String code, String language, List<String> failedTests) {
		String failedText = failedTests.stream()
				.map(f -> "- " + f)
				.collect(Collectors.joining("\n"));

		String system = "Bạn là giáo viên lập trình của Codemia. "
				+ "Giải thích ngắn gọn tại sao code sai, dùng tiếng Việt, khuyến khích học viên. "
				+ "KHÔNG cung cấp code sửa hoàn chỉnh — chỉ gợi ý hướng đi.";

		String userPrompt = """
				Code (%s):
				```
				%s
				```

				Các test case không đạt:
				%s

				Giải thích ngắn gọn (2-3 câu) tại sao code chưa đúng và gợi ý hướng sửa.
				""".formatted(language, code, failedText);

		try {
			AiResult result = callWithFallback(AiFeature.CODE_RUN, system, userPrompt);
			return result.text();
		} catch (Exception e) {
			log.warn("[AI] explainFailures failed: {}", e.getMessage());
			return null; // không bắt buộc — Piston đã chấm xong rồi
		}
	}

	// ── CODE SUBMIT (grading) ─────────────────────────────────────────────

	@Override
	public SubmitExerciseResponse evaluateCode(String code, String language,
	                                           String description, List<String> requirements) {

		String requirementText = requirements.isEmpty()
				? "(không có yêu cầu cụ thể)"
				: requirements.stream()
				  .map(r -> "- " + r)
				  .collect(Collectors.joining("\n"));

		String system = "Bạn là giáo viên chấm bài lập trình của nền tảng Codemia. "
				+ "Chấm điểm công bằng, nhận xét chi tiết, khuyến khích học viên. "
				+ "QUAN TRỌNG: chỉ trả về JSON thuần túy, không markdown, không giải thích thêm.";

		String userPrompt = """
				Đề bài:
				%s

				Các yêu cầu cần đáp ứng (mỗi yêu cầu có trọng số bằng nhau):
				%s

				Code của học viên (%s):
				```
				%s
				```

				Trả về JSON với cấu trúc sau:
				{
				  "score": <số nguyên 0-100>,
				  "aiFeedback": "<nhận xét tổng thể, khuyến khích học viên>",
				  "requirementResults": [
				    {
				      "requirement": "<tên yêu cầu>",
				      "passed": <true hoặc false>,
				      "note": "<giải thích ngắn gọn>"
				    }
				  ]
				}

				Cách tính score: (số requirement passed / tổng số requirement) * 100, làm tròn.
				""".formatted(description, requirementText, language, code);

		AiResult result = callWithFallback(AiFeature.CODE_SUBMIT, system, userPrompt);

		try {
			String cleanJson = stripMarkdownJson(result.text());
			JsonNode node = objectMapper.readTree(cleanJson);

			int score = node.get("score").asInt();
			String aiFeedback = node.get("aiFeedback").asText();

			List<SubmitExerciseResponse.RequirementResult> requirementResults = new ArrayList<>();
			for (JsonNode item : node.get("requirementResults")) {
				requirementResults.add(SubmitExerciseResponse.RequirementResult.builder()
						.requirement(item.get("requirement").asText())
						.passed(item.get("passed").asBoolean())
						.note(item.get("note").asText())
						.build());
			}

			return SubmitExerciseResponse.builder()
					.score(score)
					.aiFeedback(aiFeedback)
					.requirementResults(requirementResults)
					.usedProvider(result.usedProvider())
					.build();

		} catch (Exception e) {
			log.error("[AI] Failed to parse evaluateCode response: {}", result.text(), e);
			return SubmitExerciseResponse.builder()
					.score(0)
					.passed(false)
					.aiFeedback("Không thể phân tích phản hồi từ AI. Vui lòng thử lại.")
					.requirementResults(List.of())
					.usedProvider(result.usedProvider())
					.build();
		}
	}

	// ── QUIZ SUBMIT (grading) ─────────────────────────────────────────────

	@Override
	public SubmitExerciseResponse evaluateQuiz(List<QuizQuestionRequest> questions,
	                                           Map<Integer, String> studentAnswers) {

		StringBuilder sb = new StringBuilder();
		sb.append("Bài trắc nghiệm gồm ").append(questions.size()).append(" câu:\n\n");

		for (QuizQuestionRequest q : questions) {
			String studentAns = studentAnswers.getOrDefault(q.getOrderIndex(), "(chưa trả lời)");
			sb.append("Câu ").append(q.getOrderIndex() + 1).append(": ").append(q.getQuestionText()).append("\n");
			sb.append("  A: ").append(q.getOptionA()).append("\n");
			sb.append("  B: ").append(q.getOptionB()).append("\n");
			if (q.getOptionC() != null) sb.append("  C: ").append(q.getOptionC()).append("\n");
			if (q.getOptionD() != null) sb.append("  D: ").append(q.getOptionD()).append("\n");
			sb.append("  Đáp án đúng: ").append(q.getCorrectAnswer()).append("\n");
			sb.append("  Học viên chọn: ").append(studentAns).append("\n");
			if (q.getExplanation() != null) sb.append("  Giải thích: ").append(q.getExplanation()).append("\n");
			sb.append("\n");
		}

		String system = "Bạn là giáo viên chấm bài trắc nghiệm của nền tảng Codemia. "
				+ "Chấm điểm công bằng, giải thích từng câu sai, khuyến khích học viên. "
				+ "QUAN TRỌNG: chỉ trả về JSON thuần túy, không markdown, không giải thích thêm.";

		String userPrompt = sb + """
            Trả về JSON với cấu trúc sau:
            {
              "score": <số nguyên 0-100>,
              "aiFeedback": "<nhận xét tổng thể>",
              "requirementResults": [
                {
                  "requirement": "Câu <N>: <tóm tắt câu hỏi>",
                  "passed": <true nếu đúng>,
                  "note": "<giải thích ngắn>"
                }
              ]
            }

            Cách tính score: (số câu đúng / tổng số câu) * 100, làm tròn.
            """;

		AiResult result = callWithFallback(AiFeature.QUIZ_SUBMIT, system, userPrompt);

		try {
			String cleanJson = stripMarkdownJson(result.text());
			JsonNode node = objectMapper.readTree(cleanJson);

			List<SubmitExerciseResponse.RequirementResult> results = new ArrayList<>();
			for (JsonNode item : node.get("requirementResults")) {
				results.add(SubmitExerciseResponse.RequirementResult.builder()
						.requirement(item.get("requirement").asText())
						.passed(item.get("passed").asBoolean())
						.note(item.get("note").asText())
						.build());
			}

			return SubmitExerciseResponse.builder()
					.score(node.get("score").asInt())
					.aiFeedback(node.get("aiFeedback").asText())
					.requirementResults(results)
					.usedProvider(result.usedProvider())
					.build();

		} catch (Exception e) {
			log.error("[AI] Failed to parse evaluateQuiz response: {}", result.text(), e);
			return SubmitExerciseResponse.builder()
					.score(0).passed(false)
					.aiFeedback("Không thể phân tích phản hồi từ AI. Vui lòng thử lại.")
					.requirementResults(List.of())
					.usedProvider(result.usedProvider())
					.build();
		}
	}

	// ── HELPER ────────────────────────────────────────────────────────────

	private String stripMarkdownJson(String raw) {
		if (raw == null) return "{}";
		String trimmed = raw.strip();
		if (trimmed.startsWith("```")) {
			trimmed = trimmed.replaceAll("^```[a-zA-Z]*\\n?", "");
			trimmed = trimmed.replaceAll("```$", "");
		}
		return trimmed.strip();
	}
	@Override
	public String explainError(CodeReviewRequest request) {
		String system = """
				Bạn là giáo viên lập trình thân thiện của Codemia.
				Nhiệm vụ: giải thích lỗi code cho học viên mới học bằng tiếng Việt, ngắn gọn, dễ hiểu.
 
				NGUYÊN TẮC BẮT BUỘC:
				1. Dùng ngôn ngữ đơn giản — tránh copy nguyên thông báo lỗi tiếng Anh
				2. Giải thích LỖI LÀ GÌ và TẠI SAO bị lỗi (2-3 câu)
				3. Gợi ý HƯỚNG SỬA cụ thể nhưng KHÔNG viết code hoàn chỉnh cho học viên
				4. Kết thúc bằng 1 câu động viên ngắn
				""";

		String errorMsg = request.getErrorMessage() != null
				? request.getErrorMessage()
				: "Không rõ lỗi";

		String userPrompt = """
				Ngôn ngữ lập trình: %s
 
				Code của học viên:
				```
				%s
				```
 
				Thông báo lỗi từ hệ thống:
				%s
 
				Hãy giải thích lỗi này bằng tiếng Việt dễ hiểu cho học viên mới học lập trình.
				""".formatted(
				request.getLanguage() != null ? request.getLanguage() : "java",
				request.getCode()     != null ? request.getCode()     : "",
				errorMsg
		);

		try {
			AiResult result = callWithFallback(AiFeature.CODE_REVIEW, system, userPrompt);
			return result.text();
		} catch (Exception e) {
			log.warn("[AI] explainError failed: {}", e.getMessage());
			return "AI tạm thời không khả dụng. Vui lòng thử lại sau.";
		}
	}
}