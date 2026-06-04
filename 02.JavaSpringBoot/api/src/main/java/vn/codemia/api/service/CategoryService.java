package vn.codemia.api.service;

import vn.codemia.api.dto.request.CategoryDeleteRequest;
import vn.codemia.api.dto.request.CategoryRequest;
import vn.codemia.api.dto.response.CategoryResponse;
import vn.codemia.api.dto.response.CategoryUsageResponse;

import java.util.List;

public interface CategoryService {
	CategoryResponse         create(CategoryRequest request);
	List<CategoryResponse>   getAllTree();
	CategoryResponse         update(Integer id, CategoryRequest request);
	CategoryResponse         getById(Integer id);

	/**
	 * Xóa category theo flow mới:
	 * - request.targetCategoryId == null  → chỉ xóa nếu 0 course, ngược lại throw 1031
	 * - request.targetCategoryId != null  → reassign toàn bộ course rồi xóa
	 */
	void delete(Integer id, CategoryDeleteRequest request);

	/** Trả về số course đang dùng category này (để FE hiển thị confirm modal) */
	CategoryUsageResponse getUsage(Integer id);
}