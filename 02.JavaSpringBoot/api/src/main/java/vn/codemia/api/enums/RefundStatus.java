package vn.codemia.api.enums;

public enum RefundStatus {
	/** Student chưa có thông tin ngân hàng — chờ student cập nhật */
	WAITING_BANK_INFO,
	/** Bank info đã có — chờ Admin chuyển khoản thủ công */
	PENDING,
	/** Admin đã chuyển khoản và mark hoàn tất */
	COMPLETED,
	/** Huỷ refund (VD: admin restore course trước khi xử lý) */
	CANCELLED
}