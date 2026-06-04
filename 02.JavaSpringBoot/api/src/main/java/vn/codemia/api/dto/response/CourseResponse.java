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
public class CourseResponse {
	private String id;
	private String title;
	private String slug;
	private String description;
	private String thumbnailUrl;
	private String seoTags;
	private BigDecimal price;
	private String status;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	// Thông tin người tạo (bạn có thể tạo UserProfileResponse sau, tạm thời dùng String tên hoặc id)
	private String teacherId;
	private String teacherName; // fullName hoặc email nếu chưa có profile

	// Nhúng thông tin Category và Tags đã làm ở các bước trước
	private CategoryResponse category;
	private List<TagResponse> tags;
	// Thêm dòng này vào cuối:
	private List<SectionResponse> sections;
	private String learnObjectives;

	// true nếu user hiện tại đã enroll (free hoặc paid), false nếu chưa / chưa login
	private boolean enrolled;

	// Rating trung bình và số lượng review (tính từ bảng reviews)
	private Double averageRating;
	private Long reviewCount;
}