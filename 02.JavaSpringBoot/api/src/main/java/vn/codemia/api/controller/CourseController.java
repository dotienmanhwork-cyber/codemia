package vn.codemia.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.CourseRequest;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.dto.response.CourseResponse;
import vn.codemia.api.service.CourseService;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

	private final CourseService courseService;

	@GetMapping
	public ResponseEntity<ApiResponse<List<CourseResponse>>> getAllCourses() {
		return ResponseEntity.ok(
				ApiResponse.<List<CourseResponse>>builder()
						.code(1000)
						.result(courseService.getAll())
						.build()
		);
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(@PathVariable String id) {
		return ResponseEntity.ok(
				ApiResponse.<CourseResponse>builder()
						.code(1000)
						.result(courseService.getById(id))
						.build()
		);
	}

	@GetMapping("/slug/{slug}")
	public ResponseEntity<ApiResponse<CourseResponse>> getCourseBySlug(@PathVariable String slug) {
		return ResponseEntity.ok(
				ApiResponse.<CourseResponse>builder()
						.code(1000)
						.result(courseService.getBySlug(slug))
						.build()
		);
	}

	@PostMapping
	public ResponseEntity<ApiResponse<CourseResponse>> createCourse(@Valid @RequestBody CourseRequest request) {
		return ResponseEntity.ok(
				ApiResponse.<CourseResponse>builder()
						.code(1000)
						.result(courseService.create(request))
						.build()
		);
	}

	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
			@PathVariable String id,
			@Valid @RequestBody CourseRequest request) {
		return ResponseEntity.ok(
				ApiResponse.<CourseResponse>builder()
						.code(1000)
						.result(courseService.update(id, request))
						.build()
		);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable String id) {
		courseService.delete(id);
		return ResponseEntity.ok(
				ApiResponse.<Void>builder()
						.code(1000)
						.message("Xóa khóa học thành công")
						.build()
		);
	}
}