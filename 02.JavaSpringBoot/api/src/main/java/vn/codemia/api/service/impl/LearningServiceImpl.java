package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.dto.response.*;
import vn.codemia.api.entity.*;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.mapper.LearningMapper;
import vn.codemia.api.repository.*;
import vn.codemia.api.service.LearningService;
import vn.codemia.api.entity.Certificate;
import vn.codemia.api.repository.CertificateRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningServiceImpl implements LearningService {

	private final CourseRepository courseRepository;
	private final LessonRepository lessonRepository;
	private final SectionRepository sectionRepository;
	private final EnrollmentRepository enrollmentRepository;
	private final LessonProgressRepository lessonProgressRepository;
	private final UserRepository userRepository;
	private final LearningMapper learningMapper;
	private final CertificateRepository certificateRepository;

	// ── 1. GET /learning/courses/{courseId} ───────────────────────────────────

	@Override
	@Transactional
	public CourseProgressResponse getCourseProgress(String courseId) {
		String userId = getCurrentUserId();
		String resolvedId = resolveCourseId(courseId);

		Course course = courseRepository.findById(resolvedId)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		Enrollment enrollment = enrollmentRepository
				.findByStudentIdAndCourseId(userId, resolvedId)
				.orElseGet(() -> autoEnrollIfFree(userId, course));

		return learningMapper.toCourseProgressResponse(course, enrollment);
	}

	// ── 2. GET /learning/courses/{courseId}/curriculum ────────────────────────

	@Override
	@Transactional
	public CurriculumResponse getCourseCurriculum(String courseId) {
		String userId = getCurrentUserId();
		String resolvedId = resolveCourseId(courseId);

		Course course = courseRepository.findById(resolvedId)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		Enrollment enrollment = enrollmentRepository
				.findByStudentIdAndCourseId(userId, resolvedId)
				.orElseGet(() -> autoEnrollIfFree(userId, course));

		List<Section> sections = sectionRepository.findByCourseIdOrderByOrderIndex(resolvedId);

		Map<Integer, LessonProgress> progressMap = lessonProgressRepository
				.findAllByEnrollmentId(enrollment.getId())
				.stream()
				.collect(Collectors.toMap(
						lp -> lp.getLesson().getId(),
						lp -> lp
				));

		return learningMapper.toCurriculumResponse(sections, progressMap);
	}

	// ── 3. GET /learning/lessons/{lessonId} ───────────────────────────────────

	@Override
	public LessonLearningResponse getLessonDetail(String lessonId) {
		String userId = getCurrentUserId();

		Lesson lesson = lessonRepository.findById(Integer.parseInt(lessonId))
				.orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

		String courseId = lesson.getSection().getCourse().getId();

		Enrollment enrollment = enrollmentRepository
				.findByStudentIdAndCourseId(userId, courseId)
				.orElseThrow(() -> new AppException(ErrorCode.NOT_ENROLLED));

		LessonProgress progress = lessonProgressRepository
				.findByEnrollmentIdAndLessonId(enrollment.getId(), lesson.getId())
				.orElse(null);

		return learningMapper.toLessonDetailResponse(lesson, progress);
	}

	// ── 4. POST /learning/lessons/{lessonId}/complete ─────────────────────────

	@Override
	@Transactional
	public void markLessonComplete(String lessonId) {
		String userId = getCurrentUserId();

		Lesson lesson = lessonRepository.findById(Integer.parseInt(lessonId))
				.orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

		String courseId = lesson.getSection().getCourse().getId();

		Enrollment enrollment = enrollmentRepository
				.findByStudentIdAndCourseId(userId, courseId)
				.orElseThrow(() -> new AppException(ErrorCode.NOT_ENROLLED));

		LessonProgress progress = lessonProgressRepository
				.findByEnrollmentIdAndLessonId(enrollment.getId(), lesson.getId())
				.orElse(LessonProgress.builder()
						.enrollment(enrollment)
						.lesson(lesson)
						.build());

		progress.setIsCompleted(true);
		progress.setCompletedAt(LocalDateTime.now());
		lessonProgressRepository.save(progress);

		updateProgressPercent(enrollment, courseId);

		// Tự động cấp chứng chỉ khi đạt 100%
		if (enrollment.getProgressPercent().compareTo(new BigDecimal("100")) >= 0) {
			issueCertificateIfNotExists(enrollment);
		}
	}

	// ── 5. PUT /learning/lessons/{lessonId}/progress ──────────────────────────

	@Override
	@Transactional
	public void saveVideoProgress(String lessonId, int currentTime) {
		// no-op: lesson_progress không có cột video_timestamp trong DB
	}

	// ── 6. GET /learning/my-courses ───────────────────────────────────────────

	@Override
	public List<MyCourseResponse> getMyCourses() {
		String userId = getCurrentUserId();
		return enrollmentRepository.findAllByStudentId(userId)
				.stream()
				.map(e -> {
					try {
						MyCourseResponse res = learningMapper.toMyCourseResponse(e);
						// Mapper cũ chưa map slug → set thủ công để không cần sửa mapper
						if (res != null && res.getSlug() == null) {
							res.setSlug(e.getCourse().getSlug());
						}
						return res;
					} catch (jakarta.persistence.EntityNotFoundException ex) {
						return null; // bỏ qua orphan enrollment
					}
				})
				.filter(java.util.Objects::nonNull)
				.collect(Collectors.toList());
	}

	// ── 7. GET /learning/courses/{courseSlug}/certificate ─────────────────────

	@Override
	public CertificateResponse getCertificate(String courseSlug) {
		String userId = getCurrentUserId();

		User student = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		Course course = courseRepository.findBySlug(courseSlug)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		Enrollment enrollment = enrollmentRepository
				.findByStudentIdAndCourseId(student.getId(), course.getId())
				.orElseThrow(() -> new AppException(ErrorCode.NOT_ENROLLED));

		if (enrollment.getProgressPercent().compareTo(new BigDecimal("100")) < 0) {
			throw new AppException(ErrorCode.COURSE_NOT_COMPLETED);
		}

		// Đọc từ DB — backfill tự động cho student cũ hoàn thành trước khi có tính năng này
		Certificate cert = certificateRepository
				.findByStudentIdAndCourseId(student.getId(), course.getId())
				.orElseGet(() -> {
					issueCertificateIfNotExists(enrollment);
					return certificateRepository
							.findByStudentIdAndCourseId(student.getId(), course.getId())
							.orElseThrow();
				});

		String studentName = (student.getProfile() != null)
				? student.getProfile().getFullName()
				: student.getEmail();

		return CertificateResponse.builder()
				.verifyCode(cert.getId())
				.verifyUrl("https://codemia.vn/verify/" + cert.getId())
				.studentName(studentName)
				.studentEmail(student.getEmail())
				.courseName(cert.getCourseTitle())        // dùng snapshot
				.courseSlug(course.getSlug())
				.teacherName(cert.getInstructorName())    // dùng snapshot
				.enrolledAt(enrollment.getEnrolledAt())
				.issuedAt(cert.getIssuedAt())
				.build();
	}

	// ── 8. GET /learning/my-certificates ─────────────────────────────────────

	@Override
	public List<CertificateResponse> getMyCertificates() {
		String userId = getCurrentUserId();

		User student = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		String studentName = (student.getProfile() != null)
				? student.getProfile().getFullName()
				: student.getEmail();

		return certificateRepository
				.findAllByStudentIdOrderByIssuedAtDesc(userId)
				.stream()
				.map(cert -> CertificateResponse.builder()
						.verifyCode(cert.getId())
						.verifyUrl("https://codemia.vn/verify/" + cert.getId())
						.studentName(studentName)
						.studentEmail(student.getEmail())
						.courseName(cert.getCourseTitle())
						.courseSlug(cert.getCourse().getSlug())
						.teacherName(cert.getInstructorName())
						.issuedAt(cert.getIssuedAt())
						.build())
				.collect(Collectors.toList());
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	/**
	 * Auto-enroll user vào khóa học FREE (price = 0).
	 * Nếu khóa học có phí → throw NOT_ENROLLED như cũ.
	 */
	private Enrollment autoEnrollIfFree(String userId, Course course) {
		return enrollmentRepository
				.findByStudentIdAndCourseId(userId, course.getId())
				.orElseGet(() -> {
					if (course.getStatus() != vn.codemia.api.enums.CourseStatus.PUBLISHED) {
						throw new AppException(ErrorCode.NOT_ENROLLED);
					}

					boolean isFree = course.getPrice() == null
							|| course.getPrice().compareTo(BigDecimal.ZERO) == 0;
					if (!isFree) throw new AppException(ErrorCode.NOT_ENROLLED);

					User student = userRepository.findById(userId)
							.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

					return enrollmentRepository.save(
							Enrollment.builder()
									.student(student)
									.course(course)
									.progressPercent(BigDecimal.ZERO)
									.enrolledAt(LocalDateTime.now())
									.build()
					);
				});
	}

	/**
	 * Nhận slug hoặc UUID — thử findBySlug trước, fallback về findById.
	 */
	private String resolveCourseId(String slugOrId) {
		return courseRepository.findBySlug(slugOrId)
				.map(Course::getId)
				.orElseGet(() -> courseRepository.findById(slugOrId)
						.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND))
						.getId());
	}

	/**
	 * getName() trả về EMAIL → lookup DB để lấy UUID thực.
	 */
	private String getCurrentUserId() {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED))
				.getId();
	}

	/**
	 * Tính lại progress_percent = completed / total * 100 rồi lưu vào enrollment.
	 */
	private void updateProgressPercent(Enrollment enrollment, String courseId) {
		List<Section> sections = sectionRepository.findByCourseIdOrderByOrderIndex(courseId);
		long totalLessons = sections.stream()
				.mapToLong(s -> s.getLessons() == null ? 0 : s.getLessons().size())
				.sum();

		if (totalLessons == 0) return;

		long completed = lessonProgressRepository.findAllByEnrollmentId(enrollment.getId())
				.stream()
				.filter(lp -> Boolean.TRUE.equals(lp.getIsCompleted()))
				.count();

		BigDecimal percent = BigDecimal.valueOf(completed)
				.multiply(BigDecimal.valueOf(100))
				.divide(BigDecimal.valueOf(totalLessons), 2, RoundingMode.HALF_UP);
		enrollment.setProgressPercent(percent);
		enrollmentRepository.save(enrollment);
	}

	/**
	 * Idempotent — gọi nhiều lần vẫn an toàn, không tạo cert trùng.
	 */
	private void issueCertificateIfNotExists(Enrollment enrollment) {
		String studentId = enrollment.getStudent().getId();
		String courseId  = enrollment.getCourse().getId();

		boolean alreadyIssued = certificateRepository
				.findByStudentIdAndCourseId(studentId, courseId)
				.isPresent();
		if (alreadyIssued) return;

		Course course = enrollment.getCourse();
		String instructorName = (course.getTeacher().getProfile() != null)
				? course.getTeacher().getProfile().getFullName()
				: course.getTeacher().getEmail();

		certificateRepository.save(
				Certificate.builder()
						.id(java.util.UUID.randomUUID().toString())
						.student(enrollment.getStudent())
						.course(course)
						.courseTitle(course.getTitle())       // snapshot
						.instructorName(instructorName)       // snapshot
						.issuedAt(LocalDateTime.now())
						.build()
		);
	}
}