package vn.codemia.api.exception;

import lombok.Getter;

@Getter
public enum ErrorCode {
	UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error"),
	USER_EXISTED(1001, "User already existed"),
	USER_NOT_EXISTED(1002, "User not existed"),
	INVALID_KEY(1003, "Invalid message key"),

	// Nhóm xác thực và quyền hạn
	UNAUTHENTICATED(1004, "Unauthenticated - Wrong password"),
	UNAUTHORIZED(1005, "You do not have permission"),
	FORBIDDEN(1006, "You do not have permission to access this resource"),

	// Nhóm trạng thái và bảo mật
	USER_BLOCKED(1007, "Your account has been blocked"),
	PASSWORD_INCORRECT(1008, "Old password is incorrect"),
	CATEGORY_EXISTED(1009, "Category already existed"),
	CATEGORY_NOT_EXISTED(1010, "Category not found"),
	COURSE_NOT_FOUND(1011, "Course not found"),
	LESSON_NOT_FOUND(1012, "Lesson not found"),
	NOT_ENROLLED(1013, "You are not enrolled in this course"),
	EXERCISE_NOT_FOUND(1014, "Exercise not found"),
	AI_UNAVAILABLE(1015, "AI service is temporarily unavailable"),
	INVALID_VIDEO_URL(1016, "URL video không hợp lệ hoặc không phải YouTube"),
	TRANSCRIPT_NOT_FOUND(1017, "Không tìm thấy transcript cho video này"),
	SECTION_NOT_FOUND(1018, "Section not found"),

	// Nhóm role upgrade
	NOT_STUDENT(1019, "Only STUDENT accounts can request a teacher upgrade"),
	ALREADY_PENDING_TEACHER(1020, "You already have a pending upgrade request"),

	INVALID_STATUS(1021, "Invalid status value"),
	INVALID_ROLE(1022, "Invalid role value"),

	// Course submit
	COURSE_CANNOT_SUBMIT(1023, "Course can only be submitted from DRAFT or REJECTED status"),
	COURSE_EMPTY(1024, "Course must have at least 1 section and 1 lesson before submitting"),
	COURSE_CANNOT_CANCEL_PENDING(1025, "Course can only be withdrawn while in PENDING status"),
	COURSE_CANNOT_UPDATE_PENDING(1026, "Không thể chỉnh sửa khóa học đang chờ duyệt"),
	COURSE_NOT_COMPLETED(1027, "Bạn chưa hoàn thành khóa học này"),
	REVIEW_ALREADY_EXISTS(1028, "Bạn đã đánh giá khóa học này rồi"),
	REVIEW_NOT_FOUND(1029, "Không tìm thấy đánh giá"),
	COURSE_HAS_STUDENTS(1030, "Không thể xóa khóa học đã có học viên đăng ký"),
	CATEGORY_HAS_COURSES(1031, "Category still has courses. Please reassign them before deleting."),
	INVALID_REQUEST(1032, "Invalid request data"),
	AI_FEATURE_DISABLED(1033, "Tính năng AI này đang tạm thời bị tắt"),
	TEACHER_HAS_COURSES(1034, "Cannot delete teacher who has existing courses"),
	STUDENT_HAS_ENROLLMENTS(1035, "Cannot delete student who has existing enrollments"),
	INSUFFICIENT_BALANCE(1036, "Số dư không đủ để thực hiện yêu cầu rút tiền"),
	WITHDRAWAL_NOT_FOUND(1037, "Không tìm thấy yêu cầu rút tiền"),
	WITHDRAWAL_ALREADY_PENDING(1038, "Bạn đang có yêu cầu rút tiền chờ xử lý. Vui lòng đợi admin duyệt trước."),
	WITHDRAWAL_ALREADY_PROCESSED(1039, "Yêu cầu này đã được xử lý trước đó"),
	COURSE_ENROLLMENT_UNAVAILABLE(1040, "Khóa học này hiện không nhận học viên mới"),
	USE_DOWNGRADE_ENDPOINT(1041, "Teacher → Student downgrade phải dùng POST /downgrade"),
	COURSE_CANNOT_UNPUBLISH(4013, "Only published courses can be unpublished"),
	COURSE_CANNOT_REPUBLISH(4014, "Only unlisted courses can be republished"),

	// ── Phase 2: Refund ───────────────────────────────────────────────────
	/** Course bị khóa bởi Admin — student cũ vẫn học được, không refund */
	COURSE_SUSPENDED(1042, "Khóa học đang bị khóa bởi Admin"),
	/** Không tìm thấy RefundRequest theo id */
	REFUND_NOT_FOUND(1043, "Không tìm thấy yêu cầu hoàn tiền"),
	/**
	 * Thực hiện action không hợp lệ với trạng thái hiện tại của RefundRequest.
	 * VD: mark COMPLETED khi status đang là WAITING_BANK_INFO,
	 *     hoặc remind khi status đã là PENDING/COMPLETED.
	 */
	REFUND_INVALID_STATUS_TRANSITION(1044, "Không thể thực hiện thao tác này với trạng thái hoàn tiền hiện tại"),
	USER_NOT_TEACHER(1045, "Người dùng này không phải là Giảng viên."),
	WITHDRAWAL_MIN_LIMIT(1046, "Số tiền rút tối thiểu phải từ 50.000 ₫"),
	;

	ErrorCode(int code, String message) {
		this.code = code;
		this.message = message;
	}

	private final int code;
	private final String message;
}