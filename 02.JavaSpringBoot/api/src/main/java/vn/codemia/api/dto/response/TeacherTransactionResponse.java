package vn.codemia.api.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherTransactionResponse {
	private String orderId;
	private String studentName;
	private String studentEmail;
	private String studentAvatar;
	private String courseName;
	private String courseId;
	private double amount;
	private String type;            // "Enrollment"
	private LocalDateTime createdAt;
}