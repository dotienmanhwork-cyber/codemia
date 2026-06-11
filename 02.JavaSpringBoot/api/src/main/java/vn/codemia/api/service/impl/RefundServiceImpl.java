package vn.codemia.api.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.dto.response.RefundResponse;
import vn.codemia.api.entity.*;
import vn.codemia.api.enums.CourseStatus;
import vn.codemia.api.enums.RefundReason;
import vn.codemia.api.enums.RefundStatus;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.repository.*;
import vn.codemia.api.service.NotificationService;
import vn.codemia.api.service.RefundService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

	private final RefundRequestRepository refundRequestRepository;
	private final EnrollmentRepository    enrollmentRepository;
	private final OrderDetailRepository   orderDetailRepository;
	private final CourseRepository        courseRepository;
	private final UserRepository          userRepository;
	private final NotificationService     notificationService;
	private final ObjectMapper            objectMapper;

	// =====================================================================
	// Internal — gọi từ AdminServiceImpl
	// =====================================================================

	/**
	 * Tạo RefundRequest cho toàn bộ student enrolled trong course.
	 * Chỉ tạo khi:
	 *   - Student đã thanh toán (priceAtPurchase > 0)
	 *   - Chưa có RefundRequest nào cho cặp (student, course) này
	 */
	@Override
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public int createRefundsForCourse(String courseId) {
		Course course = courseRepository.findById(courseId)
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
		int count = 0;

		for (Enrollment enrollment : enrollments) {
			User student = enrollment.getStudent();

			// Tìm số tiền đã thanh toán qua OrderDetail trước
			// (cần orderId để check duplicate chính xác khi course_id = NULL)
			Optional<OrderDetail> odOpt = orderDetailRepository
					.findSuccessByCourseIdAndStudentId(courseId, student.getId());

			if (odOpt.isEmpty()) {
				// Có thể course miễn phí — không tạo refund $0
				continue;
			}

			// Tránh tạo duplicate — check theo orderId vì course_id sẽ = NULL sau khi xóa
			if (refundRequestRepository.existsByStudentIdAndOrderId(
					student.getId(), odOpt.get().getOrder().getId())) {
				continue;
			}

			BigDecimal amount = odOpt.get().getPriceAtPurchase();
			if (amount.compareTo(BigDecimal.ZERO) == 0) {
				continue; // Khóa học miễn phí
			}

			RefundRequest refund = buildRefundRequest(
					student, course, odOpt.get().getOrder(), amount, RefundReason.DELETE_COURSE
			);

			refundRequestRepository.save(refund);
			notifyStudentOnCreate(student, course.getTitle(), amount, refund.getStatus(),
					refund.getBankAccountNumber());
			count++;
		}

		return count;
	}

	/**
	 * Tạo RefundRequest cho student của tất cả course PUBLISHED/UNLISTED/SUSPENDED
	 * của teacher bị hạ role.
	 */
	@Override
	@Transactional
	public int createRefundsForTeacherCourses(String teacherId) {
		List<CourseStatus> activeStatuses = List.of(
				CourseStatus.PUBLISHED, CourseStatus.UNLISTED, CourseStatus.SUSPENDED
		);

		List<Course> courses = courseRepository.findByTeacherIdAndStatusIn(teacherId, activeStatuses);
		int total = 0;

		for (Course course : courses) {
			List<Enrollment> enrollments = enrollmentRepository.findByCourseId(course.getId());

			for (Enrollment enrollment : enrollments) {
				User student = enrollment.getStudent();

				// Tránh duplicate
				if (refundRequestRepository.existsByStudentIdAndCourseId(
						student.getId(), course.getId())) {
					continue;
				}

				Optional<OrderDetail> odOpt = orderDetailRepository
						.findSuccessByCourseIdAndStudentId(course.getId(), student.getId());

				if (odOpt.isEmpty()) continue;

				BigDecimal amount = odOpt.get().getPriceAtPurchase();
				if (amount.compareTo(BigDecimal.ZERO) == 0) continue;

				RefundRequest refund = buildRefundRequest(
						student, course, odOpt.get().getOrder(), amount, RefundReason.DOWNGRADE_TEACHER
				);

				refundRequestRepository.save(refund);
				notifyStudentOnCreate(student, course.getTitle(), amount, refund.getStatus(),
						refund.getBankAccountNumber());
				total++;
			}
		}

		return total;
	}

	/**
	 * Khi student cập nhật bank info trong Profile → tự động chuyển
	 * các WAITING_BANK_INFO → PENDING và ghi lại bank snapshot mới.
	 *
	 * Hook vào: UserProfileServiceImpl.updateProfile() / updateBankInfo()
	 */
	@Override
	@Transactional
	public void onStudentBankInfoUpdated(String studentId) {
		List<RefundRequest> waiting = refundRequestRepository
				.findByStudentIdAndStatus(studentId, RefundStatus.WAITING_BANK_INFO);

		if (waiting.isEmpty()) return;

		User student = userRepository.findById(studentId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		String bankJson = student.getProfile() != null
				? student.getProfile().getBankAccountInfo() : null;

		if (bankJson == null) return; // Vẫn chưa có — không làm gì

		BankSnapshot snap = parseBankSnapshot(bankJson);
		if (snap.bankAccountNumber == null || snap.bankAccountNumber.isBlank()
				|| snap.bankName == null || snap.bankName.isBlank()) {
			return;
		}

		for (RefundRequest refund : waiting) {
			refund.setStatus(RefundStatus.PENDING);
			refund.setBankName(snap.bankName);
			refund.setBankAccountNumber(snap.bankAccountNumber);
			refund.setBankAccountName(snap.bankAccountName);
			refundRequestRepository.save(refund);

			String masked = maskAccountNumber(snap.bankAccountNumber);
			notificationService.notifyUser(
					student,
					"Yêu cầu hoàn tiền đã sẵn sàng xử lý",
					String.format(
							"Thông tin ngân hàng của bạn đã được ghi nhận. " +
									"Khoản hoàn tiền %.0f₫ cho khóa học \"%s\" " +
									"sẽ được chuyển vào STK %s trong thời gian sớm nhất.",
							refund.getAmount().doubleValue(),
							refund.getCourseTitle(),
							masked
					)
			);
		}
	}

	// =====================================================================
	// Admin API
	// =====================================================================

	@Override
	public Page<RefundResponse> getAllRefunds(String status, int page, int size) {
		RefundStatus statusEnum = null;
		if (status != null && !status.isBlank()) {
			try {
				statusEnum = RefundStatus.valueOf(status.toUpperCase());
			} catch (IllegalArgumentException e) {
				throw new AppException(ErrorCode.INVALID_STATUS);
			}
		}
		return refundRequestRepository
				.findAllWithFilter(statusEnum, PageRequest.of(page - 1, size))
				.map(this::toResponse);
	}

	@Override
	@Transactional
	public void markCompleted(String refundId, String adminNote, String adminEmail) {
		RefundRequest refund = getRefundOrThrow(refundId);

		if (refund.getStatus() != RefundStatus.PENDING) {
			throw new AppException(ErrorCode.REFUND_INVALID_STATUS_TRANSITION);
		}

		refund.setStatus(RefundStatus.COMPLETED);
		refund.setAdminNote(adminNote);
		refund.setResolvedBy(adminEmail);
		refund.setResolvedAt(LocalDateTime.now());
		refundRequestRepository.save(refund);

		String masked = maskAccountNumber(refund.getBankAccountNumber());
		notificationService.notifyUser(
				refund.getStudent(),
				"Hoàn tiền thành công ✓",
				String.format(
						"Khoản hoàn tiền %.0f₫ cho khóa học \"%s\" " +
								"đã được chuyển vào STK %s.",
						refund.getAmount().doubleValue(),
						refund.getCourseTitle(),
						masked
				)
		);
	}

	@Override
	@Transactional
	public void cancelRefund(String refundId, String adminEmail) {
		RefundRequest refund = getRefundOrThrow(refundId);

		if (refund.getStatus() == RefundStatus.COMPLETED
				|| refund.getStatus() == RefundStatus.CANCELLED) {
			throw new AppException(ErrorCode.REFUND_INVALID_STATUS_TRANSITION);
		}

		refund.setStatus(RefundStatus.CANCELLED);
		refund.setResolvedBy(adminEmail);
		refund.setResolvedAt(LocalDateTime.now());
		refundRequestRepository.save(refund);

		notificationService.notifyUser(
				refund.getStudent(),
				"Yêu cầu hoàn tiền bị huỷ",
				String.format(
						"Yêu cầu hoàn tiền %.0f₫ cho khóa học \"%s\" đã bị huỷ. " +
								"Vui lòng liên hệ Admin nếu bạn có thắc mắc.",
						refund.getAmount().doubleValue(),
						refund.getCourseTitle()
				)
		);
	}

	@Override
	public void remindStudent(String refundId) {
		RefundRequest refund = getRefundOrThrow(refundId);

		if (refund.getStatus() != RefundStatus.WAITING_BANK_INFO) {
			throw new AppException(ErrorCode.REFUND_INVALID_STATUS_TRANSITION);
		}

		notificationService.notifyUser(
				refund.getStudent(),
				"Chưa nhập thông tin ngân hàng",
				String.format(
						"Chưa nhập thông tin ngân hàng, vui lòng nhập để được hoàn tiền cho khóa học \"%s\"",
						refund.getCourseTitle()
				)
		);
	}

	// =====================================================================
	// Helpers
	// =====================================================================

	/** Xây dựng RefundRequest với bank snapshot từ UserProfile của student. */
	private RefundRequest buildRefundRequest(
			User student, Course course, Order order,
			BigDecimal amount, RefundReason reason) {

		String bankJson = student.getProfile() != null
				? student.getProfile().getBankAccountInfo() : null;

		BankSnapshot snap = bankJson != null ? parseBankSnapshot(bankJson) : new BankSnapshot();
		boolean hasBankInfo = snap.bankAccountNumber != null && !snap.bankAccountNumber.isBlank()
				&& snap.bankName != null && !snap.bankName.isBlank();

		// DELETE_COURSE: course will be removed in the same transaction, so keep
		// only the title snapshot and avoid referencing a removed entity.
		Course courseRef = (reason == RefundReason.DELETE_COURSE) ? null : course;

		return RefundRequest.builder()
				.student(student)
				.course(courseRef)
				.courseTitle(course.getTitle())
				.order(order)
				.amount(amount)
				.reason(reason)
				.status(hasBankInfo ? RefundStatus.PENDING : RefundStatus.WAITING_BANK_INFO)
				.bankName(snap.bankName)
				.bankAccountNumber(snap.bankAccountNumber)
				.bankAccountName(snap.bankAccountName)
				.build();
	}

	/** Gửi notification phù hợp khi tạo RefundRequest. */
	private void notifyStudentOnCreate(
			User student, String courseTitle,
			BigDecimal amount, RefundStatus status, String rawAccountNumber) {

		String amountStr = String.format("%.0f", amount.doubleValue());

		if (status == RefundStatus.PENDING) {
			String masked = maskAccountNumber(rawAccountNumber);
			notificationService.notifyUser(
					student,
					"Yêu cầu hoàn tiền đã được tạo",
					String.format(
							"Yêu cầu hoàn tiền %s₫ cho khóa học \"%s\" đã được tạo. " +
									"Admin sẽ chuyển khoản vào STK %s trong thời gian sớm nhất.",
							amountStr, courseTitle, masked
					)
			);
		} else {
			// WAITING_BANK_INFO
			notificationService.notifyUser(
					student,
					"Chưa nhập thông tin ngân hàng",
					String.format(
							"Chưa nhập thông tin ngân hàng, vui lòng nhập để được hoàn tiền cho khóa học \"%s\"",
							courseTitle
					)
			);
		}
	}

	/** Parse JSON string của UserProfile.bankAccountInfo thành struct tiện dùng. */
	private BankSnapshot parseBankSnapshot(String bankJson) {
		BankSnapshot snap = new BankSnapshot();
		if (bankJson == null || bankJson.isBlank()) return snap;
		try {
			JsonNode node = objectMapper.readTree(bankJson);
			snap.bankName          = node.path("bankName").asText(null);
			// Hỗ trợ cả "accountNumber" lẫn "bankAccountNumber" do FE có thể dùng khác key
			snap.bankAccountNumber = node.has("accountNumber")
					? node.path("accountNumber").asText(null)
					: node.path("bankAccountNumber").asText(null);
			snap.bankAccountName   = node.has("accountName")
					? node.path("accountName").asText(null)
					: node.path("bankAccountName").asText(null);
		} catch (Exception e) {
			log.warn("Cannot parse bankAccountInfo JSON: {}", bankJson);
		}
		return snap;
	}

	/** Mask số tài khoản: chỉ hiện 4 số cuối — "****1234". */
	private String maskAccountNumber(String accountNumber) {
		if (accountNumber == null || accountNumber.length() <= 4) return "****";
		return "****" + accountNumber.substring(accountNumber.length() - 4);
	}

	private RefundRequest getRefundOrThrow(String refundId) {
		return refundRequestRepository.findById(refundId)
				.orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));
	}

	private RefundResponse toResponse(RefundRequest r) {
		User student = r.getStudent();
		String studentName = (student.getProfile() != null && student.getProfile().getFullName() != null)
				? student.getProfile().getFullName() : student.getEmail();

		return RefundResponse.builder()
				.id(r.getId())
				.studentId(student.getId())
				.studentName(studentName)
				.studentEmail(student.getEmail())
				.courseId(r.getCourse() != null ? r.getCourse().getId() : null)
				.courseTitle(r.getCourseTitle())
				.orderId(r.getOrder() != null ? r.getOrder().getId() : null)
				.amount(r.getAmount())
				.reason(r.getReason().name())
				.status(r.getStatus().name())
				.bankName(r.getBankName())
				.bankAccountNumber(r.getBankAccountNumber())
				.bankAccountName(r.getBankAccountName())
				.adminNote(r.getAdminNote())
				.resolvedBy(r.getResolvedBy())
				.createdAt(r.getCreatedAt())
				.resolvedAt(r.getResolvedAt())
				.build();
	}

	/** Inner record giữ parsed bank info — không cần expose ra ngoài. */
	private static class BankSnapshot {
		String bankName;
		String bankAccountNumber;
		String bankAccountName;
	}
}