package vn.codemia.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.ChatRequest;
import vn.codemia.api.dto.request.CodeReviewRequest;
import vn.codemia.api.dto.response.*;
import vn.codemia.api.service.AiService;
import vn.codemia.api.service.TranscriptService;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

	private final AiService        aiService;
	private final TranscriptService transcriptService;

	/** POST /api/ai/chat */
	@PostMapping("/chat")
	@PreAuthorize("isAuthenticated()")
	public ApiResponse<ChatResponse> chat(@RequestBody ChatRequest request) {
		return ApiResponse.<ChatResponse>builder()
				.result(aiService.chat(request))
				.build();
	}

	/**
	 * POST /api/ai/lessons/{lessonId}/pull-transcript
	 * Pull transcript từ YouTube → lưu DB.
	 * Chỉ ADMIN hoặc TEACHER mới được gọi (tránh user spam).
	 */
	@PostMapping("/lessons/{lessonId}/pull-transcript")
	@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
	public ApiResponse<TranscriptResponse> pullTranscript(@PathVariable Integer lessonId) {
		return ApiResponse.<TranscriptResponse>builder()
				.result(transcriptService.pullTranscript(lessonId))
				.build();
	}

	/**
	 * GET /api/ai/lessons/{lessonId}/summary
	 * Tóm tắt bài học — dùng transcript nếu có, fallback về title.
	 */
	@GetMapping("/lessons/{lessonId}/summary")
	@PreAuthorize("isAuthenticated()")
	public ApiResponse<SummaryResponse> summarizeLesson(@PathVariable Integer lessonId) {
		return ApiResponse.<SummaryResponse>builder()
				.result(aiService.summarizeLesson(lessonId))
				.build();
	}

	/** POST /api/ai/code-review */
	@PostMapping("/code-review")
	@PreAuthorize("isAuthenticated()")
	public ApiResponse<CodeReviewResponse> reviewCode(@RequestBody CodeReviewRequest request) {
		return ApiResponse.<CodeReviewResponse>builder()
				.result(aiService.reviewCode(request))
				.build();
	}

	/** POST /api/ai/explain-error */
	@PostMapping("/explain-error")
	@PreAuthorize("isAuthenticated()")
	public ApiResponse<String> explainError(@RequestBody CodeReviewRequest request) {
		return ApiResponse.<String>builder()
				.result(aiService.explainError(request))
				.build();
	}
}