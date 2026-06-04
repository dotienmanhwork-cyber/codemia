package vn.codemia.api.dto.request;

import lombok.Data;

@Data
public class AdminCourseStatusRequest {
	private String status;  // PUBLISHED | REJECTED | DRAFT
	private String reason;  // bắt buộc khi status = REJECTED, null khi approve
}