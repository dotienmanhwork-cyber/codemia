package vn.codemia.api.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateResponse {

	private String verifyCode;
	private String verifyUrl;

	private String studentName;
	private String studentEmail;

	private String courseName;
	private String courseSlug;
	private String teacherName;

	private LocalDateTime enrolledAt;
	private LocalDateTime issuedAt;   // ← thêm mới: thời điểm cấp cert, đọc từ bảng certificates
}