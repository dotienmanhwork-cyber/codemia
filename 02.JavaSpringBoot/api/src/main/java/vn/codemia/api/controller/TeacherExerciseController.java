package vn.codemia.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.ExerciseRequest;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.dto.response.ExerciseResponse;
import vn.codemia.api.service.ExerciseService;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherExerciseController {

	private final ExerciseService exerciseService;

	/** POST /api/teacher/lessons/{lessonId}/exercise */
	@PostMapping("/lessons/{lessonId}/exercise")
	public ApiResponse<ExerciseResponse> createExercise(
			@PathVariable Integer lessonId,
			@RequestBody ExerciseRequest request) {
		request.setLessonId(lessonId);
		return ApiResponse.<ExerciseResponse>builder()
				.result(exerciseService.createExercise(request))
				.build();
	}

	/** PUT /api/teacher/exercises/{exerciseId} */
	@PutMapping("/exercises/{exerciseId}")
	public ApiResponse<ExerciseResponse> updateExercise(
			@PathVariable Integer exerciseId,
			@RequestBody ExerciseRequest request) {
		return ApiResponse.<ExerciseResponse>builder()
				.result(exerciseService.updateExercise(exerciseId, request))
				.build();
	}

	/** DELETE /api/teacher/exercises/{exerciseId} */
	@DeleteMapping("/exercises/{exerciseId}")
	public ApiResponse<Void> deleteExercise(@PathVariable Integer exerciseId) {
		exerciseService.deleteExercise(exerciseId);
		return ApiResponse.<Void>builder().build();
	}
}