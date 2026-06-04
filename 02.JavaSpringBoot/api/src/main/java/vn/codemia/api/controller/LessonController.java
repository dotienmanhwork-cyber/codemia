package vn.codemia.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.LessonReorderRequest;
import vn.codemia.api.dto.request.LessonRequest;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.dto.response.LessonResponse;
import vn.codemia.api.service.LessonService;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
public class LessonController {

	private final LessonService lessonService;

	@PostMapping
	public ResponseEntity<ApiResponse<LessonResponse>> create(@Valid @RequestBody LessonRequest request) {
		return ResponseEntity.ok(
				ApiResponse.<LessonResponse>builder()
						.code(1000)
						.result(lessonService.create(request))
						.build()
		);
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<LessonResponse>> update(
			@PathVariable Integer id,
			@Valid @RequestBody LessonRequest request) {
		return ResponseEntity.ok(
				ApiResponse.<LessonResponse>builder()
						.code(1000)
						.result(lessonService.update(id, request))
						.build()
		);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer id) {
		lessonService.delete(id);
		return ResponseEntity.ok(
				ApiResponse.<Void>builder()
						.code(1000)
						.message("Xóa bài học thành công")
						.build()
		);
	}

	// Lấy toàn bộ bài học thuộc về 1 chương cụ thể
	@GetMapping("/section/{sectionId}")
	public ResponseEntity<ApiResponse<List<LessonResponse>>> getBySection(@PathVariable Integer sectionId) {
		return ResponseEntity.ok(
				ApiResponse.<List<LessonResponse>>builder()
						.code(1000)
						.result(lessonService.getBySectionId(sectionId))
						.build()
		);
	}

	// Cập nhật thứ tự bài học trong 1 section (drag & drop hoặc chèn giữa)
	@PatchMapping("/reorder")
	public ResponseEntity<ApiResponse<Void>> reorder(@RequestBody LessonReorderRequest request) {
		lessonService.reorder(request);
		return ResponseEntity.ok(
				ApiResponse.<Void>builder()
						.code(1000)
						.message("Cập nhật thứ tự thành công")
						.build()
		);
	}
}