package vn.codemia.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
	private Integer id;
	private Integer rating;
	private String comment;

	// Student info
	private String studentId;
	private String studentName;
	private String studentAvatar;

	// Teacher reply (nullable)
	private String teacherReply;
	private LocalDateTime repliedAt;

	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}