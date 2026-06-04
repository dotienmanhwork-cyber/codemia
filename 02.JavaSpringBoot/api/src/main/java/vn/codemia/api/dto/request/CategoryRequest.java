package vn.codemia.api.dto.request;

import lombok.Data;

@Data
public class CategoryRequest {
	private String name;
	private Integer parentId; // ID của danh mục cha (nếu có)
}