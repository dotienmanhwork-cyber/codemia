package vn.codemia.api.dto.response;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
	private Integer id;
	private String name;
	private String slug;
	private List<CategoryResponse> children; // Danh sách danh mục con
}