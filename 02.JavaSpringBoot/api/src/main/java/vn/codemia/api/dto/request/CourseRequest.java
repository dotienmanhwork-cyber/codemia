package vn.codemia.api.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CourseRequest {

	@NotBlank(message = "Tiêu đề khóa học không được để trống")
	private String title;

	private String description;

	private String thumbnailUrl;

	private String seoTags;

	@NotNull(message = "Giá khóa học không được để trống")
	@Min(value = 0, message = "Giá khóa học không được âm")
	private BigDecimal price;

	@NotNull(message = "Danh mục không được để trống")
	private Integer categoryId;

	// Danh sách các ID của Tag muốn gắn vào khóa học
	private List<Integer> tagIds;
}