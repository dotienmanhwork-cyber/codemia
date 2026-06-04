package vn.codemia.api.service;

import vn.codemia.api.dto.request.ExerciseRequest;
import vn.codemia.api.dto.request.SubmitRequest;
import vn.codemia.api.dto.response.ExerciseResponse;
import vn.codemia.api.dto.response.RunCodeResponse;
import vn.codemia.api.dto.response.SubmitExerciseResponse;

public interface ExerciseService {

	ExerciseResponse getExerciseByLessonId(Integer lessonId);
	ExerciseResponse createExercise(ExerciseRequest request);
	ExerciseResponse updateExercise(Integer exerciseId, ExerciseRequest request);
	void deleteExercise(Integer exerciseId);
	SubmitExerciseResponse submitExercise(Integer lessonId, SubmitRequest request);

	/** Chạy thử code — không lưu submission, không tính điểm */
	RunCodeResponse runCode(Integer exerciseId, String code);
}