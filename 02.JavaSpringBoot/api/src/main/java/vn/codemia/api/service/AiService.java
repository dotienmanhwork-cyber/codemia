package vn.codemia.api.service;

import vn.codemia.api.dto.request.ChatRequest;
import vn.codemia.api.dto.request.CodeReviewRequest;
import vn.codemia.api.dto.request.QuizQuestionRequest;
import vn.codemia.api.dto.response.AiRunCodeResponse;
import vn.codemia.api.dto.response.ChatResponse;
import vn.codemia.api.dto.response.CodeReviewResponse;
import vn.codemia.api.dto.response.SubmitExerciseResponse;
import vn.codemia.api.dto.response.SummaryResponse;

import java.util.List;
import java.util.Map;

public interface AiService {

	ChatResponse chat(ChatRequest request);

	SummaryResponse summarizeLesson(Integer lessonId);

	CodeReviewResponse reviewCode(CodeReviewRequest request);

	/**
	 * Fallback khi bài chưa có test cases.
	 * AI đọc code và nhận xét — kết quả KHÔNG deterministic.
	 */
	AiRunCodeResponse runCode(String code, String language,
	                          String description, List<String> requirements);

	SubmitExerciseResponse evaluateCode(String code, String language,
	                                    String description, List<String> requirements);

	/**
	 * Chấm bài trắc nghiệm: so đáp án, tính điểm, AI giải thích từng câu sai.
	 */
	SubmitExerciseResponse evaluateQuiz(List<QuizQuestionRequest> questions,
	                                    Map<Integer, String> studentAnswers);

	/**
	 * Piston đã chấm điểm xong (pass/fail chính xác).
	 * AI chỉ giải thích TẠI SAO fail — không chấm điểm lại.
	 */
	String explainFailures(String code, String language, List<String> failedTests);

	/**
	 * Student nhấn "AI Giải thích lỗi" — AI giải thích lỗi compile/runtime
	 * bằng tiếng Việt dễ hiểu, gợi ý hướng sửa nhưng KHÔNG viết code hoàn chỉnh.
	 *
	 * @param request  code + language + errorMessage từ Piston
	 * @return Giải thích bằng tiếng Việt
	 */
	String explainError(CodeReviewRequest request);
}