package vn.codemia.api.service;

import vn.codemia.api.dto.request.ReviewRequest;
import vn.codemia.api.dto.response.ReviewResponse;

import java.util.List;

public interface ReviewService {

	// Student submit review sau khi hoàn thành khóa học
	ReviewResponse submitReview(String courseSlug, ReviewRequest request);

	// Lấy toàn bộ review của 1 course (public)
	List<ReviewResponse> getReviewsByCourse(String courseSlug);

	// Lấy review của chính student đang login trong course này
	ReviewResponse getMyReview(String courseSlug);

	// Cập nhật review (chỉ student sở hữu)
	ReviewResponse updateReview(Integer reviewId, ReviewRequest request);

	// Xóa review (chỉ student sở hữu hoặc admin)
	void deleteReview(Integer reviewId);
}