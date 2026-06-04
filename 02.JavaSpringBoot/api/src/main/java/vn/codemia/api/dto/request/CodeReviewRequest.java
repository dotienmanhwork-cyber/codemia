package vn.codemia.api.dto.request;

import lombok.Data;

@Data
public class CodeReviewRequest {
	private String code;
	private String language;      // "java", "python", "javascript", ...
	private String context;       // optional — mô tả bài toán để AI review đúng hơn
	private String errorMessage;  // optional — thông báo lỗi từ Piston khi giải thích lỗi
}