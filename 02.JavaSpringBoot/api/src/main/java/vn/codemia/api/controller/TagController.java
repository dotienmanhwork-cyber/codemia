package vn.codemia.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.TagRequest;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.dto.response.TagResponse;
import vn.codemia.api.service.TagService;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

	private final TagService tagService;

	@GetMapping
	public ResponseEntity<ApiResponse<List<TagResponse>>> getAllTags() {
		return ResponseEntity.ok(
				ApiResponse.<List<TagResponse>>builder()
						.code(1000)
						.result(tagService.getAll())
						.build()
		);
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<TagResponse>> getTagById(@PathVariable Integer id) {
		return ResponseEntity.ok(
				ApiResponse.<TagResponse>builder()
						.code(1000)
						.result(tagService.getById(id))
						.build()
		);
	}

	@PostMapping
	public ResponseEntity<ApiResponse<TagResponse>> createTag(@Valid @RequestBody TagRequest request) {
		return ResponseEntity.ok(
				ApiResponse.<TagResponse>builder()
						.code(1000)
						.result(tagService.create(request))
						.build()
		);
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<TagResponse>> updateTag(
			@PathVariable Integer id,
			@Valid @RequestBody TagRequest request) {
		return ResponseEntity.ok(
				ApiResponse.<TagResponse>builder()
						.code(1000)
						.result(tagService.update(id, request))
						.build()
		);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable Integer id) {
		tagService.delete(id);
		return ResponseEntity.ok(
				ApiResponse.<Void>builder()
						.code(1000)
						.message("Xóa Tag thành công")
						.build()
		);
	}
}