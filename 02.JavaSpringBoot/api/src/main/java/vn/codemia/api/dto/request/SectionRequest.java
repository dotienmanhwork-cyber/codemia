package vn.codemia.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SectionRequest {

	@NotBlank(message = "Tên chương không được để trống")
	private String title;

	@NotNull(message = "Thứ tự chương không được để trống")
	private Integer orderIndex;

	@NotBlank(message = "ID khóa học không được để trống")
	private String courseId;
}