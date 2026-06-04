package vn.codemia.api.service.impl;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.codemia.api.dto.request.AdminCourseStatusRequest;
import vn.codemia.api.dto.response.AdminCourseDetailResponse;
import vn.codemia.api.dto.response.AdminCourseResponse;
import vn.codemia.api.dto.response.AdminDashboardStatsResponse;
import vn.codemia.api.dto.response.AdminFinanceStatsResponse;
import vn.codemia.api.dto.response.AdminMonthlyBreakdownResponse;
import vn.codemia.api.dto.response.AdminTeacherPayoutResponse;
import vn.codemia.api.dto.response.ExerciseResponse;
import vn.codemia.api.dto.response.LessonResponse;
import vn.codemia.api.dto.response.RoleDowngradeImpactResponse;
import vn.codemia.api.dto.response.RoleRequestResponse;
import vn.codemia.api.entity.Course;
import vn.codemia.api.entity.Lesson;
import vn.codemia.api.entity.RoleChangeLog;
import vn.codemia.api.entity.User;
import vn.codemia.api.entity.Withdrawal;
import vn.codemia.api.enums.CourseStatus;
import vn.codemia.api.enums.Role;
import vn.codemia.api.enums.UserStatus;
import vn.codemia.api.enums.SubmissionType;

import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.mapper.ExerciseMapper;
import vn.codemia.api.mapper.LessonMapper;
import vn.codemia.api.repository.*;
import vn.codemia.api.service.AdminService;
import vn.codemia.api.service.AiService;
import vn.codemia.api.service.NotificationService;
import vn.codemia.api.service.RefundService;

