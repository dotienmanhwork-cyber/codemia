// features/course-detail/api/review.api.js
import apiClient from "@/shared/config/axios";

/**
 * Lấy tất cả review của một khóa học (không cần auth)
 * GET /courses/{courseSlug}/reviews
 * @returns {{ code, result: ReviewResponse[] }}
 */
export const getCourseReviews = (courseSlug) =>
  apiClient.get(`/courses/${courseSlug}/reviews`);

/**
 * Lấy review của chính mình (cần auth)
 * GET /courses/{courseSlug}/reviews/my
 * @returns {{ code, result: ReviewResponse | null }}
 */
export const getMyReview = (courseSlug) =>
  apiClient.get(`/courses/${courseSlug}/reviews/my`);

/**
 * Submit review mới (cần auth, enrolled + 100%)
 * POST /courses/{courseSlug}/reviews
 * @param {{ rating: number, comment?: string }} payload
 * @returns {{ code, result: ReviewResponse }}
 */
export const submitReview = (courseSlug, payload) =>
  apiClient.post(`/courses/${courseSlug}/reviews`, payload);

/**
 * Cập nhật review đã có (cần auth, chỉ owner)
 * PUT /courses/{courseSlug}/reviews/{reviewId}
 * @param {{ rating: number, comment?: string }} payload
 * @returns {{ code, result: ReviewResponse }}
 */
export const updateReview = (courseSlug, reviewId, payload) =>
  apiClient.put(`/courses/${courseSlug}/reviews/${reviewId}`, payload);

/**
 * Xóa review (cần auth, owner hoặc ADMIN)
 * DELETE /courses/{courseSlug}/reviews/{reviewId}
 * @returns {{ code, result: null }}
 */
export const deleteReview = (courseSlug, reviewId) =>
  apiClient.delete(`/courses/${courseSlug}/reviews/${reviewId}`);