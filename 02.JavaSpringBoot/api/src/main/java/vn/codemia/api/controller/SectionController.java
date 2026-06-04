package vn.codemia.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.SectionRequest;
import vn.codemia.api.dto.request.SectionReorderRequest;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.dto.response.SectionResponse;
import vn.codemia.api.service.SectionService;

import java.util.List;

@RestController
@RequestMapping("/api/sections")
@RequiredArgsConstructor
public class SectionController {

	private final SectionService sectionService;

	@PostMapping
	public ResponseEntity<ApiResponse<SectionResponse>> create(@Valid @RequestBody SectionRequest request) {
		return ResponseEntity.ok(
				ApiResponse.<SectionResponse>builder()
						.code(1000)
						.result(sectionService.create(request))
						.build()
		);
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<SectionResponse>> update(
			@PathVariable Integer id,
			@Valid @RequestBody SectionRequest request) {
		return ResponseEntity.ok(
				ApiResponse.<SectionResponse>builder()
						.code(1000)
						.result(sectionService.update(id, request))
						.build()
		);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer id) {
		sectionService.delete(id);
		return ResponseEntity.ok(
				ApiResponse.<Void>builder()
						.code(1000)
						.message("Xóa chương học thành công")
						.build()
		);
	}

	@GetMapping("/course/{courseId}")
	public ResponseEntity<ApiResponse<List<SectionResponse>>> getByCourse(@PathVariable String courseId) {
		return ResponseEntity.ok(
				ApiResponse.<List<SectionResponse>>builder()
						.code(1000)
						.result(sectionService.getByCourseId(courseId))
						.build()
		);
	}

	// ─── Reorder — kéo thả đổi thứ tự chương ────────────────────────────────
	@PatchMapping("/reorder")
	public ResponseEntity<ApiResponse<Void>> reorder(@RequestBody SectionReorderRequest request) {
		sectionService.reorder(request);
		return ResponseEntity.ok(
				ApiResponse.<Void>builder()
						.code(1000)
						.message("Cập nhật thứ tự chương thành công")
						.build()
		);
	}
}