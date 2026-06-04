package vn.codemia.api.mapper;

import org.springframework.stereotype.Component;
import vn.codemia.api.dto.response.CategoryResponse;
import vn.codemia.api.entity.Category;

import java.util.stream.Collectors;

@Component
public class CategoryMapper {

	public CategoryResponse toCategoryResponse(Category category) {
		if (category == null) return null;

		return CategoryResponse.builder()
				.id(category.getId())
				.name(category.getName())
				.slug(category.getSlug())
				// Xử lý đệ quy: Map danh sách con (nếu có)
				.children(category.getSubCategories() != null ?
						category.getSubCategories().stream()
						.map(this::toCategoryResponse) // Tự gọi lại chính nó
						.collect(Collectors.toList()) : null)
				.build();
	}
}