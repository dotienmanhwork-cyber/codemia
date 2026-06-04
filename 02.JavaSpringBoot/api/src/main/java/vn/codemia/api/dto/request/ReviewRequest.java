package vn.codemia.api.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequest {

	@NotNull(message = "Rating không được để trống")
	@Min(value = 1, message = "Rating tối thiểu là 1")
	@Max(value = 5, message = "Rating tối đa là 5")
	private Integer rating;

	private String comment;
}