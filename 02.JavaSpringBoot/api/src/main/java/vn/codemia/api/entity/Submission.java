package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private String id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "exercise_id", nullable = false)
	private Exercise exercise;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	@Column(name = "submitted_content", columnDefinition = "TEXT", nullable = false)
	private String submittedContent;

	@Column(name = "score")
	private Integer score;

	@Column(name = "ai_feedback", columnDefinition = "TEXT")
	private String aiFeedback;

	/**
	 * PASSED   → đạt ngưỡng (QUIZ >= 70, CODE >= 60)
	 * SUBMITTED → chưa đạt, được phép nộp lại không giới hạn
	 */
	@Column(name = "status", length = 20, nullable = false)
	@Builder.Default
	private String status = "SUBMITTED";

	/** Lần nộp thứ mấy cho exercise này, bắt đầu từ 1 */
	@Column(name = "attempt_number", nullable = false)
	@Builder.Default
	private Integer attemptNumber = 1;

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;
}