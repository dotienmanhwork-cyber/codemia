package vn.codemia.api.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.dto.request.ExerciseRequest;
import vn.codemia.api.dto.request.QuizQuestionRequest;
import vn.codemia.api.dto.request.SubmitRequest;
import vn.codemia.api.dto.request.TestCaseRequest;
import vn.codemia.api.dto.response.AiRunCodeResponse;
import vn.codemia.api.dto.response.ExerciseResponse;
import vn.codemia.api.dto.response.RunCodeResponse;
import vn.codemia.api.dto.response.SubmitExerciseResponse;
import vn.codemia.api.entity.*;
import vn.codemia.api.enums.ExerciseDifficulty;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.mapper.ExerciseMapper;
import vn.codemia.api.repository.*;
import vn.codemia.api.service.AiService;
import vn.codemia.api.service.ExerciseService;
import vn.codemia.api.service.PistonService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExerciseServiceImpl implements ExerciseService {

	// ── Ngưỡng điểm đạt ──────────────────────────────────────────────────
	private static final int QUIZ_PASS_THRESHOLD = 70;
	private static final int CODE_PASS_THRESHOLD = 60;

	// ── Dependencies ──────────────────────────────────────────────────────
	private final ExerciseRepository       exerciseRepository;
	private final ExerciseMapper           exerciseMapper;
	private final LessonRepository         lessonRepository;
	private final SectionRepository        sectionRepository;
	private final SubmissionRepository     submissionRepository;
	private final UserRepository           userRepository;
	private final EnrollmentRepository     enrollmentRepository;
	private final LessonProgressRepository lessonProgressRepository;
	private final AiService                aiService;   // vẫn dùng cho QUIZ + AI feedback
	private final PistonService            pistonService;
	private final ObjectMapper             objectMapper;

	// =========================================================================
	//  GET EXERCISE
	// =========================================================================

	@Override
	public ExerciseResponse getExerciseByLessonId(Integer lessonId) {
		Exercise exercise = exerciseRepository.findByLessonId(lessonId)
				.stream().findFirst()
				.orElseThrow(() -> new AppException(ErrorCode.EXERCISE_NOT_FOUND));
		return exerciseMapper.toResponse(exercise);
	}

	// =========================================================================
	//  CREATE / UPDATE / DELETE
	// =========================================================================

	@Override
	public ExerciseResponse createExercise(ExerciseRequest request) {
		Lesson lesson = lessonRepository.findById(request.getLessonId())
				.orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

		Exercise exercise = Exercise.builder()
				.lesson(lesson)
				.type(request.getType())
				.title(request.getTitle())
				.description(request.getDescription())
				.difficulty(request.getDifficulty() != null
						? ExerciseDifficulty.valueOf(request.getDifficulty())
						: ExerciseDifficulty.EASY)
				.maxScore(request.getMaxScore() != null ? request.getMaxScore() : 100)
				.tag(request.getTag())
				.timeEstimate(request.getTimeEstimate())
				.language(request.getLanguage())
				.starterCode(request.getStarterCode())
				.fileName(request.getFileName())
				.codeType(request.getCodeType())
				.testCode(request.getTestCode())
				.requirements(serializeToJson(request.getRequirements()))
				.questionsJson(serializeToJson(request.getQuestions()))
				.testCasesJson(serializeToJson(request.getTestCases()))
				.build();

		return exerciseMapper.toResponse(exerciseRepository.save(exercise));
	}

	@Override
	public ExerciseResponse updateExercise(Integer exerciseId, ExerciseRequest request) {
		Exercise exercise = exerciseRepository.findById(exerciseId)
				.orElseThrow(() -> new AppException(ErrorCode.EXERCISE_NOT_FOUND));

		exercise.setTitle(request.getTitle());
		exercise.setDescription(request.getDescription());
		if (request.getDifficulty() != null)
			exercise.setDifficulty(ExerciseDifficulty.valueOf(request.getDifficulty()));
		exercise.setTag(request.getTag());
		exercise.setTimeEstimate(request.getTimeEstimate());
		if (request.getMaxScore() != null) exercise.setMaxScore(request.getMaxScore());

		if ("CODE".equals(exercise.getType())) {
			exercise.setLanguage(request.getLanguage());
			exercise.setStarterCode(request.getStarterCode());
			exercise.setFileName(request.getFileName());
			exercise.setCodeType(request.getCodeType());
			exercise.setTestCode(request.getTestCode());
			exercise.setRequirements(serializeToJson(request.getRequirements()));
			exercise.setTestCasesJson(serializeToJson(request.getTestCases()));
		} else {
			exercise.setQuestionsJson(serializeToJson(request.getQuestions()));
		}

		return exerciseMapper.toResponse(exerciseRepository.save(exercise));
	}

	@Override
	public void deleteExercise(Integer exerciseId) {
		Exercise exercise = exerciseRepository.findById(exerciseId)
				.orElseThrow(() -> new AppException(ErrorCode.EXERCISE_NOT_FOUND));
		exerciseRepository.delete(exercise);
	}

	// =========================================================================
	//  RUN CODE — chạy thử qua Piston, không lưu submission
	// =========================================================================

	@Override
	public RunCodeResponse runCode(Integer exerciseId, String code) {
		Exercise exercise = exerciseRepository.findById(exerciseId)
				.orElseThrow(() -> new AppException(ErrorCode.EXERCISE_NOT_FOUND));

		// Nánh UNIT_TEST
		if ("UNIT_TEST".equals(exercise.getCodeType())) {
			if (exercise.getTestCode() == null || exercise.getTestCode().isBlank()) {
				log.warn("[RUN] exerciseId={} UNIT_TEST nhưng chưa có testCode", exerciseId);
				return RunCodeResponse.builder()
						.hasError(true)
						.errorType("ConfigError")
						.errorMessage("Bài tập chưa được cấu hình test code. Vui lòng liên hệ giảng viên.")
						.testCases(List.of())
						.build();
			}
			return pistonService.executeUnitTest(
					code,
					exercise.getTestCode(),
					exercise.getLanguage(),
					exercise.getFileName() != null ? exercise.getFileName() : "Main.java"
			);
		}

		// Nánh STANDARD (mặc định)
		List<TestCaseRequest> testCases = parseTestCasesList(exercise.getTestCasesJson());

		// Nếu chưa có test cases → fallback AI review (tạm thời)
		if (testCases.isEmpty()) {
			log.warn("[RUN] exerciseId={} chưa có test cases → fallback AI review", exerciseId);
			return runCodeFallbackAI(exercise, code);
		}

		return pistonService.execute(
				code,
				exercise.getLanguage(),
				exercise.getFileName() != null ? exercise.getFileName() : "Main.java",
				testCases
		);
	}

	/**
	 * Fallback: bài tập chưa có test cases → dùng AI review tạm thời.
	 * FIXED: dùng AiRunCodeResponse (có issues/errorExplanation),
	 *        map sang RunCodeResponse (Piston format) để FE dùng chung 1 shape.
	 */
	private RunCodeResponse runCodeFallbackAI(Exercise exercise, String code) {
		try {
			List<String> reqs = parseRequirementsList(exercise.getRequirements());

			// FIXED: AiRunCodeResponse thay vì RunCodeResponse cũ
			AiRunCodeResponse aiResponse = aiService.runCode(
					code,
					exercise.getLanguage(),
					exercise.getDescription(),
					reqs
			);

			boolean hasError = aiResponse.isHasError();
			List<RunCodeResponse.TestCaseResult> tcResults = new ArrayList<>();

			if (!hasError && aiResponse.getIssues() != null) {
				for (int i = 0; i < aiResponse.getIssues().size(); i++) {
					String issue = aiResponse.getIssues().get(i);
					if (issue != null && issue.toLowerCase().contains("không có vấn đề")) continue;
					tcResults.add(RunCodeResponse.TestCaseResult.builder()
							.index(i)
							.label("Vấn đề " + (i + 1))
							.passed(false)
							.message(issue)
							.hidden(false)
							.build());
				}
			}

			// Nếu AI không phát hiện vấn đề gì → hiện warning "chưa có test cases"
			// KHÔNG trả passed=true vì chưa chạy thật qua Piston
			if (tcResults.isEmpty() && !hasError) {
				tcResults.add(RunCodeResponse.TestCaseResult.builder()
						.index(0)
						.label("Chưa có test cases")
						.passed(false)
						.message("Bài tập chưa được cấu hình test cases. Kết quả AI review chỉ mang tính tham khảo, không tính điểm chính thức.")
						.hidden(false)
						.build());
			}

			return RunCodeResponse.builder()
					.hasError(hasError)
					.errorType(hasError ? "RunError" : null)
					.errorMessage(hasError ? aiResponse.getErrorExplanation() : null)
					.testCases(tcResults)
					.build();

		} catch (Exception e) {
			log.error("[RUN] Fallback AI error: {}", e.getMessage());
			return RunCodeResponse.builder()
					.hasError(true)
					.errorType("ServerError")
					.errorMessage("Không thể kiểm tra code. Vui lòng thử lại.")
					.testCases(List.of())
					.build();
		}
	}

	// =========================================================================
	//  SUBMIT EXERCISE — Piston chấm CODE, AI vẫn chấm QUIZ
	// =========================================================================

	@Override
	@Transactional
	public SubmitExerciseResponse submitExercise(Integer lessonId, SubmitRequest request) {

		// ── 1. Lấy student ────────────────────────────────────────────────
		String studentEmail = SecurityContextHolder.getContext()
				.getAuthentication().getName();
		User student = userRepository.findByEmail(studentEmail)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		String studentId = student.getId();

		// ── 2. Lấy exercise & lesson ──────────────────────────────────────
		Exercise exercise = exerciseRepository.findByLessonId(lessonId)
				.stream().findFirst()
				.orElseThrow(() -> new AppException(ErrorCode.EXERCISE_NOT_FOUND));
		Lesson lesson = exercise.getLesson();

		// ── 3. Chấm điểm ──────────────────────────────────────────────────
		SubmitExerciseResponse submitResponse;

		if ("CODE".equals(exercise.getType())) {
			submitResponse = gradeCodeWithPiston(exercise, request.getCode());
		} else {
			// QUIZ vẫn dùng AI
			List<QuizQuestionRequest> questions = parseQuestionsList(exercise.getQuestionsJson());
			submitResponse = aiService.evaluateQuiz(questions, request.getAnswers());
		}

		// ── 4. Tính pass/status theo ngưỡng ──────────────────────────────
		int threshold = "CODE".equals(exercise.getType())
				? CODE_PASS_THRESHOLD : QUIZ_PASS_THRESHOLD;
		boolean passed = submitResponse.getScore() >= threshold;
		String status  = passed ? "PASSED" : "SUBMITTED";

		// ── 5. attemptNumber ──────────────────────────────────────────────
		int attemptNumber = submissionRepository
				.countByStudentIdAndExerciseId(studentId, exercise.getId()) + 1;

		// ── 6. Lưu Submission ─────────────────────────────────────────────
		Submission submission = Submission.builder()
				.exercise(exercise)
				.student(student)
				.submittedContent(serializeToJson(request))
				.score(submitResponse.getScore())
				.aiFeedback(submitResponse.getAiFeedback())
				.status(status)
				.attemptNumber(attemptNumber)
				.build();
		submissionRepository.save(submission);

		// ── 7. Cập nhật LessonProgress ────────────────────────────────────
		String courseId = lesson.getSection().getCourse().getId();
		Enrollment enrollment = enrollmentRepository
				.findByStudentIdAndCourseId(studentId, courseId)
				.orElseThrow(() -> new AppException(ErrorCode.NOT_ENROLLED));

		LessonProgress progress = lessonProgressRepository
				.findByEnrollmentIdAndLessonId(enrollment.getId(), lesson.getId())
				.orElseGet(() -> LessonProgress.builder()
						.enrollment(enrollment).lesson(lesson).isCompleted(false).build());

		boolean lessonCompleted = false;
		if (passed) {
			progress.setIsCompleted(true);
			progress.setCompletedAt(LocalDateTime.now());
			lessonProgressRepository.save(progress);
			lessonCompleted = true;
			log.info("[SUBMIT] {} PASSED lessonId={} score={}/{}", studentEmail, lessonId,
					submitResponse.getScore(), threshold);
		} else {
			if (progress.getId() == null) lessonProgressRepository.save(progress);
			log.info("[SUBMIT] {} SUBMITTED lessonId={} score={}/{} attempt={}", studentEmail,
					lessonId, submitResponse.getScore(), threshold, attemptNumber);
		}

		// ── 8. Next lesson ────────────────────────────────────────────────
		Lesson nextLesson = findNextLesson(lesson, courseId);

		// ── 9. Build response ─────────────────────────────────────────────
		submitResponse.setPassed(passed);
		submitResponse.setStatus(status);
		submitResponse.setAttemptNumber(attemptNumber);
		submitResponse.setLessonCompleted(lessonCompleted);
		submitResponse.setCanRetry(!passed);
		submitResponse.setMessage(buildMessage(passed, submitResponse.getScore(), threshold));
		submitResponse.setHasNextLesson(nextLesson != null);
		submitResponse.setNextLessonId(nextLesson != null ? nextLesson.getId() : null);
		submitResponse.setNextLessonTitle(nextLesson != null ? nextLesson.getTitle() : null);

		return submitResponse;
	}

	// =========================================================================
	//  Chấm CODE bằng Piston
	// =========================================================================

	private SubmitExerciseResponse gradeCodeWithPiston(Exercise exercise, String code) {
		// Nánh UNIT_TEST
		if ("UNIT_TEST".equals(exercise.getCodeType())) {
			return gradeCodeWithUnitTest(exercise, code);
		}

		// Nánh STANDARD (mặc định)
		List<TestCaseRequest> testCases = parseTestCasesList(exercise.getTestCasesJson());

		// Chưa có test cases → AI review nhưng KHÔNG cho pass
		// Teacher phải thêm test cases để Piston chấm chính xác
		if (testCases.isEmpty()) {
			log.warn("[SUBMIT] exerciseId={} chưa có test cases → AI review, score capped at 0", exercise.getId());
			List<String> reqs = parseRequirementsList(exercise.getRequirements());
			SubmitExerciseResponse aiResult = aiService.evaluateCode(
					code, exercise.getLanguage(), exercise.getDescription(), reqs);
			// Cap score = 0 khi chưa có test cases để tránh false-pass
			aiResult.setScore(0);
			aiResult.setPassed(false);
			if (aiResult.getAiFeedback() == null || aiResult.getAiFeedback().isBlank()) {
				aiResult.setAiFeedback("Bài tập chưa có test cases. Teacher cần thêm test cases để chấm điểm chính xác.");
			}
			return aiResult;
		}

		// Chạy Piston
		RunCodeResponse pistonResult = pistonService.execute(
				code,
				exercise.getLanguage(),
				exercise.getFileName() != null ? exercise.getFileName() : "Main.java",
				testCases
		);

		// Compile error → score = 0
		if (pistonResult.isHasError()) {
			return SubmitExerciseResponse.builder()
					.score(0)
					.passed(false)
					.aiFeedback("Code bị lỗi biên dịch: " + pistonResult.getErrorMessage())
					.requirementResults(buildFailedRequirements(testCases))
					.build();
		}

		// Tính score từ test cases
		List<RunCodeResponse.TestCaseResult> results = pistonResult.getTestCases();
		int total  = results.size();
		int passed = (int) results.stream().filter(RunCodeResponse.TestCaseResult::isPassed).count();
		int score  = total > 0
				? (int) Math.round((double) passed / total * (exercise.getMaxScore() != null
															  ? exercise.getMaxScore() : 100))
				: 0;

		// Map sang requirementResults
		List<SubmitExerciseResponse.RequirementResult> reqResults = results.stream()
				.map(tc -> SubmitExerciseResponse.RequirementResult.builder()
						.requirement(tc.getLabel())
						.passed(tc.isPassed())
						.note(buildNote(tc))
						.build())
				.toList();

		// Gọi AI viết feedback nếu có test case fail (không chấm điểm, chỉ giải thích)
		String aiFeedback = null;
		long failedCount = results.stream().filter(tc -> !tc.isPassed()).count();
		if (failedCount > 0) {
			try {
				aiFeedback = aiService.explainFailures(
						code,
						exercise.getLanguage(),
						results.stream()
								.filter(tc -> !tc.isPassed())
								.map(tc -> tc.getLabel() + ": " + buildNote(tc))
								.toList()
				);
			} catch (Exception e) {
				log.warn("[SUBMIT] AI feedback failed: {}", e.getMessage());
			}
		}

		return SubmitExerciseResponse.builder()
				.score(score)
				.passed(false) // override ở bước 4 theo threshold
				.aiFeedback(aiFeedback)
				.requirementResults(reqResults)
				.build();
	}

	// =========================================================================
	//  Chấm CODE kiểu UNIT_TEST
	// =========================================================================

	private SubmitExerciseResponse gradeCodeWithUnitTest(Exercise exercise, String code) {
		if (exercise.getTestCode() == null || exercise.getTestCode().isBlank()) {
			log.warn("[SUBMIT] exerciseId={} UNIT_TEST nhưng chưa có testCode → score = 0", exercise.getId());
			return SubmitExerciseResponse.builder()
					.score(0)
					.passed(false)
					.aiFeedback("Bài tập chưa có test code. Teacher cần thêm test code để chấm điểm.")
					.requirementResults(List.of())
					.build();
		}

		RunCodeResponse pistonResult = pistonService.executeUnitTest(
				code,
				exercise.getTestCode(),
				exercise.getLanguage(),
				exercise.getFileName() != null ? exercise.getFileName() : "Main.java"
		);

		// Compile error → score = 0
		if (pistonResult.isHasError()) {
			return SubmitExerciseResponse.builder()
					.score(0)
					.passed(false)
					.aiFeedback("Code bị lỗi biên dịch: " + pistonResult.getErrorMessage())
					.requirementResults(List.of(
							SubmitExerciseResponse.RequirementResult.builder()
									.requirement("Unit Test")
									.passed(false)
									.note("Compile error: " + pistonResult.getErrorMessage())
									.build()
					))
					.build();
		}

		// Kết quả từ unit test duy nhất
		List<RunCodeResponse.TestCaseResult> results = pistonResult.getTestCases();
		boolean unitTestPassed = !results.isEmpty() && results.get(0).isPassed();
		int score = unitTestPassed
				? (exercise.getMaxScore() != null ? exercise.getMaxScore() : 100)
				: 0;

		List<SubmitExerciseResponse.RequirementResult> reqResults = results.stream()
				.map(tc -> SubmitExerciseResponse.RequirementResult.builder()
						.requirement(tc.getLabel())
						.passed(tc.isPassed())
						.note(tc.isPassed() ? null : tc.getMessage())
						.build())
				.toList();

		// AI feedback nếu fail
		String aiFeedback = null;
		if (!unitTestPassed) {
			try {
				String failNote = results.isEmpty() ? "Unit test thất bại"
						: results.get(0).getMessage();
				aiFeedback = aiService.explainFailures(
						code,
						exercise.getLanguage(),
						List.of("Unit Test: " + (failNote != null ? failNote : "không pass"))
				);
			} catch (Exception e) {
				log.warn("[SUBMIT] AI feedback (unitTest) failed: {}", e.getMessage());
			}
		}

		return SubmitExerciseResponse.builder()
				.score(score)
				.passed(false) // override ở bước 4 theo threshold
				.aiFeedback(aiFeedback)
				.requirementResults(reqResults)
				.build();
	}

	private String buildNote(RunCodeResponse.TestCaseResult tc) {
		if (tc.getMessage() != null) return tc.getMessage();
		if (!tc.isPassed() && !tc.isHidden() && tc.getExpected() != null)
			return "Expected: " + tc.getExpected() + " | Got: " + tc.getActual();
		if (!tc.isPassed()) return "Test case không đạt";
		return null;
	}

	private List<SubmitExerciseResponse.RequirementResult> buildFailedRequirements(
			List<TestCaseRequest> testCases) {
		return testCases.stream()
				.map(tc -> SubmitExerciseResponse.RequirementResult.builder()
						.requirement(tc.getLabel() != null ? tc.getLabel() : "Test case")
						.passed(false)
						.note("Compile error")
						.build())
				.toList();
	}

	// =========================================================================
	//  Tìm lesson kế tiếp
	// =========================================================================

	private Lesson findNextLesson(Lesson currentLesson, String courseId) {
		Integer sectionId = currentLesson.getSection().getId();
		List<Lesson> siblings = lessonRepository.findBySectionIdOrderByOrderIndexAsc(sectionId);

		for (int i = 0; i < siblings.size() - 1; i++) {
			if (siblings.get(i).getId().equals(currentLesson.getId()))
				return siblings.get(i + 1);
		}

		List<Section> sections = sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
		for (int i = 0; i < sections.size() - 1; i++) {
			if (sections.get(i).getId().equals(currentLesson.getSection().getId())) {
				List<Lesson> next = lessonRepository
						.findBySectionIdOrderByOrderIndexAsc(sections.get(i + 1).getId());
				if (!next.isEmpty()) return next.get(0);
			}
		}
		return null;
	}

	// =========================================================================
	//  Helpers
	// =========================================================================

	private String buildMessage(boolean passed, int score, int threshold) {
		if (passed)
			return String.format("🎉 Chúc mừng! Bạn đạt %d điểm – bài học đã hoàn thành.", score);
		return String.format("Bạn đạt %d điểm (cần %d để qua). Xem lại và thử nộp lại nhé!", score, threshold);
	}

	private String serializeToJson(Object obj) {
		if (obj == null) return null;
		try { return objectMapper.writeValueAsString(obj); }
		catch (Exception e) { return null; }
	}

	private List<String> parseRequirementsList(String json) {
		if (json == null || json.isBlank()) return Collections.emptyList();
		try { return objectMapper.readValue(json, new TypeReference<List<String>>() {}); }
		catch (Exception e) { return Collections.emptyList(); }
	}

	private List<QuizQuestionRequest> parseQuestionsList(String json) {
		if (json == null || json.isBlank()) return Collections.emptyList();
		try { return objectMapper.readValue(json, new TypeReference<List<QuizQuestionRequest>>() {}); }
		catch (Exception e) { return Collections.emptyList(); }
	}

	private List<TestCaseRequest> parseTestCasesList(String json) {
		if (json == null || json.isBlank()) return Collections.emptyList();
		try { return objectMapper.readValue(json, new TypeReference<List<TestCaseRequest>>() {}); }
		catch (Exception e) { return Collections.emptyList(); }
	}
}