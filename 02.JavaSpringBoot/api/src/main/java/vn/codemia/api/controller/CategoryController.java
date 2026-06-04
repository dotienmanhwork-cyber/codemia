package vn.codemia.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.CategoryDeleteRequest;
import vn.codemia.api.dto.request.CategoryRequest;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.dto.response.CategoryResponse;
import vn.codemia.api.dto.response.CategoryUsageResponse;
import vn.codemia.api.service.CategoryService;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

	private final CategoryService categoryService;

	// ── GET all (tree) ──────────────────────────────────────────────
	@GetMapping
	public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
		return ResponseEntity.ok(ApiResponse.<List<CategoryResponse>>builder()
				.code(1000)
				.result(categoryService.getAllTree())
				.build());
	}

	// ── GET by id ───────────────────────────────────────────────────
	@GetMapping("/{id}")
	public ApiResponse<CategoryResponse> getCategory(@PathVariable Integer id) {
		return ApiResponse.<CategoryResponse>builder()
				.result(categoryService.getById(id))
				.build();
	}

	// ── GET usage (courseCount + hasChildren) ───────────────────────
	@GetMapping("/{id}/usage")
	public ResponseEntity<ApiResponse<CategoryUsageResponse>> getCategoryUsage(
			@PathVariable Integer id) {
		return ResponseEntity.ok(ApiResponse.<CategoryUsageResponse>builder()
				.code(1000)
				.result(categoryService.getUsage(id))
				.build());
	}

	// ── POST create ─────────────────────────────────────────────────
	@PostMapping
	public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
			@RequestBody CategoryRequest request) {
		return ResponseEntity.ok(ApiResponse.<CategoryResponse>builder()
				.code(1000)
				.result(categoryService.create(request))
				.build());
	}

	// ── PUT update ──────────────────────────────────────────────────
	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
			@PathVariable Integer id,
			@RequestBody CategoryRequest request) {
		return ResponseEntity.ok(ApiResponse.<CategoryResponse>builder()
				.code(1000)
				.result(categoryService.update(id, request))
				.build());
	}

	// ── DELETE ──────────────────────────────────────────────────────
	/**
	 * Body là tùy chọn:
	 *   {}                          → xóa thẳng nếu 0 course, throw 1031 nếu có
	 *   { "targetCategoryId": 3 }   → reassign toàn bộ course sang id=3 rồi xóa
	 */
	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> deleteCategory(
			@PathVariable Integer id,
			@RequestBody(required = false) CategoryDeleteRequest request) {
		categoryService.delete(id, request);
		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000)
				.message("Xóa danh mục thành công")
				.build());
	}
}