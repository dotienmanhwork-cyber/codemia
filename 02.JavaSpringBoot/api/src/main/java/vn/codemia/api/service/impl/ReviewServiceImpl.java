package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.dto.request.ReviewRequest;
import vn.codemia.api.dto.response.ReviewResponse;
import vn.codemia.api.entity.Course;
import vn.codemia.api.entity.Enrollment;
import vn.codemia.api.entity.Review;
import vn.codemia.api.entity.User;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.repository.CourseRepository;
import vn.codemia.api.repository.EnrollmentRepository;
import vn.codemia.api.repository.ReviewRepository;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.service.ReviewService;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

	private final ReviewRepository reviewRepository;
	private final CourseRepository courseRepository;
	private final UserRepository userRepository;
	private final EnrollmentRepository enrollmentRepository;

	// ── Helper ──────────────────────────────────────────────────────────────
	private User getCurrentUser() {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
	}

	private Course getCourseBySlug(String slug) {
		return courseRepository.findBySlug(slug)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
	}

	private ReviewResponse toResponse(Review review) {
		User student = review.getStudent();
		String studentName = (student.getProfile() != null)
				? student.getProfile().getFullName()
				: student.getEmail();
		String studentAvatar = (student.getProfile() != null)
				? student.getProfile().getAvatarUrl()
				: null;

		return ReviewResponse.builder()
				.id(review.getId())
				.rating(review.getRating())
				.comment(review.getComment())
				.studentId(student.getId())
				.studentName(studentName)
				.studentAvatar(studentAvatar)
				.teacherReply(review.getTeacherReply())
				.repliedAt(review.getRepliedAt())
				.createdAt(review.getCreatedAt())
				.updatedAt(review.getUpdatedAt())
				.build();
	}

	// ── Submit review ────────────────────────────────────────────────────────
	@Override
	@Transactional
	public ReviewResponse submitReview(String courseSlug, ReviewRequest request) {
		User student = getCurrentUser();
		Course course = getCourseBySlug(courseSlug);

		// Phải đã enroll
		Enrollment enrollment = enrollmentRepository
				.findByStudentIdAndCourseId(student.getId(), course.getId())
				.orElseThrow(() -> new AppException(ErrorCode.NOT_ENROLLED));

		// Phải hoàn thành 100%
		if (enrollment.getProgressPercent().compareTo(new BigDecimal("100")) < 0) {
			throw new AppException(ErrorCode.COURSE_NOT_COMPLETED);
		}

		// Mỗi student chỉ review 1 lần
		if (reviewRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())) {
			throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
		}

		Review review = Review.builder()
				.course(course)
				.student(student)
				.rating(request.getRating())
				.comment(request.getComment())
				.build();

		return toResponse(reviewRepository.save(review));
	}

	// ── Lấy tất cả review của course (public) ───────────────────────────────
	@Override
	public List<ReviewResponse> getReviewsByCourse(String courseSlug) {
		Course course = getCourseBySlug(courseSlug);
		return reviewRepository.findByCourseIdOrderByCreatedAtDesc(course.getId())
				.stream()
				.map(this::toResponse)
				.toList();
	}

	// ── Lấy review của student đang login ───────────────────────────────────
	@Override
	public ReviewResponse getMyReview(String courseSlug) {
		User student = getCurrentUser();
		Course course = getCourseBySlug(courseSlug);

		return reviewRepository.findByStudentIdAndCourseId(student.getId(), course.getId())
				.map(this::toResponse)
				.orElse(null); // null = chưa review, FE kiểm tra
	}

	// ── Cập nhật review ──────────────────────────────────────────────────────
	@Override
	@Transactional
	public ReviewResponse updateReview(Integer reviewId, ReviewRequest request) {
		User student = getCurrentUser();
		Review review = reviewRepository.findById(reviewId)
				.orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

		// Chỉ chính student mới được sửa
		if (!review.getStudent().getId().equals(student.getId())) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		review.setRating(request.getRating());
		review.setComment(request.getComment());

		return toResponse(reviewRepository.save(review));
	}

	// ── Xóa review ──────────────────────────────────────────────────────────
	@Override
	@Transactional
	public void deleteReview(Integer reviewId) {
		User currentUser = getCurrentUser();
		Review review = reviewRepository.findById(reviewId)
				.orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

		boolean isOwner = review.getStudent().getId().equals(currentUser.getId());
		boolean isAdmin = currentUser.getRole().name().equals("ADMIN");

		if (!isOwner && !isAdmin) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		reviewRepository.deleteById(reviewId);
	}
}