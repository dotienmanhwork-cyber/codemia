package vn.codemia.api.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import vn.codemia.api.dto.request.QuizQuestionRequest;
import vn.codemia.api.dto.request.TestCaseRequest;
import vn.codemia.api.dto.response.ExerciseResponse;
import vn.codemia.api.entity.Exercise;

import java.util.Collections;
import java.util.List;

@Component
public class ExerciseMapper {

	private final ObjectMapper objectMapper = new ObjectMapper();

	public ExerciseResponse toResponse(Exercise exercise) {
		return ExerciseResponse.builder()
				.id(exercise.getId())
				.lessonId(exercise.getLesson().getId())
				.type(exercise.getType())
				.title(exercise.getTitle())
				.description(exercise.getDescription())
				.language(exercise.getLanguage())
				.maxScore(exercise.getMaxScore())
				.starterCode(exercise.getStarterCode())
				.fileName(exercise.getFileName())
				.tag(exercise.getTag())
				.time(exercise.getTimeEstimate())
				.requirements(parseRequirements(exercise.getRequirements()))
				.difficulty(exercise.getDifficulty() != null ? exercise.getDifficulty().name() : null)
				.questions(parseQuestions(exercise.getQuestionsJson()))
				.teacherQuestions(parseTeacherQuestions(exercise.getQuestionsJson()))
				.testCases(parseTestCases(exercise.getTestCasesJson()))  // ← THÊM MỚI
				.codeType(exercise.getCodeType())
				.testCode(exercise.getTestCode())
				.build();
	}

	private List<String> parseRequirements(String json) {
		if (json == null || json.isBlank()) return Collections.emptyList();
		try {
			return objectMapper.readValue(json, new TypeReference<List<String>>() {});
		} catch (Exception e) {
			return Collections.emptyList();
		}
	}

	private List<ExerciseResponse.QuizQuestionResponse> parseQuestions(String json) {
		if (json == null || json.isBlank()) return null;
		try {
			List<QuizQuestionRequest> list = objectMapper.readValue(
					json, new TypeReference<List<QuizQuestionRequest>>() {});
			return list.stream().map(q -> ExerciseResponse.QuizQuestionResponse.builder()
					.orderIndex(q.getOrderIndex())
					.questionText(q.getQuestionText())
					.optionA(q.getOptionA())
					.optionB(q.getOptionB())
					.optionC(q.getOptionC())
					.optionD(q.getOptionD())
					// correctAnswer KHÔNG map — ẩn với student
					.build()
			).toList();
		} catch (Exception e) {
			return Collections.emptyList();
		}
	}

	private List<ExerciseResponse.TeacherQuizQuestionResponse> parseTeacherQuestions(String json) {
		if (json == null || json.isBlank()) return null;
		try {
			List<QuizQuestionRequest> list = objectMapper.readValue(
					json, new TypeReference<List<QuizQuestionRequest>>() {});
			return list.stream().map(q -> ExerciseResponse.TeacherQuizQuestionResponse.builder()
					.orderIndex(q.getOrderIndex())
					.questionText(q.getQuestionText())
					.optionA(q.getOptionA())
					.optionB(q.getOptionB())
					.optionC(q.getOptionC())
					.optionD(q.getOptionD())
					.correctAnswer(q.getCorrectAnswer())   // ← teacher thấy
					.explanation(q.getExplanation())       // ← teacher thấy
					.build()
			).toList();
		} catch (Exception e) {
			return Collections.emptyList();
		}
	}

	/**
	 * Parse testCasesJson → List<TestCaseRequest>.
	 * Trả về null nếu không có data (type=QUIZ hoặc chưa setup).
	 * Teacher nhìn thấy đủ input + expectedOutput.
	 * Student chỉ thấy passed/failed qua RunCodeResponse — không qua đây.
	 */
	private List<TestCaseRequest> parseTestCases(String json) {
		if (json == null || json.isBlank()) return null;
		try {
			return objectMapper.readValue(json, new TypeReference<List<TestCaseRequest>>() {});
		} catch (Exception e) {
			return Collections.emptyList();
		}
	}
}