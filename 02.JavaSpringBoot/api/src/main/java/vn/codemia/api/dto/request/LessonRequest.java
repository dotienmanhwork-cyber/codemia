package vn.codemia.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import vn.codemia.api.enums.LessonType;

@Data
public class LessonRequest {

	@NotBlank(message = "Tên bài học không được để trống")
	private String title;

	private String videoUrl;

	@NotNull(message = "Loại bài học không được để trống")
	private LessonType type;

	@NotNull(message = "Thứ tự bài học không được để trống")
	private Integer orderIndex;

	// duration đã bỏ — tự động lấy từ YouTube / Vimeo sau khi save
	// Nếu LessonMapper đang map duration từ request, xóa dòng đó trong mapper luôn.

	private Boolean isFreePreview;

	@NotNull(message = "ID chương học không được để trống")
	private Integer sectionId;

	private String content;
}