package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import vn.codemia.api.enums.RefundReason;
import vn.codemia.api.enums.RefundStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "refund_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private String id;

	// Student nhận hoàn tiền
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	// nullable — course có thể bị xóa (ON DELETE SET NULL)
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "course_id", nullable = true)
	@OnDelete(action = OnDeleteAction.SET_NULL)
	private Course course;

	// Snapshot tên course — vẫn hiển thị được khi course đã bị xóa
	@Column(name = "course_title")
	private String courseTitle;

	// Giao dịch gốc (nullable — phòng khi order bị xóa)
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_id", nullable = true)
	@OnDelete(action = OnDeleteAction.SET_NULL)
	private Order order;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal amount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private RefundReason reason;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	@Builder.Default
	private RefundStatus status = RefundStatus.WAITING_BANK_INFO;

	// ── Bank snapshot tại thời điểm tạo request ───────────────────────────
	// Đảm bảo admin luôn thấy đúng STK, dù student cập nhật bank sau này.
	// null khi status = WAITING_BANK_INFO (student chưa có bank info)
	@Column(name = "bank_name")
	private String bankName;

	@Column(name = "bank_account_number")
	private String bankAccountNumber;

	@Column(name = "bank_account_name")
	private String bankAccountName;

	// ── Admin xử lý ───────────────────────────────────────────────────────
	@Column(name = "admin_note", columnDefinition = "TEXT")
	private String adminNote;

	/** Email admin mark COMPLETED hoặc CANCELLED */
	@Column(name = "resolved_by")
	private String resolvedBy;

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "resolved_at")
	private LocalDateTime resolvedAt;
}