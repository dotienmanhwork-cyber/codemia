package vn.codemia.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCourseDetailResponse {

	private String id;
	private String title;
	private String slug;
	private String thumbnailUrl;
	private String description;
	private BigDecimal price;
	private String status;
	private String rejectedReason;  // null nếu chưa bị reject
	private LocalDateTime createdAt;
	private TeacherInfo teacher;
	private List<SectionInfo> sections;

	private String submissionType;
	private String oldTitle;
	private BigDecimal oldPrice;
	private String oldDescription;

	// ─── Nested DTOs ──────────────────────────────────────────────


	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class TeacherInfo {
		private String id;
		private String name;
		private String email;
		private String avatar;
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class SectionInfo {
		private Integer id;
		private String title;
		private Integer orderIndex;
		private List<LessonInfo> lessons;
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class LessonInfo {
		private Integer id;
		private String title;
		private String type;    // VIDEO | TEXT | EXERCISE
		private Integer duration;
		private Integer orderIndex;
	}
}