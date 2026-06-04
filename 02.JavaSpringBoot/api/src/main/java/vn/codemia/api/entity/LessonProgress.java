package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_progress",
		uniqueConstraints = @UniqueConstraint(columnNames = {"enrollment_id", "lesson_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonProgress {

	// DB: id INT AUTO_INCREMENT — KHÔNG phải UUID
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "enrollment_id", nullable = false)
	private Enrollment enrollment;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "lesson_id", nullable = false)
	private Lesson lesson;

	// DB: is_completed BOOLEAN DEFAULT FALSE — KHÔNG có status String hay video_timestamp
	@Column(name = "is_completed", nullable = false)
	@Builder.Default
	private Boolean isCompleted = false;

	// DB có completed_at TIMESTAMP NULL
	@Column(name = "completed_at")
	private LocalDateTime completedAt;

	// KHÔNG có: status, videoTimestamp (không tồn tại trong DB)
}