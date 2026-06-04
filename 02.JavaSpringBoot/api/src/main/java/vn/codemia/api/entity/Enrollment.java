package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments",
		uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "course_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enrollment {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private String id;

	// DB dùng student_id — KHÔNG phải user_id
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "course_id", nullable = false)
	private Course course;

	// DB có progress_percent DECIMAL(5,2) → JPA map thành BigDecimal
	@Column(name = "progress_percent", nullable = false)
	@Builder.Default
	private BigDecimal progressPercent = BigDecimal.ZERO;

	@Column(name = "enrolled_at", nullable = false, updatable = false)
	@Builder.Default
	private LocalDateTime enrolledAt = LocalDateTime.now();

	// KHÔNG có: current_lesson_id (không tồn tại trong DB)
}