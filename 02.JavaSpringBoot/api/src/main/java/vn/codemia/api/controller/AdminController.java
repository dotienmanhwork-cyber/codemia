package vn.codemia.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.AdminCourseStatusRequest;
import vn.codemia.api.dto.response.*;
import vn.codemia.api.entity.RoleChangeLog;
import vn.codemia.api.enums.Role;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.enums.UserStatus;
import vn.codemia.api.mapper.UserMapper;
import vn.codemia.api.repository.RoleChangeLogRepository;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.service.AdminService;
import vn.codemia.api.service.NotificationService;
import vn.codemia.api.service.RefundService;
import vn.codemia.api.service.UserService;
import vn.codemia.api.service.WithdrawalService;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

	private final UserService             userService;
	private final AdminService            adminService;
	private final UserRepository          userRepository;
	private final RoleChangeLogRepository roleChangeLogRepository;
	private final UserMapper              userMapper;
	private final NotificationService     notificationService;
	private final WithdrawalService       withdrawalService;
	private final RefundService           refundService;    // ← Phase 2

	// =============================================
	// DASHBOARD
	// =============================================

	@GetMapping("/dashboard/stats")
	public ResponseEntity<ApiResponse<AdminDashboardStatsResponse>> getDashboardStats() {
		return ResponseEntity.ok(ApiResponse.<AdminDashboardStatsResponse>builder()
				.code(1000).result(adminService.getDashboardStats()).build());
	}

	@GetMapping("/dashboard/role-requests")
	public ResponseEntity<ApiResponse<List<RoleRequestResponse>>> getRoleRequests(
			@RequestParam(defaultValue = "5") int limit
	) {
		return ResponseEntity.ok(ApiResponse.<List<RoleRequestResponse>>builder()
				.code(1000).result(adminService.getRoleRequests(limit)).build());
	}

	// =============================================
	// USERS
	// =============================================

	@GetMapping("/users")
	public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(
			@RequestParam(defaultValue = "1")  int    page,
			@RequestParam(defaultValue = "10") int    size,
			@RequestParam(defaultValue = "")   String keyword,
			@RequestParam(defaultValue = "")   String role
	) {
		return ResponseEntity.ok(ApiResponse.<Page<UserResponse>>builder()
				.code(1000).result(userService.getAllUsers(page, size, keyword, role)).build());
	}

	@GetMapping("/users/{userId}")
	public ResponseEntity<ApiResponse<AdminUserDetailResponse>> getUserDetail(
			@PathVariable String userId
	) {
		var user = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		UserResponse userResponse = userMapper.toUserResponse(user);

		List<RoleChangeLogResponse> logs = roleChangeLogRepository
				.findByUserIdOrderByChangedAtDesc(userId)
				.stream()
				.map(log -> RoleChangeLogResponse.builder()
						.id(log.getId())
						.changedByEmail(log.getChangedByEmail())
						.fromRole(log.getFromRole() != null ? log.getFromRole().name() : null)
						.toRole(log.getToRole()   != null ? log.getToRole().name()   : null)
						.note(log.getNote())
						.changedAt(log.getChangedAt())
						.build())
				.collect(Collectors.toList());

		AdminUserDetailResponse detail = AdminUserDetailResponse.builder()
				.user(userResponse)
				.roleLogs(logs)
				.build();

		return ResponseEntity.ok(ApiResponse.<AdminUserDetailResponse>builder()
				.code(1000).result(detail).build());
	}

	@PatchMapping("/users/{userId}/status")
	public ResponseEntity<ApiResponse<UserResponse>> changeUserStatus(
			@PathVariable String userId,
			@RequestParam  String status
	) {
		return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
				.code(1000).result(userService.changeStatus(userId, status)).build());
	}

	/**
	 * PUT /api/admin/users/:id/role
	 * GUARD: Teacher → Student phải dùng POST /downgrade.
	 */
	@PutMapping("/users/{userId}/role")
	public ResponseEntity<ApiResponse<UserResponse>> changeUserRole(
			@PathVariable String userId,
			@RequestBody  Map<String, String> request
	) {
		String adminEmail = SecurityContextHolder.getContext()
				.getAuthentication().getName();

		var targetUser = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		Role fromRole = targetUser.getRole();
		Role toRole   = Role.valueOf(request.get("role").toUpperCase());

		if (fromRole == Role.TEACHER && toRole == Role.STUDENT) {
			throw new AppException(ErrorCode.USE_DOWNGRADE_ENDPOINT);
		}

		UserResponse updated = userService.changeRole(userId, request.get("role"));

		if (targetUser.getStatus() == UserStatus.PENDING_TEACHER) {
			userService.changeStatus(userId, UserStatus.ACTIVE.name());
		}

		roleChangeLogRepository.save(
				RoleChangeLog.builder()
						.userId(userId)
						.changedByEmail(adminEmail)
						.fromRole(fromRole)
						.toRole(toRole)
						.note(request.get("note"))
						.build()
		);

		String notifTitle   = toRole == Role.TEACHER
				? "Tài khoản được nâng cấp lên Teacher ✓"
				: "Role tài khoản đã thay đổi";
		String notifContent = toRole == Role.TEACHER
				? "Admin đã nâng cấp tài khoản của bạn lên Teacher."
				: "Admin đã thay đổi role tài khoản của bạn về Student.";
		notificationService.notifyUser(targetUser, notifTitle, notifContent);

		return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
				.code(1000).result(updated).build());
	}

	@DeleteMapping("/users/{userId}")
	public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String userId) {
		userService.deleteUser(userId);
		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000).message("User deleted successfully").build());
	}

	@GetMapping("/users/{userId}/downgrade-impact")
	public ResponseEntity<ApiResponse<RoleDowngradeImpactResponse>> getDowngradeImpact(
			@PathVariable String userId
	) {
		return ResponseEntity.ok(ApiResponse.<RoleDowngradeImpactResponse>builder()
				.code(1000)
				.result(adminService.getDowngradeImpact(userId))
				.build());
	}

	@PostMapping("/users/{userId}/downgrade")
	public ResponseEntity<ApiResponse<Void>> downgradeUserRole(
			@PathVariable String userId,
			@RequestBody(required = false) Map<String, String> body
	) {
		String adminEmail = SecurityContextHolder.getContext()
				.getAuthentication().getName();
		String note = (body != null) ? body.get("note") : null;

		adminService.downgradeUserRole(userId, adminEmail, note);

		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000)
				.message("User role downgraded successfully")
				.build());
	}

	// =============================================
	// ROLES
	// =============================================

	@GetMapping("/roles/requests")
	public ResponseEntity<ApiResponse<List<RoleRequestResponse>>> getAllRoleRequests() {
		return ResponseEntity.ok(ApiResponse.<List<RoleRequestResponse>>builder()
				.code(1000).result(adminService.getAllRoleRequests()).build());
	}

	@PatchMapping("/roles/{userId}/approve")
	public ResponseEntity<ApiResponse<Void>> approveRole(@PathVariable String userId) {
		adminService.approveRole(userId);
		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000).message("Role approved successfully").build());
	}

	@PatchMapping("/roles/{userId}/decline")
	public ResponseEntity<ApiResponse<Void>> declineRole(
			@PathVariable String userId,
			@RequestBody(required = false) Map<String, String> body
	) {
		String reason = (body != null) ? body.get("reason") : null;
		adminService.declineRole(userId, reason);
		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000).message("Role request declined").build());
	}

	// =============================================
	// COURSES
	// =============================================

	@GetMapping("/courses")
	public ResponseEntity<ApiResponse<Page<AdminCourseResponse>>> getCourses(
			@RequestParam(defaultValue = "1")  int    page,
			@RequestParam(defaultValue = "10") int    size,
			@RequestParam(defaultValue = "")   String status,
			@RequestParam(defaultValue = "")   String keyword,
			@RequestParam(required = false)    Double minPrice,
			@RequestParam(required = false)    Double maxPrice) {

		return ResponseEntity.ok(ApiResponse.<Page<AdminCourseResponse>>builder()
				.code(1000)
				.result(adminService.getCourses(page, size, status, keyword, minPrice, maxPrice))
				.build());
	}

	@GetMapping("/courses/{courseId}")
	public ResponseEntity<ApiResponse<AdminCourseDetailResponse>> getCourseDetail(
			@PathVariable String courseId
	) {
		return ResponseEntity.ok(ApiResponse.<AdminCourseDetailResponse>builder()
				.code(1000).result(adminService.getCourseDetail(courseId)).build());
	}

	@PatchMapping("/courses/{courseId}/status")
	public ResponseEntity<ApiResponse<Void>> updateCourseStatus(
			@PathVariable String courseId,
			@RequestBody  AdminCourseStatusRequest request
	) {
		adminService.updateCourseStatus(courseId, request);
		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000).message("Course status updated").build());
	}

	/**
	 * DELETE /api/admin/courses/:id
	 * [Phase 2] Gọi adminService.deleteAdminCourse thay vì courseService.delete
	 * để đảm bảo refund flow được thực thi trước khi xóa.
	 */
	@DeleteMapping("/courses/{courseId}")
	public ResponseEntity<ApiResponse<Void>> deleteCourse(
			@PathVariable String courseId
	) {
		String adminEmail = SecurityContextHolder.getContext()
				.getAuthentication().getName();
		adminService.deleteAdminCourse(courseId, adminEmail);
		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000).message("Course deleted successfully").build());
	}

	// =============================================
	// FINANCE
	// =============================================

	@GetMapping("/finance/stats")
	public ResponseEntity<ApiResponse<AdminFinanceStatsResponse>> getFinanceStats() {
		return ResponseEntity.ok(ApiResponse.<AdminFinanceStatsResponse>builder()
				.code(1000).result(adminService.getFinanceStats()).build());
	}

	@GetMapping("/finance/monthly")
	public ResponseEntity<ApiResponse<List<AdminMonthlyBreakdownResponse>>> getMonthlyBreakdown(
			@RequestParam(defaultValue = "6") int months
	) {
		return ResponseEntity.ok(ApiResponse.<List<AdminMonthlyBreakdownResponse>>builder()
				.code(1000).result(adminService.getMonthlyBreakdown(months)).build());
	}

	@GetMapping("/finance/teacher-payouts")
	public ResponseEntity<ApiResponse<List<AdminTeacherPayoutResponse>>> getTeacherPayouts(
			@RequestParam(required = false) String month
	) {
		if (month == null || month.isBlank()) {
			month = YearMonth.now().toString();
		}
		return ResponseEntity.ok(ApiResponse.<List<AdminTeacherPayoutResponse>>builder()
				.code(1000).result(adminService.getTeacherPayouts(month)).build());
	}

	@GetMapping("/finance/withdrawal-requests")
	public ResponseEntity<ApiResponse<Page<WithdrawalResponse>>> getAllWithdrawals(
			@RequestParam(required = false)    String status,
			@RequestParam(defaultValue = "1")  int    page,
			@RequestParam(defaultValue = "20") int    size
	) {
		return ResponseEntity.ok(ApiResponse.<Page<WithdrawalResponse>>builder()
				.code(1000).result(withdrawalService.getAllWithdrawals(status, page, size)).build());
	}

	@PatchMapping("/finance/withdrawal-requests/{id}/approve")
	public ResponseEntity<ApiResponse<Void>> approveWithdrawal(@PathVariable Integer id) {
		withdrawalService.approveWithdrawal(id);
		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000).message("Withdrawal approved successfully").build());
	}

	@PatchMapping("/finance/withdrawal-requests/{id}/reject")
	public ResponseEntity<ApiResponse<Void>> rejectWithdrawal(
			@PathVariable Integer id,
			@RequestBody(required = false) Map<String, String> body
	) {
		String note = (body != null) ? body.get("note") : null;
		withdrawalService.rejectWithdrawal(id, note);
		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000).message("Withdrawal rejected").build());
	}

	/**
	 * POST /api/admin/finance/withdrawal-requests/:id/remind
	 *
	 * Gửi notification nhắc teacher cập nhật bank info.
	 * Chỉ áp dụng cho HOLD withdrawal chưa có bankSnapshot
	 * (tức là do hạ role teacher mà chưa có bank info).
	 */
	@PostMapping("/finance/withdrawal-requests/{id}/remind")
	public ResponseEntity<ApiResponse<Void>> remindTeacherForBankInfo(
			@PathVariable Integer id
	) {
		withdrawalService.remindTeacher(id);
		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000).message("Reminder sent to teacher").build());
	}

	/**
	 * PUT /api/admin/finance/withdrawal-requests/:id/complete
	 *
	 * Admin đánh dấu lệnh HOLD là đã xử lý thủ công xong → APPROVED.
	 * Body (optional): { "note": "Đã chuyển khoản ngày 02/06/2026" }
	 */
	@PutMapping("/finance/withdrawal-requests/{id}/complete")
	public ResponseEntity<ApiResponse<Void>> completeHoldWithdrawal(
			@PathVariable Integer id,
			@RequestBody(required = false) Map<String, String> body
	) {
		String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
		String note = (body != null) ? body.get("note") : null;
		withdrawalService.completeHoldWithdrawal(id, note, adminEmail);
		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000).message("Withdrawal marked as completed").build());
	}

	// =============================================
	// FINANCE — REFUNDS  (Phase 2)
	// =============================================

	/**
	 * GET /api/admin/refunds?status=PENDING&page=1&size=20
	 * status: WAITING_BANK_INFO | PENDING | COMPLETED | CANCELLED | (blank = tất cả)
	 */
	@GetMapping("/finance/refunds")
	public ResponseEntity<ApiResponse<Page<RefundResponse>>> getAllRefunds(
			@RequestParam(required = false)    String status,
			@RequestParam(defaultValue = "1")  int    page,
			@RequestParam(defaultValue = "20") int    size
	) {
		return ResponseEntity.ok(ApiResponse.<Page<RefundResponse>>builder()
				.code(1000)
				.result(refundService.getAllRefunds(status, page, size))
				.build());
	}

	/**
	 * PUT /api/admin/refunds/:id/complete
	 * Admin đã chuyển khoản — mark RefundRequest là COMPLETED.
	 * Body: { "note": "Đã chuyển khoản ngày 28/05/2026" }
	 */
	@PutMapping("/finance/refunds/{refundId}/complete")
	public ResponseEntity<ApiResponse<Void>> markRefundCompleted(
			@PathVariable String refundId,
			@RequestBody(required = false) Map<String, String> body
	) {
		String adminEmail = SecurityContextHolder.getContext()
				.getAuthentication().getName();
		String note = (body != null) ? body.get("note") : null;

		refundService.markCompleted(refundId, note, adminEmail);

		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000).message("Refund marked as completed").build());
	}

	/**
	 * PUT /api/admin/refunds/:id/cancel
	 * Huỷ refund — chỉ được phép khi status là WAITING_BANK_INFO hoặc PENDING.
	 * Body (optional): { "note": "Lý do huỷ" }
	 */
	@PutMapping("/finance/refunds/{refundId}/cancel")
	public ResponseEntity<ApiResponse<Void>> cancelRefund(
			@PathVariable String refundId,
			@RequestBody(required = false) Map<String, String> body
	) {
		String adminEmail = SecurityContextHolder.getContext()
				.getAuthentication().getName();
		refundService.cancelRefund(refundId, adminEmail);

		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000).message("Refund cancelled").build());
	}

	/**
	 * POST /api/admin/refunds/:id/remind
	 * Gửi lại notification nhắc student cập nhật bank info.
	 * Chỉ áp dụng khi status = WAITING_BANK_INFO.
	 */
	@PostMapping("/finance/refunds/{refundId}/remind")
	public ResponseEntity<ApiResponse<Void>> remindStudentForBankInfo(
			@PathVariable String refundId
	) {
		refundService.remindStudent(refundId);
		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000).message("Reminder sent to student").build());
	}

	// =============================================
	// LESSONS
	// =============================================

	@GetMapping("/lessons/{lessonId}")
	public ResponseEntity<ApiResponse<LessonResponse>> getLessonDetail(
			@PathVariable Integer lessonId
	) {
		return ResponseEntity.ok(ApiResponse.<LessonResponse>builder()
				.code(1000).result(adminService.getLessonDetail(lessonId)).build());
	}
	@PutMapping("/teachers/{teacherId}/block")
	public ResponseEntity<ApiResponse<Void>> blockTeacher(@PathVariable String teacherId) {
		// Gọi phương thức xử lý tổng hợp vừa block vừa xử lý khóa học + tài chính
		adminService.blockTeacherAndHandleAssets(teacherId);

		return ResponseEntity.ok(ApiResponse.<Void>builder()
				.code(1000)
				.message("Khóa tài khoản giảng viên và xử lý tài sản thành công.")
				.build());
	}
}