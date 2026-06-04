package vn.codemia.api.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class RefundResponse {

	private String     id;

	// Student info
	private String     studentId;
	private String     studentName;
	private String     studentEmail;

	// Course info — courseTitle vẫn hiển thị kể cả khi course đã bị xóa
	private String     courseId;       // null nếu course đã xóa
	private String     courseTitle;    // snapshot — luôn có

	// Giao dịch gốc
	private String     orderId;

	// Tài chính
	private BigDecimal amount;
	private String     reason;         // RefundReason.name()
	private String     status;         // RefundStatus.name()

	// Bank snapshot — null khi status = WAITING_BANK_INFO
	private String     bankName;
	private String     bankAccountNumber;
	private String     bankAccountName;

	// Admin
	private String     adminNote;
	private String     resolvedBy;
	private LocalDateTime createdAt;
	private LocalDateTime resolvedAt;
}