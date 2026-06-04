package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
		name = "certificates",
		uniqueConstraints = @UniqueConstraint(
				name = "uq_student_course",
				columnNames = {"student_id", "course_id"}
		)
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Certificate {

	/** UUID — đồng thời là verifyCode public */
	@Id
	private String id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "course_id", nullable = false)
	private Course course;

	/** Snapshot tên khóa học tại thời điểm cấp — giữ nguyên dù course bị đổi tên */
	@Column(name = "course_title", nullable = false)
	private String courseTitle;

	/** Snapshot tên giảng viên tại thời điểm cấp */
	@Column(name = "instructor_name", nullable = false)
	private String instructorName;

	@Column(name = "issued_at", nullable = false)
	private LocalDateTime issuedAt;
}