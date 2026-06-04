package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.dto.request.CourseRequest;
import vn.codemia.api.dto.response.CourseResponse;
import vn.codemia.api.entity.Course;
import vn.codemia.api.entity.Notification;
import vn.codemia.api.entity.Tag;
import vn.codemia.api.entity.User;
import vn.codemia.api.enums.CourseStatus;
import vn.codemia.api.enums.SubmissionType;
import vn.codemia.api.enums.Role;

import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.mapper.CourseMapper;
import vn.codemia.api.repository.*;
import vn.codemia.api.repository.ReviewRepository;
import vn.codemia.api.service.CourseService;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

	private final CourseRepository courseRepository;
	private final CategoryRepository categoryRepository;
	private final TagRepository tagRepository;
	private final UserRepository userRepository;
	private final CourseMapper courseMapper;
	private final SectionRepository sectionRepository;
	private final NotificationRepository notificationRepository;
	private final EnrollmentRepository enrollmentRepository;
	private final ReviewRepository reviewRepository;

	// ============================================================
	// Helper: lấy user đang login từ Security Context
	// ============================================================
	private User getCurrentUser() {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
	}

	// Helper: lấy user hiện tại — trả Optional, không throw (dùng cho guest)
	private Optional<User> getCurrentUserOptional() {
		try {
			var auth = SecurityContextHolder.getContext().getAuthentication();
			if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
				return Optional.empty();
			}
			return userRepository.findByEmail(auth.getName());
		} catch (Exception e) {
			return Optional.empty();
		}
	}

	// ============================================================
	// Helper: kiểm tra owner — chỉ owner hoặc ADMIN mới được phép
	// ============================================================
	private void checkOwnership(Course course, User currentUser) {
		boolean isAdmin = currentUser.getRole() == Role.ADMIN;
		boolean isOwner = course.getTeacher().getId().equals(currentUser.getId());
		if (!isOwner && !isAdmin) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}
	}

	@Override
	@Transactional
	public CourseResponse create(CourseRequest request) {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();
		User teacher = userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		String slug = generateUniqueSlug(request.getTitle());

		Course course = courseMapper.toCourse(request);
		course.setSlug(slug);
		course.setTeacher(teacher);

		var category = categoryRepository.findById(request.getCategoryId())
				.orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
		course.setCategory(category);

		if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
			List<Tag> tags = tagRepository.findAllById(request.getTagIds());
			course.setTags(new HashSet<>(tags));
		}

		return courseMapper.toCourseResponse(courseRepository.save(course));
	}

	@Override
	public CourseResponse getById(String id) {
		return courseRepository.findById(id)
				.map(courseMapper::toCourseResponse)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
	}

	@Override
	public List<CourseResponse> getAll() {
		Optional<User> currentUser = getCurrentUserOptional();

		return courseRepository.findAllByStatus(CourseStatus.PUBLISHED).stream()
				.map(course -> {
					CourseResponse response = courseMapper.toCourseResponse(course);
					// Set enrolled: true nếu user đã login và đã enroll khóa này
					boolean enrolled = currentUser
							.map(u -> enrollmentRepository.existsByStudentIdAndCourseId(u.getId(), course.getId()))
							.orElse(false);
					response.setEnrolled(enrolled);
					response.setAverageRating(reviewRepository.findAverageRatingByCourseId(course.getId()));
					response.setReviewCount(reviewRepository.countByCourseId(course.getId()));
					return response;
				})
				.collect(Collectors.toList());
	}

	@Override
	@Transactional
	public CourseResponse update(String id, CourseRequest request) {
		Course course = courseRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		User currentUser = getCurrentUser();
		checkOwnership(course, currentUser);

		// Không cho phép sửa metadata khi đang PENDING
		if (course.getStatus() == CourseStatus.PENDING) {
			throw new AppException(ErrorCode.COURSE_CANNOT_UPDATE_PENDING);
		}

		// Snapshot các field nhạy cảm TRƯỚC khi mapper ghi đè
		String oldTitle       = course.getTitle();
		String oldDescription = course.getDescription();
		java.math.BigDecimal oldPrice = course.getPrice();

		courseMapper.updateCourse(course, request);

		var category = categoryRepository.findById(request.getCategoryId())
				.orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
		course.setCategory(category);

		if (request.getTagIds() != null) {
			List<Tag> tags = tagRepository.findAllById(request.getTagIds());
			course.setTags(new HashSet<>(tags));
		}

		// Chỉ trigger re-approval khi field nhạy cảm thực sự thay đổi.
		// Đổi thumbnail đơn thuần sẽ KHÔNG đưa khóa học về PENDING.
		// Dùng compareTo cho BigDecimal — Objects.equals so sánh cả scale
		// nên BigDecimal("50.00").equals(BigDecimal("50.0")) = false dù giá không đổi.
		boolean priceChanged = (oldPrice == null)
				? course.getPrice() != null
				: course.getPrice() == null || oldPrice.compareTo(course.getPrice()) != 0;

		boolean sensitiveFieldChanged =
				!Objects.equals(oldTitle,       course.getTitle())       ||
						!Objects.equals(oldDescription, course.getDescription()) ||
						priceChanged;

		boolean isTeacher = currentUser.getRole() == Role.TEACHER;
		if (isTeacher
				&& (course.getStatus() == CourseStatus.PUBLISHED
				|| course.getStatus() == CourseStatus.UNLISTED)
				&& sensitiveFieldChanged) {
			course.setStatus(CourseStatus.PENDING);
			course.setRejectedReason(null);
			course.setSubmissionType(SubmissionType.EDIT);
			course.setOldTitle(oldTitle);
			course.setOldPrice(oldPrice);
			course.setOldDescription(oldDescription);


			// Thông báo cho admin
			List<User> admins = userRepository.findByRole(Role.ADMIN);
			List<Notification> notifications = admins.stream()
					.map(admin -> Notification.builder()
							.user(admin)
							.title("Khóa học cần duyệt lại")
							.content("Giáo viên \""
									+ (currentUser.getProfile() != null
									? currentUser.getProfile().getFullName()
									: currentUser.getEmail())
									+ "\" đã cập nhật thông tin khóa học \""
									+ course.getTitle()
									+ "\" — cần duyệt lại trước khi public.")
							.isRead(false)
							.build())
					.toList();
			notificationRepository.saveAll(notifications);
		}

		return courseMapper.toCourseResponse(courseRepository.save(course));
	}

	@Override
	@Transactional
	public CourseResponse updateStatus(String id, String status) {
		Course course = courseRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		checkOwnership(course, getCurrentUser());

		CourseStatus newStatus = CourseStatus.valueOf(status.toUpperCase());
		course.setStatus(newStatus);
		CourseResponse response =
				courseMapper.toCourseResponse(courseRepository.save(course));

		// THÊM MỚI: Notify enrolled students khi course không còn accessible.
		// DRAFT và REJECTED là 2 status duy nhất làm student mất quyền truy cập
		// (không có UNPUBLISHED/LOCKED trong enum CourseStatus).
		if (newStatus == CourseStatus.DRAFT || newStatus == CourseStatus.REJECTED) {
			List<vn.codemia.api.entity.Enrollment> enrollments =
					enrollmentRepository.findByCourseId(id);
			if (!enrollments.isEmpty()) {
				List<Notification> notifs = enrollments.stream()
						.map(e -> Notification.builder()
								.user(e.getStudent())
								.title("Khóa học tạm ngừng")
								.content("Khóa học \"" + course.getTitle()
										+ "\" tạm thời không khả dụng. "
										+ "Vui lòng liên hệ giảng viên.")
								.isRead(false)
								.build())
						.toList();
				notificationRepository.saveAll(notifs);
			}
		}

		return response;
	}

	@Override
	public CourseResponse getBySlug(String slug) {
		Course course = courseRepository.findBySlug(slug)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		Optional<User> currentUserOpt = getCurrentUserOptional();

		if (course.getStatus() == CourseStatus.UNLISTED) {
			// UNLISTED: chỉ owner, admin, hoặc student đã enroll mới xem được
			boolean canAccess = currentUserOpt.map(u -> {
				boolean isOwner = course.getTeacher().getId().equals(u.getId());
				boolean isAdmin = u.getRole() == Role.ADMIN;
				boolean isEnrolled = enrollmentRepository
						.existsByStudentIdAndCourseId(u.getId(), course.getId());
				return isOwner || isAdmin || isEnrolled;
			}).orElse(false);

			if (!canAccess) {
				throw new AppException(ErrorCode.COURSE_NOT_FOUND);
			}
		} else if (course.getStatus() != CourseStatus.PUBLISHED) {
			throw new AppException(ErrorCode.COURSE_NOT_FOUND);
		}

		CourseResponse response = courseMapper.toCourseResponse(course);
		boolean enrolled = currentUserOpt
				.map(u -> enrollmentRepository.existsByStudentIdAndCourseId(u.getId(), course.getId()))
				.orElse(false);
		response.setEnrolled(enrolled);
		response.setAverageRating(reviewRepository.findAverageRatingByCourseId(course.getId()));
		response.setReviewCount(reviewRepository.countByCourseId(course.getId()));
		return response;
	}

	@Override
	@Transactional
	public void delete(String id) {
		Course course = courseRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		User currentUser = getCurrentUser();
		checkOwnership(course, currentUser);

		boolean isAdmin = currentUser.getRole() == Role.ADMIN;

		// Teacher không được xóa nếu đã có student enroll — chỉ Admin mới được
		if (!isAdmin) {
			long studentCount = courseRepository.countStudentsByCourseId(id);
			if (studentCount > 0) {
				throw new AppException(ErrorCode.COURSE_HAS_STUDENTS);
			}
		}

		// Soft delete — giải phóng slug để teacher có thể tạo lại course cùng tên sau này.
		// Nếu không mangle, DB unique constraint vẫn giữ slug cũ dù @SQLRestriction che nó khỏi JPA.
		course.setSlug(course.getSlug() + "__deleted_" + System.currentTimeMillis());
		course.setDeletedAt(LocalDateTime.now());
		courseRepository.save(course);

		// Notify tất cả student đã enroll
		List<vn.codemia.api.entity.Enrollment> enrollments =
				courseRepository.findAllEnrollmentsByCourseId(id);
		if (!enrollments.isEmpty()) {
			List<Notification> studentNotifs = enrollments.stream()
					.map(e -> Notification.builder()
							.user(e.getStudent())
							.title("Khóa học đã bị gỡ khỏi nền tảng")
							.content("Khóa học \"" + course.getTitle()
									+ "\" mà bạn đã đăng ký đã bị gỡ khỏi nền tảng."
									+ " Vui lòng liên hệ bộ phận hỗ trợ nếu cần thêm thông tin.")
							.isRead(false)
							.build())
					.toList();
			notificationRepository.saveAll(studentNotifs);
		}

		// Admin xóa → notify thêm cho teacher
		if (isAdmin) {
			String adminName = (currentUser.getProfile() != null)
					? currentUser.getProfile().getFullName()
					: currentUser.getEmail();
			notificationRepository.save(Notification.builder()
					.user(course.getTeacher())
					.title("Khóa học của bạn đã bị gỡ")
					.content("Khóa học \"" + course.getTitle()
							+ "\" của bạn đã bị Admin \"" + adminName
							+ "\" gỡ khỏi nền tảng. Vui lòng liên hệ bộ phận hỗ trợ để biết thêm chi tiết.")
					.isRead(false)
					.build());
		}
	}

	// ─── Submit course lên PENDING ────────────────────────────────────────────
	@Override
	@Transactional
	public void submitCourse(String courseId) {
		User currentUser = getCurrentUser();

		Course course = courseRepository.findById(courseId)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		// Chỉ owner mới được submit
		if (!course.getTeacher().getId().equals(currentUser.getId())) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		// Chỉ cho phép submit từ DRAFT hoặc REJECTED
		if (course.getStatus() != CourseStatus.DRAFT && course.getStatus() != CourseStatus.REJECTED) {
			throw new AppException(ErrorCode.COURSE_CANNOT_SUBMIT);
		}

		// Phải có ít nhất 1 section
		long sectionCount = sectionRepository.countByCourseId(courseId);
		if (sectionCount == 0) {
			throw new AppException(ErrorCode.COURSE_EMPTY);
		}

		// Phải có ít nhất 1 lesson trong bất kỳ section nào
		long lessonCount = sectionRepository.countLessonsByCourseId(courseId);
		if (lessonCount == 0) {
			throw new AppException(ErrorCode.COURSE_EMPTY);
		}

		course.setStatus(CourseStatus.PENDING);
		course.setRejectedReason(null);

		if (Boolean.TRUE.equals(course.getPublishedOnce())) {
			course.setSubmissionType(SubmissionType.EDIT);
			if (course.getOldTitle() == null) {
				course.setOldTitle(course.getTitle());
			}
			if (course.getOldPrice() == null) {
				course.setOldPrice(course.getPrice());
			}
			if (course.getOldDescription() == null) {
				course.setOldDescription(course.getDescription());
			}
		} else {
			course.setSubmissionType(SubmissionType.NEW);
		}

		courseRepository.save(course);
	}

	@Override
	@Transactional
	public void cancelPendingCourse(String courseId) {
		User currentUser = getCurrentUser();

		Course course = courseRepository.findById(courseId)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		if (!course.getTeacher().getId().equals(currentUser.getId())) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		if (course.getStatus() != CourseStatus.PENDING) {
			throw new AppException(ErrorCode.COURSE_CANNOT_CANCEL_PENDING);
		}

		course.setStatus(CourseStatus.DRAFT);
		courseRepository.save(course);

		// Thông báo cho tất cả admin
		List<User> admins = userRepository.findByRole(Role.ADMIN);
		List<Notification> notifications = admins.stream()
				.map(admin -> Notification.builder()
						.user(admin)
						.title("Khóa học đã bị rút khỏi hàng chờ duyệt")
						.content("Giáo viên \""
								+ (currentUser.getProfile() != null
								? currentUser.getProfile().getFullName()
								: currentUser.getEmail())
								+ "\" đã rút khóa học \""
								+ course.getTitle()
								+ "\" khỏi hàng chờ duyệt.")
						.isRead(false)
						.build())
				.toList();
		notificationRepository.saveAll(notifications);
	}

	// ─── Slug helpers ─────────────────────────────────────────────────────────

	/**
	 * Chuyển title thành slug chuẩn: lowercase, bỏ dấu tiếng Việt, thay space → '-'.
	 * Ví dụ: "Lập Trình Web!" → "lap-trinh-web"
	 */
	private String generateSlug(String title) {
		return title.toLowerCase()
				.replaceAll("á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ", "a")
				.replaceAll("é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ", "e")
				.replaceAll("í|ì|ỉ|ĩ|ị", "i")
				.replaceAll("ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ", "o")
				.replaceAll("ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự", "u")
				.replaceAll("ý|ỳ|ỷ|ỹ|ỵ", "y")
				.replaceAll("đ", "d")
				.replaceAll("[^a-z0-9 ]", "")
				.trim()
				.replaceAll("\\s+", "-");
	}

	/**
	 * Sinh slug unique: nếu base slug đã tồn tại thì append "-2", "-3", ...
	 * Ví dụ: "temp" đã có → thử "temp-2" → "temp-3" → ... cho đến khi tìm được.
	 */
	private String generateUniqueSlug(String title) {
		String base = generateSlug(title);
		// Dùng countBySlugIncludingDeleted (native query, return int) để bypass
		// @SQLRestriction("deleted_at IS NULL") — tránh tái tạo slug trùng với deleted rows.
		if (courseRepository.countBySlugIncludingDeleted(base) == 0) {
			return base;
		}
		int suffix = 2;
		while (courseRepository.countBySlugIncludingDeleted(base + "-" + suffix) > 0) {
			suffix++;
		}
		return base + "-" + suffix;
	}
	// ─── Unpublish / Republish ────────────────────────────────────────────────
	@Override
	@Transactional
	public void unpublishCourse(String courseId) {
		User currentUser = getCurrentUser();
		Course course = courseRepository.findById(courseId)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		if (!course.getTeacher().getId().equals(currentUser.getId())) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		if (course.getStatus() != CourseStatus.PUBLISHED) {
			throw new AppException(ErrorCode.COURSE_CANNOT_UNPUBLISH);
		}

		course.setStatus(CourseStatus.UNLISTED);
		courseRepository.save(course);
	}

	@Override
	@Transactional
	public void republishCourse(String courseId) {
		User currentUser = getCurrentUser();
		Course course = courseRepository.findById(courseId)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		if (!course.getTeacher().getId().equals(currentUser.getId())) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}

		if (course.getStatus() != CourseStatus.UNLISTED) {
			throw new AppException(ErrorCode.COURSE_CANNOT_REPUBLISH);
		}

		// Course đã được admin approve trước đó → không cần duyệt lại
		course.setStatus(CourseStatus.PUBLISHED);
		courseRepository.save(course);
	}
}