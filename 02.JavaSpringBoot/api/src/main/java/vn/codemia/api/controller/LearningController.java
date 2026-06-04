package vn.codemia.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.response.*;
import vn.codemia.api.service.LearningService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {

	private final LearningService learningService;

	/**
	 * GET /api/learning/courses/{courseId}
	 * FE: getCourseProgress(courseId) → course.title, course.progress, currentLessonId
	 */
	@GetMapping("/courses/{courseId}")
	public ResponseEntity<ApiResponse<CourseProgressResponse>> getCourseProgress(
			@PathVariable String courseId) {

		return ResponseEntity.ok(
				ApiResponse.<CourseProgressResponse>builder()
						.code(1000)
						.result(learningService.getCourseProgress(courseId))
						.build()
		);
	}

	/**
	 * GET /api/learning/courses/{courseId}/curriculum
	 * FE: getCourseCurriculum(courseId) → chapters[].lessons[].{id, title, type, status}
	 */
	@GetMapping("/courses/{courseId}/curriculum")
	public ResponseEntity<ApiResponse<CurriculumResponse>> getCourseCurriculum(
			@PathVariable String courseId) {

		return ResponseEntity.ok(
				ApiResponse.<CurriculumResponse>builder()
						.code(1000)
						.result(learningService.getCourseCurriculum(courseId))
						.build()
		);
	}

	/**
	 * GET /api/learning/lessons/{lessonId}
	 * FE: getLessonDetail(lessonId) → {id, title, type, videoUrl, videoTimestamp, summaryItems}
	 */
	@GetMapping("/lessons/{lessonId}")
	public ResponseEntity<ApiResponse<LessonLearningResponse>> getLessonDetail(
			@PathVariable String lessonId) {

		return ResponseEntity.ok(
				ApiResponse.<LessonLearningResponse>builder()
						.code(1000)
						.result(learningService.getLessonDetail(lessonId))
						.build()
		);
	}

	/**
	 * POST /api/learning/lessons/{lessonId}/complete
	 * FE: markLessonComplete(lessonId) — optimistic update status → "completed"
	 */
	@PostMapping("/lessons/{lessonId}/complete")
	public ResponseEntity<ApiResponse<Void>> markLessonComplete(
			@PathVariable String lessonId) {

		learningService.markLessonComplete(lessonId);
		return ResponseEntity.ok(
				ApiResponse.<Void>builder()
						.code(1000)
						.message("Đánh dấu hoàn thành thành công")
						.build()
		);
	}

	/**
	 * PUT /api/learning/lessons/{lessonId}/progress
	 * FE: saveVideoProgress(lessonId, currentTime) — auto-save mỗi 5s
	 * Body: { "currentTime": 120 }
	 */
	@PutMapping("/lessons/{lessonId}/progress")
	public ResponseEntity<ApiResponse<Void>> saveVideoProgress(
			@PathVariable String lessonId,
			@RequestBody Map<String, Integer> body) {

		int currentTime = body.getOrDefault("currentTime", 0);
		learningService.saveVideoProgress(lessonId, currentTime);

		return ResponseEntity.ok(
				ApiResponse.<Void>builder()
						.code(1000)
						.message("Lưu tiến độ thành công")
						.build()
		);
	}

	/**
	 * GET /api/learning/my-courses
	 * FE: getMyCourses() → danh sách khóa học đã enroll
	 */
	@GetMapping("/my-courses")
	public ResponseEntity<ApiResponse<List<MyCourseResponse>>> getMyCourses() {
		return ResponseEntity.ok(
				ApiResponse.<List<MyCourseResponse>>builder()
						.code(1000)
						.result(learningService.getMyCourses())
						.build()
		);
	}

	/**
	 * GET /api/learning/courses/{courseSlug}/certificate
	 * Lấy thông tin chứng chỉ — student phải enrolled và hoàn thành 100%
	 * verifyCode = certificate UUID, dùng để verify tại /verify/{code}
	 */
	@GetMapping("/courses/{courseSlug}/certificate")
	public ResponseEntity<ApiResponse<CertificateResponse>> getCertificate(
			@PathVariable String courseSlug) {

		return ResponseEntity.ok(
				ApiResponse.<CertificateResponse>builder()
						.code(1000)
						.result(learningService.getCertificate(courseSlug))
						.build()
		);
	}

	/**
	 * GET /api/learning/my-certificates
	 * FE: getMyCertificates() → danh sách tất cả chứng chỉ của student, mới nhất trước
	 */
	@GetMapping("/my-certificates")
	public ResponseEntity<ApiResponse<List<CertificateResponse>>> getMyCertificates() {
		return ResponseEntity.ok(
				ApiResponse.<List<CertificateResponse>>builder()
						.code(1000)
						.result(learningService.getMyCertificates())
						.build()
		);
	}
}