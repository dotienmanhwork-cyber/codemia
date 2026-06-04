package vn.codemia.api.enums;

/**
 * Phân loại nguồn gốc của một withdrawal request.
 * Được tính toán tại thời điểm map sang WithdrawalResponse (không lưu vào DB).
 *
 * Dùng để admin phân biệt ngay trên bảng yêu cầu rút tiền mà không cần đọc note.
 */
public enum WithdrawalType {

    /** Giảng viên tự tạo lệnh rút tiền thủ công. */
    TEACHER_MANUAL,

    /**
     * Lệnh gộp tự động khi giảng viên bị hạ role Teacher → Student.
     * note chứa "Final payout — tài khoản bị hạ role".
     * status = PENDING (đã có bank) hoặc HOLD (chưa có bank).
     */
    DOWNGRADE_AUTO,

    /**
     * Lệnh PENDING bị chuyển HOLD vì admin xóa course của giảng viên.
     * note chứa "bị tạm giữ — course".
     */
    COURSE_DELETED_HOLD,

    /**
     * Lệnh thu hồi earnings từ giảng viên khi admin xóa course có học viên.
     * note chứa "Thu hồi earnings — course".
     */
    COURSE_DELETED_CLAWBACK,

    /**
     * Lệnh HOLD tự động khi tài khoản giảng viên bị khóa (blockTeacher).
     * note chứa "HOLD toàn bộ số dư do tài khoản bị khóa" hoặc "Tài khoản bị KHÓA".
     */
    ACCOUNT_BLOCKED,
}
