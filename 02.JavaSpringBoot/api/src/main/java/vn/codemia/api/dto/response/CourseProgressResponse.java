package vn.codemia.api.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseProgressResponse {
	private String courseId;
	private String slug;         // ← thêm để FE navigate tới /certificate
	private String title;
	private BigDecimal progress; // DECIMAL(5,2) từ enrollments.progress_percent

	// KHÔNG có currentLessonId — DB không có cột này trong enrollments
}