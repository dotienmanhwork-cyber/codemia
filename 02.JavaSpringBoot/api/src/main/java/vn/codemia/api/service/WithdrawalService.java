package vn.codemia.api.service;

import org.springframework.data.domain.Page;
import vn.codemia.api.dto.response.TeacherBalanceResponse;
import vn.codemia.api.dto.response.WithdrawalResponse;

import java.math.BigDecimal;
import java.util.List;

public interface WithdrawalService {

	// ── Teacher ──────────────────────────────────────────────────────────────

	/** Số dư khả dụng + bank info — hiển thị trước khi tạo request */
	TeacherBalanceResponse getMyBalance();

	/** Tạo withdrawal request — validate balance trước khi lưu */
	WithdrawalResponse requestWithdrawal(BigDecimal amount);

	/** Lịch sử rút tiền của teacher đang đăng nhập */
	List<WithdrawalResponse> getMyWithdrawals();

	// ── Admin ─────────────────────────────────────────────────────────────────

	/** Tất cả withdrawal requests — filter theo status nếu có (không phân trang, dùng nội bộ) */
	List<WithdrawalResponse> getAllWithdrawals(String status);

	/** Tất cả withdrawal requests — filter theo status, có phân trang — dùng cho admin list */
	Page<WithdrawalResponse> getAllWithdrawals(String status, int page, int size);

	/** Approve request — cập nhật status + ghi processedBy */
	void approveWithdrawal(Integer id);

	/** Reject request + lý do */
	void rejectWithdrawal(Integer id, String note);

	/**
	 * Gửi notification nhắc teacher cập nhật bank info.
	 * Chỉ áp dụng khi withdrawal có status = HOLD và bankSnapshot = null
	 * (tức là HOLD do hạ role nhưng teacher chưa có bank info).
	 *
	 * Throws INVALID_REQUEST nếu withdrawal không ở trạng thái cần nhắc.
	 */
	void remindTeacher(Integer id);

	/**
	 * Admin đánh dấu lệnh HOLD là đã xử lý thủ công xong → chuyển HOLD → APPROVED.
	 * Khác approveWithdrawal() chỉ cho phép PENDING.
	 *
	 * Áp dụng cho mọi loại HOLD (hạ role, xóa course, khóa tài khoản).
	 * @param id         withdrawal id
	 * @param note       ghi chú của admin (tùy chọn)
	 * @param adminEmail email admin thực hiện — để audit
	 */
	void completeHoldWithdrawal(Integer id, String note, String adminEmail);

	/**
	 * Trigger khi teacher cập nhật thông tin ngân hàng trong Profile.
	 * Tự động chuyển các Withdrawal HOLD-chưa-có-bank → PENDING
	 * và ghi lại bankSnapshot mới.
	 *
	 * Hook vào: UserServiceImpl / UserProfileServiceImpl khi update bank info.
	 * Mirror của RefundService.onStudentBankInfoUpdated().
	 */
	void onTeacherBankInfoUpdated(String teacherId);
}