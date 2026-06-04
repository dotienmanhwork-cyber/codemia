package vn.codemia.api.service;

import org.springframework.data.domain.Page;
import vn.codemia.api.dto.response.RefundResponse;

public interface RefundService {

	/**
	 * Tạo RefundRequest cho tất cả student đã enrolled trong course.
	 * Gọi khi Admin xóa course (DELETE_COURSE).
	 * Bỏ qua student đã được refund hoặc enroll khóa học miễn phí.
	 *
	 * @return số RefundRequest được tạo mới
	 */
	int createRefundsForCourse(String courseId);

	/**
	 * Tạo RefundRequest cho tất cả student của các course PUBLISHED/UNLISTED/SUSPENDED
	 * của teacher bị hạ role (DOWNGRADE_TEACHER).
	 *
	 * @return tổng số RefundRequest được tạo mới
	 */
	int createRefundsForTeacherCourses(String teacherId);

	/**
	 * Trigger khi student cập nhật thông tin ngân hàng trong Profile.
	 * Tự động chuyển các RefundRequest WAITING_BANK_INFO → PENDING
	 * và ghi lại bank snapshot mới.
	 */
	void onStudentBankInfoUpdated(String studentId);

	// ── Admin API ──────────────────────────────────────────────────────────

	/** Lấy danh sách refund với filter theo status (null = tất cả). */
	Page<RefundResponse> getAllRefunds(String status, int page, int size);

	/** Admin mark refund là đã hoàn tiền. */
	void markCompleted(String refundId, String adminNote, String adminEmail);

	/** Admin huỷ refund (VD: restore course trước khi xử lý xong). */
	void cancelRefund(String refundId, String adminEmail);

	/** Gửi lại notification nhắc student cập nhật bank info. */
	void remindStudent(String refundId);
}
