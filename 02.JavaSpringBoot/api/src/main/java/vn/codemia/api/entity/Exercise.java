package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.codemia.api.enums.ExerciseDifficulty;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exercise {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "lesson_id", nullable = false)
	private Lesson lesson;

	@Column(nullable = false)
	private String type;           // "QUIZ" | "CODE"

	@Column(nullable = false)
	private String title;

	@Column(columnDefinition = "TEXT")
	private String description;

	@Column(nullable = true)
	private String language;       // "java", "python", ... — null khi type="QUIZ"

	@Column(name = "max_score")
	private Integer maxScore;

	@Column(name = "starter_code", columnDefinition = "TEXT")
	private String starterCode;

	@Column(name = "file_name")
	private String fileName;       // e.g. "Main.java"

	@Column(name = "tag")
	private String tag;

	@Column(name = "time_estimate")
	private String timeEstimate;

	/** Lưu dạng JSON array string: ["Yêu cầu 1", "Yêu cầu 2"] */
	@Column(name = "requirements", columnDefinition = "TEXT")
	private String requirements;

	/** Lưu dạng JSON array QuizQuestionRequest — chỉ dùng khi type="QUIZ" */
	@Column(name = "questions_json", columnDefinition = "TEXT")
	private String questionsJson;

	/**
	 * ← THÊM MỚI: Lưu dạng JSON array TestCaseRequest.
	 * Dùng khi type="CODE" để Piston chạy thật.
	 * Migration: ALTER TABLE exercises ADD COLUMN test_cases_json TEXT;
	 */
	@Column(name = "test_cases_json", columnDefinition = "TEXT")
	private String testCasesJson;

	/**
	 * Loại chấm bài CODE: "STANDARD" (stdin/stdout) hoặc "UNIT_TEST" (teacher nhập test code).
	 * Mặc định null → xử lý như STANDARD để tương thích ngược.
	 * Migration: ALTER TABLE exercises ADD COLUMN code_type VARCHAR(20) DEFAULT 'STANDARD';
	 */
	@Column(name = "code_type")
	private String codeType;

	/**
	 * Test code do teacher viết (chỉ dùng khi codeType = UNIT_TEST).
	 * Piston ghép student code + test code vào 1 file rồi chạy.
	 * Migration: ALTER TABLE exercises ADD COLUMN test_code TEXT;
	 */
	@Column(name = "test_code", columnDefinition = "TEXT")
	private String testCode;

	@Enumerated(EnumType.STRING)
	@Column(name = "difficulty", columnDefinition = "ENUM('EASY','MEDIUM','HARD') DEFAULT 'EASY'")
	@Builder.Default
	private ExerciseDifficulty difficulty = ExerciseDifficulty.EASY;
}
