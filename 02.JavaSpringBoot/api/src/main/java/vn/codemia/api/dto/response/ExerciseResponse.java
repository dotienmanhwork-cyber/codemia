package vn.codemia.api.dto.response;

import lombok.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import vn.codemia.api.dto.request.TestCaseRequest;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseResponse {

	private Integer id;
	private Integer lessonId;
	private String type;
	private String title;
	private String description;
	private String language;
	private Integer maxScore;
	private String starterCode;
	private String fileName;
	private String tag;
	@JsonProperty("timeEstimate")
	private String time;   // Java field giữ nguyên, JSON serialize ra "timeEstimate"
	private List<String> requirements;
	private String difficulty;

	/**
	 * Dùng cho STUDENT — KHÔNG chứa correctAnswer và explanation.
	 * Nếu type=CODE thì null.
	 */
	private List<QuizQuestionResponse> questions;

	/**
	 * Dùng cho TEACHER (edit form) — chứa đầy đủ correctAnswer và explanation.
	 * Chỉ được populate bởi TeacherExerciseController, null với student.
	 */
	private List<TeacherQuizQuestionResponse> teacherQuestions;

	private List<TestCaseRequest> testCases;

	/** "STANDARD" | "UNIT_TEST" — teacher cần để hiển thị đúng tab trong edit form */
	private String codeType;

	/** Unit test code do teacher nhập — chỉ trả về cho teacher, không expose student */
	private String testCode;

	// ─── Student view: ẩn correctAnswer + explanation ────────────────────────
	@Getter
	@Setter
	@NoArgsConstructor
	@AllArgsConstructor
	@Builder
	public static class QuizQuestionResponse {
		private Integer orderIndex;
		private String questionText;
		private String optionA;
		private String optionB;
		private String optionC;
		private String optionD;
		// correctAnswer — ẩn với student
		// explanation   — chỉ lộ sau submit qua SubmitExerciseResponse
	}

	// ─── Teacher view: đầy đủ để hiển thị form edit ──────────────────────────
	@Getter
	@Setter
	@NoArgsConstructor
	@AllArgsConstructor
	@Builder
	public static class TeacherQuizQuestionResponse {
		private Integer orderIndex;
		private String questionText;
		private String optionA;
		private String optionB;
		private String optionC;
		private String optionD;
		private String correctAnswer;   // "A" | "B" | "C" | "D"
		private String explanation;
	}
}