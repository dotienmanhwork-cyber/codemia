package vn.codemia.api.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class TeacherBalanceResponse {

	// Tổng tiền teacher đã earned (từ order_details.teacher_earnings)
	private BigDecimal totalEarned;

	// Tổng tiền đã được approved withdrawal
	private BigDecimal totalWithdrawn;

	// Số dư có thể rút = totalEarned - totalWithdrawn
	private BigDecimal availableBalance;

	// Thông tin tài khoản ngân hàng — hiển thị sẵn trong modal rút tiền
	private String bankAccountInfo;
}