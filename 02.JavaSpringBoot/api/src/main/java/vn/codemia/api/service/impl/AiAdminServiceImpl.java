package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.config.AiProviderConfig;
import vn.codemia.api.dto.request.AiFeatureConfigUpdateRequest;
import vn.codemia.api.dto.response.AiCacheSummaryResponse;
import vn.codemia.api.dto.response.AiFeatureConfigResponse;
import vn.codemia.api.dto.response.AiProviderStatusResponse;
import vn.codemia.api.entity.AiFeatureConfig;
import vn.codemia.api.entity.Lesson;
import vn.codemia.api.enums.AiFeature;
import vn.codemia.api.enums.AiProviderType;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.repository.AiFeatureConfigRepository;
import vn.codemia.api.repository.LessonRepository;
import vn.codemia.api.service.AiAdminService;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAdminServiceImpl implements AiAdminService {

	private final AiFeatureConfigRepository aiFeatureConfigRepository;
	private final LessonRepository          lessonRepository;

	@Value("${ai.anthropic.api-key:}")  private String claudeKey;
	@Value("${ai.openai.api-key:}")     private String openAiKey;
	@Value("${ai.gemini.api-key:}")     private String geminiKey;
	@Value("${ai.groq.api-key:}")       private String groqKey;

	/** HTTP client dùng riêng cho health-check — timeout ngắn, không block request chính */
	private static final HttpClient PING_CLIENT = HttpClient.newBuilder()
			.connectTimeout(Duration.ofSeconds(4))
			.build();

	// ── Provider status ───────────────────────────────────────────────────

	@Override
	public List<AiProviderStatusResponse> getProviderStatuses() {
		// Ping song song — tất cả 5 provider cùng lúc, không chờ nhau
		CompletableFuture<Boolean> claudeFuture   = pingAsync(() -> pingClaude(claudeKey));
		CompletableFuture<Boolean> openaiFuture   = pingAsync(() -> pingOpenAi(openAiKey));
		CompletableFuture<Boolean> geminiFuture   = pingAsync(() -> pingGemini(geminiKey));
		CompletableFuture<Boolean> groqFuture      = pingAsync(() -> pingGroq(groqKey));
		// GROQ_FAST dùng cùng key với GROQ — tái dùng kết quả, không ping thêm lần nữa
		CompletableFuture<Boolean> groqFastFuture = groqFuture;

		return List.of(
				buildStatus(AiProviderType.CLAUDE,     claudeKey,  "claude-3-5-haiku-20241022",   "Tốt cho CHAT, CODE_REVIEW",                claudeFuture),
				buildStatus(AiProviderType.OPENAI,     openAiKey,  "gpt-4o-mini",                  "Tốt cho CHAT, CODE_REVIEW",                openaiFuture),
				buildStatus(AiProviderType.GEMINI,     geminiKey,  "gemini-1.5-flash",             "Tốt cho SUMMARY (context window lớn)",     geminiFuture),
				buildStatus(AiProviderType.GROQ,       groqKey,    "llama-3.3-70b-versatile",      "Dùng cho CODE_SUBMIT — mạnh, nhanh",       groqFuture),
				buildStatus(AiProviderType.GROQ_FAST,  groqKey,    "llama-3.1-8b-instant",         "Dùng cho CODE_RUN — rẻ, đủ nhanh",         groqFastFuture)
		);
	}

	/** Build response — chờ future (tối đa 5s tổng vì đã chạy song song) */
	private AiProviderStatusResponse buildStatus(AiProviderType provider,
	                                             String key,
	                                             String model,
	                                             String note,
	                                             CompletableFuture<Boolean> pingFuture) {
		boolean keyConfigured = isKeySet(key);
		boolean available     = false;
		Long    latencyMs     = null;

		try {
			long start = System.currentTimeMillis();
			available  = pingFuture.join();          // join an toàn — future đã chạy rồi
			latencyMs  = available ? System.currentTimeMillis() - start : null;
		} catch (Exception e) {
			log.warn("[AI Health] {} ping error: {}", provider, e.getMessage());
		}

		return AiProviderStatusResponse.builder()
				.provider(provider)
				.keyConfigured(keyConfigured)
				.available(available)
				.latencyMs(latencyMs)
				.model(model)
				.note(note)
				.build();
	}

	/** Wrap ping call thành CompletableFuture, không bao giờ throw — trả false nếu lỗi */
	private CompletableFuture<Boolean> pingAsync(PingCall call) {
		return CompletableFuture.supplyAsync(() -> {
			try { return call.ping(); }
			catch (Exception e) { return false; }
		});
	}

	@FunctionalInterface
	private interface PingCall { boolean ping() throws Exception; }

	// ── Ping implementations ──────────────────────────────────────────────

	/**
	 * Claude — GET /v1/models
	 * Docs: https://docs.anthropic.com/en/api/models-list
	 */
	private boolean pingClaude(String key) throws Exception {
		if (!isKeySet(key)) return false;
		HttpRequest req = HttpRequest.newBuilder()
				.uri(URI.create("https://api.anthropic.com/v1/models"))
				.timeout(Duration.ofSeconds(4))
				.header("x-api-key", key)
				.header("anthropic-version", "2023-06-01")
				.GET()
				.build();
		int status = PING_CLIENT.send(req, HttpResponse.BodyHandlers.discarding()).statusCode();
		log.debug("[AI Health] CLAUDE ping → HTTP {}", status);
		return status == 200;
	}

	/**
	 * OpenAI — GET /v1/models
	 * Docs: https://platform.openai.com/docs/api-reference/models/list
	 */
	private boolean pingOpenAi(String key) throws Exception {
		if (!isKeySet(key)) return false;
		HttpRequest req = HttpRequest.newBuilder()
				.uri(URI.create("https://api.openai.com/v1/models"))
				.timeout(Duration.ofSeconds(4))
				.header("Authorization", "Bearer " + key)
				.GET()
				.build();
		int status = PING_CLIENT.send(req, HttpResponse.BodyHandlers.discarding()).statusCode();
		log.debug("[AI Health] OPENAI ping → HTTP {}", status);
		return status == 200;
	}

	/**
	 * Gemini — GET /v1/models?key={key}
	 * Docs: https://ai.google.dev/api/models#method:-models.list
	 */
	private boolean pingGemini(String key) throws Exception {
		if (!isKeySet(key)) return false;
		HttpRequest req = HttpRequest.newBuilder()
				.uri(URI.create("https://generativelanguage.googleapis.com/v1/models?key=" + key))
				.timeout(Duration.ofSeconds(4))
				.GET()
				.build();
		int status = PING_CLIENT.send(req, HttpResponse.BodyHandlers.discarding()).statusCode();
		log.debug("[AI Health] GEMINI ping → HTTP {}", status);
		return status == 200;
	}

	/**
	 * Groq — GET /openai/v1/models  (dùng cho cả GROQ và GROQ_FAST — cùng key)
	 * Docs: https://console.groq.com/docs/openai
	 */
	private boolean pingGroq(String key) throws Exception {
		if (!isKeySet(key)) return false;
		HttpRequest req = HttpRequest.newBuilder()
				.uri(URI.create("https://api.groq.com/openai/v1/models"))
				.timeout(Duration.ofSeconds(4))
				.header("Authorization", "Bearer " + key)
				.GET()
				.build();
		int status = PING_CLIENT.send(req, HttpResponse.BodyHandlers.discarding()).statusCode();
		log.debug("[AI Health] GROQ ping → HTTP {}", status);
		return status == 200;
	}

	private boolean isKeySet(String key) {
		return key != null && !key.isBlank();
	}

	// ── Feature config ────────────────────────────────────────────────────

	@Override
	public List<AiFeatureConfigResponse> getAllFeatureConfigs() {
		return aiFeatureConfigRepository.findAll().stream()
				.map(this::toResponse)
				.toList();
	}

	@Override
	@Transactional
	public AiFeatureConfigResponse updateFeatureConfig(AiFeature feature,
	                                                   AiFeatureConfigUpdateRequest request) {
		AiFeatureConfig config = aiFeatureConfigRepository.findById(feature)
				.orElse(AiFeatureConfig.builder().feature(feature).build());

		String orderStr = request.getProviderOrder().stream()
				.map(Enum::name)
				.reduce((a, b) -> a + "," + b)
				.orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));

		config.setProviderOrder(orderStr);
		config.setEnabled(request.isEnabled());
		AiFeatureConfig saved = aiFeatureConfigRepository.save(config);

		log.info("[AI Admin] Updated config for feature={} → {} (enabled={})", feature, orderStr, request.isEnabled());
		return toResponse(saved);
	}

	@Override
	@Transactional
	public List<AiFeatureConfigResponse> resetAllToDefault() {
		AiProviderConfig.DEFAULTS.forEach((feature, providers) -> {
			AiFeatureConfig config = aiFeatureConfigRepository.findById(feature)
					.orElse(AiFeatureConfig.builder().feature(feature).build());

			String orderStr = providers.stream()
					.map(Enum::name)
					.reduce((a, b) -> a + "," + b)
					.orElse("");

			config.setProviderOrder(orderStr);
			config.setEnabled(true);
			aiFeatureConfigRepository.save(config);
		});

		log.info("[AI Admin] Reset all feature configs to defaults");
		return getAllFeatureConfigs();
	}

	private AiFeatureConfigResponse toResponse(AiFeatureConfig cfg) {
		List<AiProviderType> order = Arrays.stream(cfg.getProviderOrder().split(","))
				.map(String::trim)
				.filter(s -> !s.isBlank())
				.map(AiProviderType::valueOf)
				.toList();

		return AiFeatureConfigResponse.builder()
				.feature(cfg.getFeature())
				.providerOrder(order)
				.enabled(cfg.isEnabled())
				.updatedAt(cfg.getUpdatedAt())
				.build();
	}

	// ── Summary cache ─────────────────────────────────────────────────────

	@Override
	public List<AiCacheSummaryResponse> getCacheSummary(String courseId) {
		List<Lesson> lessons = (courseId != null && !courseId.isBlank())
				? lessonRepository.findAllByCourseId(courseId)
				: lessonRepository.findAllWithCourseInfo();

		return lessons.stream()
				.map(lesson -> {
					String cId    = lesson.getSection().getCourse().getId();
					String cTitle = lesson.getSection().getCourse().getTitle();
					int transcriptLen = lesson.getTranscript() != null
							? lesson.getTranscript().length() : 0;

					return AiCacheSummaryResponse.builder()
							.lessonId(lesson.getId())
							.lessonTitle(lesson.getTitle())
							.courseId(cId)
							.courseTitle(cTitle)
							.hasSummaryCache(lesson.getAiSummaryCache() != null
									&& !lesson.getAiSummaryCache().isBlank())
							.hasTranscript(lesson.getTranscript() != null
									&& !lesson.getTranscript().isBlank())
							.transcriptLength(transcriptLen > 0 ? transcriptLen : null)
							.build();
				})
				.toList();
	}

	@Override
	@Transactional
	public void clearLessonCache(Integer lessonId) {
		Lesson lesson = lessonRepository.findById(lessonId)
				.orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

		lesson.setAiSummaryCache(null);
		lessonRepository.save(lesson);

		log.info("[AI Admin] Cleared summary cache for lessonId={}", lessonId);
	}

	@Override
	@Transactional
	public int clearCourseCacheAll(String courseId) {
		List<Lesson> lessons = lessonRepository.findAllByCourseId(courseId);

		int cleared = 0;
		for (Lesson lesson : lessons) {
			if (lesson.getAiSummaryCache() != null) {
				lesson.setAiSummaryCache(null);
				cleared++;
			}
		}
		lessonRepository.saveAll(lessons);

		log.info("[AI Admin] Cleared summary cache for courseId={}, {} lessons affected", courseId, cleared);
		return cleared;
	}
}