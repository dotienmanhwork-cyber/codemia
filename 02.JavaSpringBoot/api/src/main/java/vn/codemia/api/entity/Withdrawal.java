package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "withdrawal_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Withdrawal {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "teacher_id", nullable = false)
	private User teacher;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal amount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	@Builder.Default
	private WithdrawalStatus status = WithdrawalStatus.PENDING;

	// Lý do reject hoặc hold — null nếu APPROVED
	@Column(columnDefinition = "TEXT")
	private String note;

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	// Thời điểm admin bấm approve/reject/hold
	@Column(name = "processed_at")
	private LocalDateTime processedAt;

	// Email admin xử lý — để audit
	@Column(name = "processed_by")
	private String processedBy;

	/**
	 * Snapshot bank_account_info (JSON) từ UserProfile tại thời điểm tạo request.
	 * Đảm bảo admin luôn thấy đúng STK teacher muốn nhận tiền,
	 * dù teacher có cập nhật bank sau này.
	 */
	@Column(name = "bank_snapshot", columnDefinition = "TEXT")
	private String bankSnapshot;

	public enum WithdrawalStatus {
		PENDING,
		APPROVED,
		REJECTED,
		/** Tài khoản teacher bị hạ role — request bị giữ lại chờ xử lý thủ công */
		HOLD,
		/** Bị hủy tự động bởi hệ thống — thường do downgrade role, superseded bởi 1 lệnh gộp mới */
		CANCELLED
	}
}