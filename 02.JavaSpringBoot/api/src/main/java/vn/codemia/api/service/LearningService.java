package vn.codemia.api.service;

import vn.codemia.api.dto.response.*;

import java.util.List;

public interface LearningService {

	/**
	 * GET /api/learning/courses/{courseId}
	 * Trả về tiến độ học của user hiện tại trong khóa học.
	 */
	CourseProgressResponse getCourseProgress(String courseId);

	/**
	 * GET /api/learning/courses/{courseId}/curriculum
	 * Trả về toàn bộ chương + bài học kèm status của user.
	 */
	CurriculumResponse getCourseCurriculum(String courseId);

	/**
	 * GET /api/learning/lessons/{lessonId}
	 * Trả về chi tiết bài học kèm videoUrl, videoTimestamp, summaryItems.
	 */
	LessonLearningResponse getLessonDetail(String lessonId);

	/**
	 * POST /api/learning/lessons/{lessonId}/complete
	 * Đánh dấu bài học hoàn thành, cập nhật currentLessonId sang bài tiếp theo.
	 */
	void markLessonComplete(String lessonId);

	/**
	 * PUT /api/learning/lessons/{lessonId}/progress
	 * Lưu timestamp video đang xem (auto-save mỗi 5s từ FE).
	 */
	void saveVideoProgress(String lessonId, int currentTime);

	List<MyCourseResponse> getMyCourses();

	CertificateResponse getCertificate(String courseSlug);

	/**
	 * GET /api/learning/my-certificates
	 * Trả về danh sách tất cả chứng chỉ của student hiện tại, mới nhất trước.
	 */
	List<CertificateResponse> getMyCertificates();
}