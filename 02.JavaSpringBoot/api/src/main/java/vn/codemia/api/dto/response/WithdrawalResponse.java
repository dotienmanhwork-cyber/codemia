package vn.codemia.api.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class WithdrawalResponse {

	private Integer id;
	private BigDecimal amount;
	private String status;           // PENDING | APPROVED | REJECTED
	private String note;             // Lý do reject (nếu có)
	private LocalDateTime createdAt;
	private LocalDateTime processedAt;

	// Chỉ admin thấy — thông tin teacher
	private String teacherId;
	private String teacherName;
	private String teacherEmail;
	private String bankAccountInfo;  // JSON string từ user_profiles
	private String processedBy;
	private String bankSnapshot;

	/**
	 * Loại nguồn gốc lệnh rút — computed, không lưu DB.
	 * Giá trị: TEACHER_MANUAL | DOWNGRADE_AUTO | COURSE_DELETED_HOLD |
	 *           COURSE_DELETED_CLAWBACK | ACCOUNT_BLOCKED
	 */
	private String withdrawalType;
}