import org.springframework.security.core.context.SecurityContextHolder;
import lombok.extern.slf4j.Slf4j;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

	private final UserRepository          userRepository;
	private final OrderDetailRepository   orderDetailRepository;
	private final CourseRepository        courseRepository;
	private final EnrollmentRepository    enrollmentRepository;
	private final RefundRequestRepository refundRequestRepository;
	private final LessonProgressRepository lessonProgressRepository;
	private final SubmissionRepository    submissionRepository;
	private final CertificateRepository   certificateRepository;
	private final ReviewRepository        reviewRepository;
	private final CartItemRepository      cartItemRepository;
	private final SectionRepository       sectionRepository;
	private final NotificationService     notificationService;
	private final LessonRepository        lessonRepository;
	private final LessonMapper            lessonMapper;
	private final ExerciseRepository      exerciseRepository;
	private final ExerciseMapper          exerciseMapper;
	private final WithdrawalRepository    withdrawalRepository;
	private final RoleChangeLogRepository roleChangeLogRepository;
	private final RefundService           refundService;    // ← Phase 2
	private final AiService               aiService;;
	// =============================================
	// DASHBOARD
	// =============================================

	@Override
	public AdminDashboardStatsResponse getDashboardStats() {
		long totalUsers       = userRepository.count();
		long pendingApprovals = userRepository.countByStatus(UserStatus.PENDING_TEACHER);
		return AdminDashboardStatsResponse.builder()
				.totalUsers(totalUsers)
				.pendingApprovals(pendingApprovals)
				.systemHealth(99.9)
				.monthlyRevenue(0.0)
				.userGrowth(0.0)
				.build();
	}

	@Override
	public List<RoleRequestResponse> getRoleRequests(int limit) {
		return userRepository.findAllByStatusWithProfile(UserStatus.PENDING_TEACHER)
				.stream()
				.limit(limit)
				.map(this::toRoleRequestResponse)
				.collect(Collectors.toList());
	}

	// =============================================
	// ROLES PAGE
	// =============================================

	@Override
	public List<RoleRequestResponse> getAllRoleRequests() {
		return userRepository.findAllByStatusWithProfile(UserStatus.PENDING_TEACHER)
				.stream()
				.map(this::toRoleRequestResponse)
				.collect(Collectors.toList());
	}

	@Override
	@Transactional
	public void approveRole(String userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		user.setRole(Role.TEACHER);
		user.setStatus(UserStatus.ACTIVE);
		user.setUpgradeReason(null);
		user.setCvUrl(null);
		user.setPortfolioUrl(null);
		userRepository.saveAndFlush(user);

		String approveAdminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
		roleChangeLogRepository.save(
				RoleChangeLog.builder()
						.userId(userId)
						.changedByEmail(approveAdminEmail)
						.fromRole(Role.STUDENT)
						.toRole(Role.TEACHER)
						.note("Approved from role upgrade request")
						.build()
		);

		notificationService.notifyUser(
				user,
				"Yêu cầu nâng cấp được chấp thuận ✓",
				"Chúc mừng! Tài khoản của bạn đã được nâng cấp lên Teacher."
		);

		String userName = user.getProfile() != null ? user.getProfile().getFullName() : user.getEmail();
		notificationService.notifyAllAdmins(
				"Đã duyệt Teacher",
				"Yêu cầu nâng cấp của \"" + userName + "\" (" + user.getEmail() + ") đã được chấp thuận."
		);
	}

	@Override
	@Transactional
	public void declineRole(String userId, String reason) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		user.setRole(Role.STUDENT);
		user.setStatus(UserStatus.ACTIVE);
		user.setUpgradeReason(null);
		user.setCvUrl(null);
		user.setPortfolioUrl(null);
		userRepository.saveAndFlush(user);

		String content = (reason != null && !reason.isBlank())
				? "Yêu cầu nâng cấp lên Teacher của bạn chưa được chấp thuận. Lý do: " + reason.trim()
				: "Yêu cầu nâng cấp lên Teacher của bạn chưa được chấp thuận lần này.";

		String declineAdminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
		roleChangeLogRepository.save(
				RoleChangeLog.builder()
						.userId(userId)
						.changedByEmail(declineAdminEmail)
						.fromRole(Role.STUDENT)
						.toRole(Role.STUDENT)
						.note("Declined role upgrade request"
								+ (reason != null && !reason.isBlank() ? ". Lý do: " + reason.trim() : ""))
						.build()
		);

		notificationService.notifyUser(user, "Yêu cầu nâng cấp bị từ chối", content);

		String userName = user.getProfile() != null ? user.getProfile().getFullName() : user.getEmail();
		notificationService.notifyAllAdmins(
				"Đã từ chối Teacher",
				"Yêu cầu nâng cấp của \"" + userName + "\" (" + user.getEmail() + ") đã bị từ chối."
						+ (reason != null && !reason.isBlank() ? " Lý do: " + reason.trim() : "")
		);
	}

	// =============================================
	// ROLE DOWNGRADE
	// =============================================
	@Override
	@Transactional
	public void blockTeacher(String teacherId, String reason) {
		// 1. Tìm và Khóa tài khoản Teacher
		User teacher = userRepository.findById(teacherId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_TEACHER));

		if (teacher.getRole() != Role.TEACHER) {
			throw new AppException(ErrorCode.INVALID_REQUEST); // Hoặc mã lỗi phù hợp của hệ thống
		}

		teacher.setStatus(UserStatus.BLOCKED);
		userRepository.save(teacher);

		// 2. Xử lý các Khóa học (Dựa trên hàm có sẵn trong CourseRepository của bạn)
		List<Course> courses = courseRepository.findAllByTeacherId(teacherId);
		for (Course course : courses) {
			// Sử dụng hàm countByCourseId đã có sẵn trong EnrollmentRepository của bạn
			long enrollmentCount = enrollmentRepository.countByCourseId(course.getId());

			if (enrollmentCount == 0) {
				// Không có học viên -> Xóa hoàn toàn
				courseRepository.delete(course);
			} else {
				// Đã có học viên -> Chuyển về SUSPENDED (Admin khóa vi phạm)
				course.setStatus(CourseStatus.SUSPENDED);
				courseRepository.save(course);
			}
		}

		// 3. Xử lý Lệnh rút tiền & Số dư tài chính
		// Hủy các lệnh PENDING chuyển thành CANCELLED (Sử dụng hàm tìm kiếm theo trạng thái có sẵn)
		List<Withdrawal> pendingWithdrawals = withdrawalRepository.findByTeacherIdAndStatus(teacherId, Withdrawal.WithdrawalStatus.PENDING);
		for (Withdrawal pending : pendingWithdrawals) {
			pending.setStatus(Withdrawal.WithdrawalStatus.CANCELLED);
			pending.setNote("Hệ thống tự động hủy do tài khoản Giảng viên bị khóa.");
			withdrawalRepository.save(pending);
		}

		// Tính toán số dư thực tế còn lại (Thu nhập thực tế - Tiền đã APPROVED)
		// Hãy thay 'sumTeacherEarningsByTeacherId' bằng tên hàm thực tế ở bước 2 nếu có khác biệt
		double totalEarned = orderDetailRepository.sumTotalEarningsByTeacherId(teacherId);
		double totalApproved = withdrawalRepository.sumApprovedByTeacherId(teacherId);
		double currentBalance = totalEarned - totalApproved;

		// Nếu tài khoản còn tiền dương, tạo 1 lệnh HOLD gom toàn bộ tiền lại
		if (currentBalance > 0) {
			String bankInfo = (teacher.getProfile() != null) ? teacher.getProfile().getBankAccountInfo() : null;

			Withdrawal holdWithdrawal = Withdrawal.builder()
					.teacher(teacher)
					.amount(BigDecimal.valueOf(currentBalance))
					.status(Withdrawal.WithdrawalStatus.HOLD)
					.note("Tài khoản bị KHÓA. Hệ thống đóng băng toàn bộ số dư. Lý do: " + (reason != null ? reason : "Vi phạm chính sách"))
					.bankSnapshot(bankInfo)
					.build();

			withdrawalRepository.save(holdWithdrawal);
		}
	}
	@Override
	public RoleDowngradeImpactResponse getDowngradeImpact(String userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		if (user.getRole() != Role.TEACHER) {
			throw new AppException(ErrorCode.INVALID_ROLE);
		}

		long publishedCourses = courseRepository.countByTeacherIdAndStatus(userId, CourseStatus.PUBLISHED);
		long pendingCourses   = courseRepository.countByTeacherIdAndStatus(userId, CourseStatus.PENDING);
		long draftCourses     = courseRepository.countByTeacherIdAndStatus(userId, CourseStatus.DRAFT);

		long pendingWithdrawals = withdrawalRepository
				.findByTeacherIdAndStatus(userId, Withdrawal.WithdrawalStatus.PENDING)
				.size();

		double totalEarned      = orderDetailRepository.sumTotalEarningsByTeacherId(userId);
		double totalApproved    = withdrawalRepository.sumApprovedByTeacherId(userId);
		double totalFrozen      = withdrawalRepository.sumFrozenByTeacherId(userId);
		// Trừ cả frozen (HOLD + PENDING) — nhất quán với cách downgradeUserRole() tính
		double remainingBalance = Math.max(totalEarned - totalApproved - totalFrozen, 0);

		// Tính tổng số student sẽ nhận refund (cho modal impact)
		List<CourseStatus> activeStatuses = List.of(
				CourseStatus.PUBLISHED, CourseStatus.UNLISTED, CourseStatus.SUSPENDED
		);
		List<Course> activeCourses = courseRepository.findByTeacherIdAndStatusIn(userId, activeStatuses);
		long affectedStudents = activeCourses.stream()
				.mapToLong(c -> enrollmentRepository.countByCourseId(c.getId()))
				.sum();

		return RoleDowngradeImpactResponse.builder()
				.userId(userId)
				.publishedCourses(publishedCourses)
				.pendingCourses(pendingCourses)
				.draftCourses(draftCourses)
				.pendingWithdrawals(pendingWithdrawals)
				.remainingBalance(remainingBalance)
				// TODO: thêm affectedStudents vào RoleDowngradeImpactResponse DTO nếu FE cần
				.build();
	}

	/**
	 * Hạ role Teacher → Student + toàn bộ side effects trong 1 @Transactional.
	 *
	 * Side effects (theo thứ tự):
	 *   1. role → STUDENT
	 *   2. PENDING courses → DRAFT
	 *   3. PUBLISHED/UNLISTED/SUSPENDED courses: giữ nguyên status, student vẫn học
	 *   3b. [Phase 2] Tạo RefundRequest cho student của các course đó
	 *   4. PENDING withdrawals → HOLD
	 *   4b. Nếu còn remainingBalance > 0 → tạo final PENDING withdrawal (kèm bank snapshot)
	 *   5. Ghi RoleChangeLog
	 *   6. Notify teacher + admin
	 */
	@Override
	@Transactional
	public void downgradeUserRole(String userId, String adminEmail, String note) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		if (user.getRole() != Role.TEACHER) {
			throw new AppException(ErrorCode.INVALID_ROLE);
		}

		// ── 1. Hạ role ────────────────────────────────────────────────────────
		user.setRole(Role.STUDENT);
		if (user.getStatus() == UserStatus.PENDING_TEACHER) {
			user.setStatus(UserStatus.ACTIVE);
		}
		userRepository.saveAndFlush(user);

		// ── 2. PENDING courses → DRAFT ────────────────────────────────────────
		courseRepository.updateStatusByTeacherAndStatus(
				userId, CourseStatus.PENDING, CourseStatus.DRAFT
		);

		// ── 3. PUBLISHED/UNLISTED courses → UNLISTED (ẩn khỏi catalog) ──────────
		// Student cũ vẫn truy cập bình thường qua "Khóa học của tôi".
		// Course bị ẩn khỏi catalog để người dùng mới không thể tìm thấy,
		// vì giảng viên không còn quyền quản lý nữa.
		// Refund chỉ xảy ra khi Admin DELETE course.
		int hiddenCount = courseRepository.updateStatusByTeacherAndStatus(
				userId, CourseStatus.PUBLISHED, CourseStatus.UNLISTED
		);

		LocalDateTime now = LocalDateTime.now();

		// ── 4. Cancel toàn bộ PENDING + tạo 1 lệnh duy nhất ─────────────────────
		// sumFrozenByTeacherId tính cả HOLD + PENDING nên cần cộng lại totalPending:
		//   totalPayout = totalEarned - totalApproved - (HOLD + PENDING) + PENDING
		//               = totalEarned - totalApproved - HOLD
		//               = availableBalance + totalPendingAmount  ✓
		//   Ví dụ: earned=400k, approved=0, frozen=100k(PENDING), pending=100k
		//          → totalPayout = 400k - 0 - 100k + 100k = 400k  ✓
		List<Withdrawal> pendingWithdrawals = withdrawalRepository
				.findByTeacherIdAndStatus(userId, Withdrawal.WithdrawalStatus.PENDING);

		double totalPending  = pendingWithdrawals.stream()
				.mapToDouble(w -> w.getAmount().doubleValue())
				.sum();

		double totalEarned   = orderDetailRepository.sumTotalEarningsByTeacherId(userId);
		double totalApproved = withdrawalRepository.sumApprovedByTeacherId(userId);
		double totalFrozen   = withdrawalRepository.sumFrozenByTeacherId(userId); // HOLD + PENDING
		double totalPayout   = Math.max(totalEarned - totalApproved - totalFrozen + totalPending, 0);

		String cancelNote = "Tài khoản bị hạ role — lệnh rút được gộp vào 1 lệnh mới."
				+ (note != null && !note.isBlank() ? " Ghi chú: " + note.trim() : "");

