package vn.codemia.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RequestTeacherUpgradeRequest {

	@NotBlank(message = "Reason is required")
	@Size(min = 20, max = 1000, message = "Reason must be between 20 and 1000 characters")
	String reason;

	// URL PDF CV — FE upload lên Cloudinary trước, rồi gửi URL về đây
	@NotBlank(message = "CV is required")
	String cvUrl;

	// Link GitHub hoặc portfolio — bắt buộc
	@NotBlank(message = "Portfolio URL is required")
	String portfolioUrl;
}