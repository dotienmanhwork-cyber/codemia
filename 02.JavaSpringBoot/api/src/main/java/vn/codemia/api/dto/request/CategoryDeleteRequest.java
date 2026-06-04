package vn.codemia.api.dto.request;

import lombok.Data;

/**
 * Body cho DELETE /api/categories/{id}
 *
 * - targetCategoryId = null  →  chỉ xóa nếu không có course nào
 * - targetCategoryId = X     →  reassign toàn bộ course sang X rồi xóa
 */
@Data
public class CategoryDeleteRequest {
	private Integer targetCategoryId;
}