package vn.codemia.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SectionResponse {
	private Integer id;
	private String title;
	private Integer orderIndex;
	private String courseId; // Chỉ trả về ID của Course
	private LocalDateTime createdAt;
	// Thêm dòng này vào cuối:
	private List<LessonResponse> lessons;
}