// Cancel toàn bộ PENDING cũ (superseded bởi lệnh gộp bên dưới)
		if (!pendingWithdrawals.isEmpty()) {
			pendingWithdrawals.forEach(w -> {
				w.setStatus(Withdrawal.WithdrawalStatus.CANCELLED);
				w.setNote(cancelNote);
				w.setProcessedAt(now);
				w.setProcessedBy(adminEmail);
			});
			withdrawalRepository.saveAll(pendingWithdrawals);
		}

// ── 4b. Tạo 1 lệnh duy nhất cho toàn bộ tiền còn lại ────────────────────
		if (totalPayout > 0) {
			String bankSnapshot = (user.getProfile() != null)
					? user.getProfile().getBankAccountInfo()
					: null;

			Withdrawal.WithdrawalStatus finalStatus = (bankSnapshot != null && !bankSnapshot.isBlank())
					? Withdrawal.WithdrawalStatus.PENDING
					: Withdrawal.WithdrawalStatus.HOLD;

			String finalNote = "Final payout — tài khoản bị hạ role ngày " + now.toLocalDate()
					+ (note != null && !note.isBlank() ? ". Ghi chú: " + note.trim() : "")
					+ (bankSnapshot == null || bankSnapshot.isBlank()
					? ". ⚠️ Chưa có thông tin ngân hàng — cần liên hệ teacher." : "");

			withdrawalRepository.save(Withdrawal.builder()
					.teacher(user)
					.amount(BigDecimal.valueOf(totalPayout))
					.status(finalStatus)
					.note(finalNote)
					.bankSnapshot(bankSnapshot)
					.build());
		}

		// ── 5. Ghi audit log ──────────────────────────────────────────────────
		roleChangeLogRepository.save(
				RoleChangeLog.builder()
						.userId(userId)
						.changedByEmail(adminEmail)
						.fromRole(Role.TEACHER)
						.toRole(Role.STUDENT)
						.note(note)
						.build()
		);

		// ── 6. Notify ─────────────────────────────────────────────────────────
		String userName = user.getProfile() != null
				? user.getProfile().getFullName() : user.getEmail();

		String bankSnapshot = (user.getProfile() != null)
				? user.getProfile().getBankAccountInfo() : null;

		// Tổng tiền cần thông báo cho teacher:
		//   - toHold: PENDING không có bank → vừa chuyển HOLD
		//   - PENDING có bank: vẫn PENDING, sẽ được admin approve bình thường
		//   - remainingBalance: final withdrawal vừa tạo ở bước 4b (0 nếu PENDING đã cover hết)
		double totalHeldAmount = totalPayout; // chính là lệnh duy nhất vừa tạo ở bước 4b

		String balanceMsg = "";
		if (totalHeldAmount > 0) {
			balanceMsg = (bankSnapshot != null)
					// Đã có STK → chờ admin duyệt bình thường
					? String.format(" Số dư %.0f₫ sẽ được admin hoàn trả về STK đã đăng ký.", totalHeldAmount)
					// Chưa có STK → nhắc cập nhật ngay
					: String.format(" ⚠️ Bạn có %.0f₫ chưa được rút nhưng tài khoản chưa có thông tin ngân hàng. "
									+ "Vui lòng vào Hồ sơ → Tài khoản ngân hàng để cập nhật "
									+ "và Admin sẽ chuyển khoản ngay sau đó.", totalHeldAmount);
		}

		String courseHiddenMsg = hiddenCount > 0
				? String.format(" %d khóa học đã bị ẩn khỏi catalog (vẫn còn truy cập cho học viên đã đăng ký).", hiddenCount)
				: "";

		String userMsg = "Tài khoản của bạn đã được chuyển về Student."
				+ (note != null && !note.isBlank() ? " Lý do: " + note.trim() + "." : "")
				+ courseHiddenMsg
				+ balanceMsg;

		notificationService.notifyUser(user, "Tài khoản bị thay đổi quyền", userMsg);

		String adminMsg = String.format(
				"Tài khoản \"%s\" (%s) đã bị hạ TEACHER → STUDENT.%s%s%s",
				userName,
				user.getEmail(),
				note != null && !note.isBlank() ? " Lý do: " + note.trim() + "." : "",
				hiddenCount > 0
						? String.format(" 🔒 %d khóa học đã bị ẩn (UNLISTED).", hiddenCount)
						: "",
				totalHeldAmount > 0
						? String.format(" ⚠️ Tổng %.0f₫ đang HOLD — cần approve.", totalHeldAmount)
						: ""
		);
		notificationService.notifyAllAdmins("Đã hạ role Teacher", adminMsg);
	}

	// =============================================
	// COURSES
	// =============================================

	@Override
	public Page<AdminCourseResponse> getCourses(
			int page, int size,
			String status, String keyword,
			Double minPrice, Double maxPrice) {

		Pageable pageable = PageRequest.of(page - 1, size);

		CourseStatus courseStatus = (status == null || status.isBlank())
				? null
				: CourseStatus.valueOf(status.toUpperCase());

		String kw = (keyword == null || keyword.isBlank()) ? null : keyword.trim();

		return courseRepository
				.findByAdminFilter(courseStatus, kw, minPrice, maxPrice, pageable)
				.map(this::toCourseResponse);
	}

	private AdminCourseResponse toCourseResponse(Course course) {
		User teacher = course.getTeacher();
		String teacherName = (teacher.getProfile() != null && teacher.getProfile().getFullName() != null)
				? teacher.getProfile().getFullName() : teacher.getEmail();

		long totalStudents = courseRepository.countStudentsByCourseId(course.getId());

		return AdminCourseResponse.builder()
				.id(course.getId())
				.title(course.getTitle())
				.slug(course.getSlug())
				.thumbnailUrl(course.getThumbnailUrl())
				.price(course.getPrice() != null ? course.getPrice().doubleValue() : 0.0)
				.status(course.getStatus().name())
				.teacherId(teacher.getId())
				.teacherName(teacherName)
				.totalStudents(totalStudents)
				.createdAt(course.getCreatedAt())
				.submissionType(course.getSubmissionType() != null ? course.getSubmissionType().name() : null)
				.build();
	}

	@Override
	public AdminCourseDetailResponse getCourseDetail(String courseId) {
		Course course = courseRepository.findById(courseId)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		User teacher = course.getTeacher();
		String teacherName = (teacher.getProfile() != null && teacher.getProfile().getFullName() != null)
				? teacher.getProfile().getFullName() : teacher.getEmail();
		String teacherAvatar = teacher.getProfile() != null ? teacher.getProfile().getAvatarUrl() : null;

		AdminCourseDetailResponse.TeacherInfo teacherInfo = AdminCourseDetailResponse.TeacherInfo.builder()
				.id(teacher.getId())
				.name(teacherName)
				.email(teacher.getEmail())
				.avatar(teacherAvatar)
				.build();

		List<AdminCourseDetailResponse.SectionInfo> sectionInfos = course.getSections() == null
				? List.of()
				: course.getSections().stream().map(section -> {
			List<AdminCourseDetailResponse.LessonInfo> lessonInfos = section.getLessons() == null
					? List.of()
					: section.getLessons().stream().map(lesson ->
					AdminCourseDetailResponse.LessonInfo.builder()
					.id(lesson.getId())
					.title(lesson.getTitle())
					.type(lesson.getType().name())
					.duration(lesson.getDuration())
					.orderIndex(lesson.getOrderIndex())
					.build()
			).collect(Collectors.toList());

			return AdminCourseDetailResponse.SectionInfo.builder()
				   .id(section.getId())
				   .title(section.getTitle())
				   .orderIndex(section.getOrderIndex())
				   .lessons(lessonInfos)
				   .build();
		}).collect(Collectors.toList());

		return AdminCourseDetailResponse.builder()
				.id(course.getId())
				.title(course.getTitle())
				.slug(course.getSlug())
				.thumbnailUrl(course.getThumbnailUrl())
				.description(course.getDescription())
				.price(course.getPrice())
				.status(course.getStatus().name())
				.rejectedReason(course.getRejectedReason())
				.createdAt(course.getCreatedAt())
				.teacher(teacherInfo)
				.sections(sectionInfos)
				.submissionType(course.getSubmissionType() != null ? course.getSubmissionType().name() : null)
				.oldTitle(course.getOldTitle())
				.oldPrice(course.getOldPrice())
				.oldDescription(course.getOldDescription())
				.build();
	}

	@Override
	@Transactional
	public void updateCourseStatus(String courseId, AdminCourseStatusRequest request) {
		Course course = courseRepository.findById(courseId)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		CourseStatus newStatus;
		try {
			newStatus = CourseStatus.valueOf(request.getStatus().toUpperCase());
		} catch (IllegalArgumentException e) {
			throw new AppException(ErrorCode.INVALID_STATUS);
		}

		course.setStatus(newStatus);

		if (newStatus == CourseStatus.REJECTED) {
			course.setRejectedReason(request.getReason());
		} else {
			course.setRejectedReason(null);
		}

		if (newStatus == CourseStatus.PUBLISHED) {
			course.setPublishedOnce(true);
			course.setSubmissionType(null);
			course.setOldTitle(null);
			course.setOldPrice(null);
			course.setOldDescription(null);
		}

		courseRepository.save(course);

		switch (newStatus) {
			case DRAFT -> { }
			case PUBLISHED -> {
				notificationService.notifyUser(
						course.getTeacher(),
						"Course đã được duyệt ✓",
						"Course \"" + course.getTitle() + "\" đã được duyệt và published thành công."
				);
				notificationService.notifyAllAdmins(
						"Course đã được duyệt",
						"Course \"" + course.getTitle() + "\" của teacher \"" + getTeacherName(course)
								+ "\" đã được published."
				);
			}
			case REJECTED -> {
				String reason = (request.getReason() != null && !request.getReason().isBlank())
						? request.getReason() : "Không có lý do cụ thể";
				notificationService.notifyUser(
						course.getTeacher(),
						"Course bị từ chối",
						"Course \"" + course.getTitle() + "\" bị từ chối. Lý do: " + reason
				);
				notificationService.notifyAllAdmins(
						"Course đã bị từ chối",
						"Course \"" + course.getTitle() + "\" của teacher \"" + getTeacherName(course)
								+ "\" đã bị từ chối."
				);
			}
			case UNLISTED -> {
				notificationService.notifyUser(
						course.getTeacher(),
						"Course đã bị ẩn",
						"Course \"" + course.getTitle() + "\" đã bị ẩn khỏi catalog bởi Admin. "
								+ "Bạn có thể publish lại bất cứ lúc nào."
				);
				notificationService.notifyAllAdmins(
						"Course đã bị ẩn",
						"Admin đã ẩn course \"" + course.getTitle() + "\" của teacher \""
								+ getTeacherName(course) + "\"."
				);
			}
			case SUSPENDED -> {
				String reason = (request.getReason() != null && !request.getReason().isBlank())
						? request.getReason() : "Vi phạm chính sách nền tảng";
				notificationService.notifyUser(
						course.getTeacher(),
						"Course bị khóa",
						"Course \"" + course.getTitle() + "\" đã bị khóa bởi Admin. Lý do: " + reason
								+ ". Vui lòng liên hệ hỗ trợ để biết thêm chi tiết."
				);
				notificationService.notifyAllAdmins(
						"Course đã bị khóa",
						"Admin đã khóa course \"" + course.getTitle() + "\" của teacher \""
								+ getTeacherName(course) + "\". Lý do: " + reason
				);
			}
			default -> { }
		}
	}

	/**
	 * Admin xóa course — khác Teacher delete vì:
	 *   1. Tạo RefundRequest cho từng student đã thanh toán TRƯỚC khi xóa
	 *   2. Xóa trực tiếp qua repository (bypass COURSE_HAS_STUDENTS guard của CourseService)
	 *   3. Notify teacher về việc course bị xóa
	 *
	 * RefundRequest chạy trong transaction riêng để tránh giữ managed OrderDetail
	 * tham chiếu tới course sắp bị xóa trong session hiện tại.
	 */
	@Override
	@Transactional
	public void deleteAdminCourse(String courseId, String adminEmail) {
		Course course = courseRepository.findById(courseId)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		User teacher = course.getTeacher();
		long enrollmentCount = enrollmentRepository.countByCourseId(courseId);

		// ── Bước 1: Tạo RefundRequest trước khi xóa ──────────────────────────
		int refundCount = 0;
		if (enrollmentCount > 0) {
			refundCount = refundService.createRefundsForCourse(courseId);
		}

		// ── Bước 2: Cancel PENDING withdrawals → HOLD ────────────────────────
		// FIX Bug A: phải cancel PENDING trước khi tính currentBalance.
		// Nếu không, PENDING vẫn nằm trong "frozen" nhưng chưa trừ khỏi balance
		// → currentBalance bị tính thừa → tạo thêm 1 HOLD trùng với PENDING đó.
		LocalDateTime now = LocalDateTime.now();
		String cancelNote = "Lệnh rút tiền bị tạm giữ — course \""
				+ course.getTitle() + "\" bị Admin xóa.";

		List<Withdrawal> pendingWithdrawals = withdrawalRepository
				.findByTeacherIdAndStatus(teacher.getId(), Withdrawal.WithdrawalStatus.PENDING);
		pendingWithdrawals.forEach(w -> {
			w.setStatus(Withdrawal.WithdrawalStatus.HOLD);
			w.setNote(cancelNote);
			w.setProcessedAt(now);
			w.setProcessedBy(adminEmail);
		});
		withdrawalRepository.saveAll(pendingWithdrawals);

		// ── Bước 2b: Thu hồi teacherEarnings → HOLD withdrawal ───────────────
		double holdAmount = 0;
		double platformLoss = 0;

		if (refundCount > 0) {
			// Tổng earnings teacher nhận từ course này
			double totalEarnings  = orderDetailRepository.sumEarningsByCourseId(courseId);
			// Tổng refund cần trả student = priceAtPurchase (earnings + platformFee)
			double totalRefund    = orderDetailRepository.sumRevenueByCourseId(courseId);
			// Balance hiện tại của teacher — sau khi PENDING đã bị HOLD ở bước trên,
			// sumFrozenByTeacherId bao gồm cả chúng → currentBalance phản ánh đúng tiền thực có.
			double totalEarned    = orderDetailRepository.sumTotalEarningsByTeacherId(teacher.getId());
			double totalApproved  = withdrawalRepository.sumApprovedByTeacherId(teacher.getId());
			double totalFrozen    = withdrawalRepository.sumFrozenByTeacherId(teacher.getId());
			double currentBalance = Math.max(totalEarned - totalApproved - totalFrozen, 0);

			if (currentBalance > 0) {
				// Thu hồi phần nhỏ hơn: balance còn lại hoặc earnings của course này
				holdAmount   = Math.min(currentBalance, totalEarnings);
				platformLoss = Math.max(totalRefund - holdAmount, 0);

				String bankSnapshot = (teacher.getProfile() != null)
						? teacher.getProfile().getBankAccountInfo() : null;

				String holdNote = String.format(
						"Thu hồi earnings — course \"%s\" bị xóa do vi phạm. " +
								"Tổng refund student: %.0f\u20ab. Thu hồi từ teacher: %.0f\u20ab. Platform bù: %.0f\u20ab.",
						course.getTitle(), totalRefund, holdAmount, platformLoss
				);

				withdrawalRepository.save(Withdrawal.builder()
						.teacher(teacher)
						.amount(BigDecimal.valueOf(holdAmount))
						.status(Withdrawal.WithdrawalStatus.HOLD)
						.note(holdNote)
						.bankSnapshot(bankSnapshot)
						.build());
			} else {
				// Teacher đã rút hết — platform chịu toàn bộ
				platformLoss = totalRefund;
			}
		}

		// ── Bước 3: Notify TRƯỚC khi xóa ─────────────────────────────────────
		String refundMsg = refundCount > 0
				? String.format(" %d học viên sẽ được hoàn tiền.", refundCount) : "";
		String holdMsg = holdAmount > 0
				? String.format(" %.0f\u20ab earnings đã bị thu hồi.", holdAmount) : "";

		notificationService.notifyUser(
				teacher,
				"Khóa học bị xóa bởi Admin",
				"Khóa học \"" + course.getTitle() + "\" đã bị xóa bởi Admin." + refundMsg + holdMsg
		);

		notificationService.notifyAllAdmins(
				"Course đã bị xóa",
				String.format(
						"Admin %s đã xóa course \"%s\" của teacher \"%s\".%s%s%s",
						adminEmail,
						course.getTitle(),
						getTeacherName(course),
						refundCount > 0  ? String.format(" \u26a0\ufe0f Đã tạo %d RefundRequest.", refundCount) : "",
						holdAmount > 0   ? String.format(" \uD83D\uDD12 Thu hồi %.0f\u20ab từ teacher.", holdAmount) : "",
						platformLoss > 0 ? String.format(" \uD83D\uDCB8 Platform bù %.0f\u20ab.", platformLoss) : ""
				)
		);

		// ── Bước 4: Dọn FK — đúng thứ tự từ lá đến gốc ──────────────────────
		orderDetailRepository.nullifyCourseReference(courseId);
		refundRequestRepository.nullifyCourseReference(courseId);

		lessonProgressRepository.deleteByCourseId(courseId);
		submissionRepository.deleteByCourseId(courseId);

		certificateRepository.deleteByCourseId(courseId);
		reviewRepository.deleteByCourseId(courseId);
		cartItemRepository.deleteByCourseId(courseId);

		enrollmentRepository.deleteAllByCourseId(courseId);

		exerciseRepository.deleteByCourseId(courseId);
		lessonRepository.deleteByCourseId(courseId);
		sectionRepository.deleteAllByCourseId(courseId);

		// ── Bước 5: Xóa course ───────────────────────────────────────────────
		courseRepository.delete(course);
	}

	// =============================================
	// FINANCE
	// =============================================

	@Override
	public AdminFinanceStatsResponse getFinanceStats() {
		LocalDateTime now              = LocalDateTime.now();
		LocalDateTime startOfThisMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
		LocalDateTime startOfLastMonth = startOfThisMonth.minusMonths(1);

		double monthlyRevenue    = orderDetailRepository.sumTotalRevenueByPeriod(startOfThisMonth, now);
		double lastMonthRevenue  = orderDetailRepository.sumTotalRevenueByPeriod(startOfLastMonth, startOfThisMonth);
		double totalPayouts      = orderDetailRepository.sumTotalPayoutsByPeriod(startOfThisMonth, now);
		double platformNet       = monthlyRevenue - totalPayouts;
		long   totalTransactions = orderDetailRepository.countTransactionsByPeriod(startOfThisMonth, now);

		double revenueGrowth = lastMonthRevenue == 0 ? 100.0
				: ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

		return AdminFinanceStatsResponse.builder()
				.monthlyRevenue(monthlyRevenue)
				.totalPayouts(totalPayouts)
				.platformNet(platformNet)
				.totalTransactions(totalTransactions)
				.revenueGrowth(Math.round(revenueGrowth * 10.0) / 10.0)
				.build();
	}

	@Override
	public List<AdminMonthlyBreakdownResponse> getMonthlyBreakdown(int months) {
		LocalDateTime from = LocalDateTime.now()
				.minusMonths(months)
				.withDayOfMonth(1)
				.withHour(0).withMinute(0).withSecond(0).withNano(0);

		List<Object[]> rows = orderDetailRepository.findMonthlyBreakdown(from);

		return rows.stream().map(row -> {
			String month      = (String) row[0];
			double revenue    = ((Number) row[1]).doubleValue();
			double payouts    = ((Number) row[2]).doubleValue();
			double net        = revenue - payouts;
			long transactions = ((Number) row[3]).longValue();

			return AdminMonthlyBreakdownResponse.builder()
					.month(month)
					.revenue(revenue)
					.payouts(payouts)
					.net(net)
					.transactions(transactions)
					.build();
		}).collect(Collectors.toList());
	}

	@Override
	public List<AdminTeacherPayoutResponse> getTeacherPayouts(String month) {
		YearMonth ym       = YearMonth.parse(month);
		LocalDateTime from = ym.atDay(1).atStartOfDay();
		LocalDateTime to   = ym.atEndOfMonth().atTime(23, 59, 59);

		List<Object[]> rows = orderDetailRepository.findTeacherPayoutsByPeriod(from, to);

		return rows.stream().map(row -> {
			String teacherId   = (String) row[0];
			String teacherName = row[1] != null ? (String) row[1] : "Unknown";
			long totalCourses  = ((Number) row[2]).longValue();
			long totalStudents = ((Number) row[3]).longValue();
			double earned      = ((Number) row[4]).doubleValue();
			double payout      = ((Number) row[5]).doubleValue();
			String status      = payout > 0 ? "PAID" : "PENDING";

			return AdminTeacherPayoutResponse.builder()
					.teacherId(teacherId)
					.teacherName(teacherName)
					.totalCourses(totalCourses)
					.totalStudents(totalStudents)
					.earned(earned)
					.payout(payout)
					.status(status)
					.build();
		}).collect(Collectors.toList());
	}

	// =============================================
	// LESSONS
	// =============================================

	@Override
	public LessonResponse getLessonDetail(Integer lessonId) {
		Lesson lesson = lessonRepository.findById(lessonId)
				.orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

		// Auto-generate AI summary cho admin nếu chưa có cache
		// Admin cần xem summary trước khi duyệt — không chờ student học
		if (lesson.getAiSummaryCache() == null || lesson.getAiSummaryCache().isBlank()) {
			try {
				aiService.summarizeLesson(lessonId);
				// Reload lesson sau khi summary đã được cache vào DB
				lesson = lessonRepository.findById(lessonId)
						.orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));
			} catch (Exception e) {
				// Không fail cả request nếu AI unavailable — trả response bình thường
				log.warn("[Admin] Auto-summarize failed for lessonId={}: {}", lessonId, e.getMessage());
			}
		}

		LessonResponse response = lessonMapper.toLessonResponse(lesson);

		List<ExerciseResponse> exercises = exerciseRepository.findByLessonId(lessonId)
				.stream()
				.map(exerciseMapper::toResponse)
				.collect(Collectors.toList());

		response.setExercises(exercises);
		return response;
	}

	// =============================================
	// HELPER
	// =============================================

	private RoleRequestResponse toRoleRequestResponse(User user) {
		String fullName = (user.getProfile() != null) ? user.getProfile().getFullName() : null;
		String avatar   = (user.getProfile() != null) ? user.getProfile().getAvatarUrl() : null;

		return RoleRequestResponse.builder()
				.userId(user.getId())
				.name(fullName)
				.email(user.getEmail())
				.avatar(avatar)
				.currentRole(user.getRole().name())
				.requestedRole(Role.TEACHER.name())
				.reason(user.getUpgradeReason())
				.cvUrl(user.getCvUrl())
				.portfolioUrl(user.getPortfolioUrl())
				.requestedAt(user.getUpdatedAt())
				.build();
	}

	private String getTeacherName(Course course) {
		return course.getTeacher().getProfile() != null
				? course.getTeacher().getProfile().getFullName()
				: course.getTeacher().getEmail();
	}
	@Override
	@Transactional
	public void blockTeacherAndHandleAssets(String teacherId) {
		// 1. Khóa trạng thái tài khoản người dùng thành BLOCKED
		User teacher = userRepository.findById(teacherId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_TEACHER));
		teacher.setStatus(UserStatus.BLOCKED);
		userRepository.save(teacher);

		// 2. Xử lý các khóa học (Course) của Teacher
		// Sử dụng chính hàm findAllByTeacherId(teacherId) đã có sẵn trong CourseRepository của bạn
		List<Course> courses = courseRepository.findAllByTeacherId(teacherId);
		for (Course course : courses) {
			long enrollCount = enrollmentRepository.countByCourseId(course.getId());
			if (enrollCount == 0) {
				// Chưa có học viên -> Xóa khóa học
				courseRepository.delete(course);
			} else {
				// Đã có học viên -> Chuyển về trạng thái SUSPENDED (để học viên cũ vẫn học được)
				course.setStatus(CourseStatus.SUSPENDED);
				courseRepository.save(course);
			}
		}

		// 3. Hủy toàn bộ lệnh rút tiền đang ở trạng thái PENDING
		List<Withdrawal> pendingWithdrawals = withdrawalRepository.findByTeacherIdAndStatus(teacherId, Withdrawal.WithdrawalStatus.PENDING);
		if (!pendingWithdrawals.isEmpty()) {
			for (Withdrawal withdrawal : pendingWithdrawals) {
				withdrawal.setStatus(Withdrawal.WithdrawalStatus.CANCELLED); // Hoặc trạng thái tương đương HỦY trong Enum của bạn
				withdrawal.setBankSnapshot("Hủy tự động do tài khoản giảng viên bị khóa.");
				withdrawalRepository.save(withdrawal);
			}
		}

		// 4. Tính toán số dư động thực tế để tạo lệnh HOLD
		// Bạn hãy sử dụng chính các hàm query tính toán số dư thực tế đang được dùng trong hàm `getDowngradeImpact` của bạn:
		double totalEarned = orderDetailRepository.sumTotalEarningsByTeacherId(teacherId);
		double totalWithdrawn = withdrawalRepository.sumApprovedByTeacherId(teacherId);

		// Số dư khả dụng thực tế (lúc này các lệnh PENDING đã bị hủy nên tổng withdrawn đã giảm đi, số dư khả dụng tự động tăng lại tương ứng)
		double currentBalance = totalEarned - totalWithdrawn;

		// Nếu số dư > 0 thì tạo lệnh HOLD đóng băng toàn bộ số tiền này
		if (currentBalance > 0) {
			// 🌟 Snapshot bank info thực tế của teacher tại thời điểm block
			// null nếu teacher chưa có bank info → FE hiển thị "Chưa có bank info" + nút Nhắc nhở đúng flow
			String bankSnapshot = (teacher.getProfile() != null)
					? teacher.getProfile().getBankAccountInfo()
					: null;

			Withdrawal holdWithdrawal = Withdrawal.builder()
					.teacher(teacher)
					.amount(BigDecimal.valueOf(currentBalance))
					.status(Withdrawal.WithdrawalStatus.HOLD)
					.bankSnapshot(bankSnapshot)
					.note("HOLD toàn bộ số dư do tài khoản bị khóa vi phạm.")
					.build();
			withdrawalRepository.save(holdWithdrawal);
		}
		// Nếu currentBalance == 0, hệ thống tự động bỏ qua không làm gì thêm đối với tài chính theo đúng yêu cầu.
	}
}