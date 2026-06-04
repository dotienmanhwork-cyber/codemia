package vn.codemia.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.ReviewRequest;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.dto.response.ReviewResponse;
import vn.codemia.api.service.ReviewService;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseSlug}/reviews")
@RequiredArgsConstructor
public class ReviewController {

	private final ReviewService reviewService;

	/**
	 * GET /api/courses/{courseSlug}/reviews
	 * Public — lấy toàn bộ review của course, hiển thị trên CourseDetail
	 */
	@GetMapping
	public ResponseEntity<ApiResponse<List<ReviewResponse>>> getReviews(
			@PathVariable String courseSlug) {

		return ResponseEntity.ok(
				ApiResponse.<List<ReviewResponse>>builder()
						.code(1000)
						.result(reviewService.getReviewsByCourse(courseSlug))
						.build()
		);
	}

	/**
	 * GET /api/courses/{courseSlug}/reviews/my
	 * Lấy review của student đang login (để hiện lại form đã điền)
	 * Trả null nếu chưa review
	 */
	@GetMapping("/my")
	public ResponseEntity<ApiResponse<ReviewResponse>> getMyReview(
			@PathVariable String courseSlug) {

		return ResponseEntity.ok(
				ApiResponse.<ReviewResponse>builder()
						.code(1000)
						.result(reviewService.getMyReview(courseSlug))
						.build()
		);
	}

	/**
	 * POST /api/courses/{courseSlug}/reviews
	 * Student submit review — phải enrolled + completed 100%
	 */
	@PostMapping
	public ResponseEntity<ApiResponse<ReviewResponse>> submitReview(
			@PathVariable String courseSlug,
			@Valid @RequestBody ReviewRequest request) {

		return ResponseEntity.ok(
				ApiResponse.<ReviewResponse>builder()
						.code(1000)
						.result(reviewService.submitReview(courseSlug, request))
						.build()
		);
	}

	/**
	 * PUT /api/courses/{courseSlug}/reviews/{reviewId}
	 * Cập nhật review (chỉ owner)
	 */
	@PutMapping("/{reviewId}")
	public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
			@PathVariable String courseSlug,
			@PathVariable Integer reviewId,
			@Valid @RequestBody ReviewRequest request) {

		return ResponseEntity.ok(
				ApiResponse.<ReviewResponse>builder()
						.code(1000)
						.result(reviewService.updateReview(reviewId, request))
						.build()
		);
	}

	/**
	 * DELETE /api/courses/{courseSlug}/reviews/{reviewId}
	 * Xóa review (owner hoặc admin)
	 */
	@DeleteMapping("/{reviewId}")
	public ResponseEntity<ApiResponse<Void>> deleteReview(
			@PathVariable String courseSlug,
			@PathVariable Integer reviewId) {

		reviewService.deleteReview(reviewId);
		return ResponseEntity.ok(
				ApiResponse.<Void>builder()
						.code(1000)
						.message("Xóa đánh giá thành công")
						.build()
		);
	}
}