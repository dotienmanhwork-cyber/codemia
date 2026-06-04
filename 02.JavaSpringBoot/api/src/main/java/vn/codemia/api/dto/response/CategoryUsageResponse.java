package vn.codemia.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Trả về thống kê usage của 1 category.
 * FE gọi GET /api/categories/{id}/usage trước khi hiện confirm-delete modal.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryUsageResponse {
	private Integer categoryId;
	private String  categoryName;

	/** Tổng số course đang dùng category này (kể cả các subcategory) */
	private long courseCount;

	/** true nếu category này có subcategory */
	private boolean hasChildren;
}