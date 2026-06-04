package vn.codemia.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.RunCodeRequest;
import vn.codemia.api.dto.request.SubmitRequest;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.dto.response.ExerciseResponse;
import vn.codemia.api.dto.response.RunCodeResponse;
import vn.codemia.api.dto.response.SubmitExerciseResponse;
import vn.codemia.api.service.ExerciseService;

@RestController
@RequiredArgsConstructor
public class ExerciseController {

	private final ExerciseService exerciseService;

	/** GET /api/learning/lessons/{lessonId}/exercise */
	@GetMapping("/api/learning/lessons/{lessonId}/exercise")
	public ApiResponse<ExerciseResponse> getExercise(@PathVariable Integer lessonId) {
		return ApiResponse.<ExerciseResponse>builder()
				.result(exerciseService.getExerciseByLessonId(lessonId))
				.build();
	}

	/** POST /api/learning/lessons/{lessonId}/exercise/submit */
	@PostMapping("/api/learning/lessons/{lessonId}/exercise/submit")
	public ApiResponse<SubmitExerciseResponse> submitExercise(
			@PathVariable Integer lessonId,
			@RequestBody SubmitRequest request) {
		return ApiResponse.<SubmitExerciseResponse>builder()
				.result(exerciseService.submitExercise(lessonId, request))
				.build();
	}

	/**
	 * POST /api/learning/exercises/{exerciseId}/run
	 * Chạy thử code — không lưu submission, không tính điểm.
	 * FE gọi khi bấm "Chạy thử nghiệm".
	 */
	@PostMapping("/api/learning/exercises/{exerciseId}/run")
	public ApiResponse<RunCodeResponse> runCode(
			@PathVariable Integer exerciseId,
			@RequestBody RunCodeRequest request) {
		return ApiResponse.<RunCodeResponse>builder()
				.result(exerciseService.runCode(exerciseId, request.getCode()))
				.build();
	}
}