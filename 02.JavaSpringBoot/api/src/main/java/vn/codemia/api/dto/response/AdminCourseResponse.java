package vn.codemia.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminCourseResponse {
	private String id;
	private String title;
	private String slug;
	private String thumbnailUrl;
	private Double price;
	private String status;
	private String teacherId;
	private String teacherName;
	private Long totalStudents;
	private LocalDateTime createdAt;
	private String submissionType;
}