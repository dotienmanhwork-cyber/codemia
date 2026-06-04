package vn.codemia.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CartItemRequest {
	@NotBlank(message = "ID khóa học không được để trống")
	private String courseId;
}