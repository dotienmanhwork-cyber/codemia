package vn.codemia.api.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherCourseRevenueResponse {
	private String courseId;
	private String courseName;
	private double revenue;
	private long totalStudents;
}