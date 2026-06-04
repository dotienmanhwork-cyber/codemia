package vn.codemia.api.enums;

public enum CourseStatus {
	DRAFT,
	PENDING,
	PUBLISHED,
	UNLISTED,    // Teacher tự ẩn → teacher tự publish lại được
	SUSPENDED,   // Admin khóa vi phạm → chỉ admin restore được
	REJECTED
}
