package vn.codemia.api.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.dto.response.TeacherBalanceResponse;
import vn.codemia.api.dto.response.WithdrawalResponse;
import vn.codemia.api.entity.User;
import vn.codemia.api.entity.Withdrawal;
import vn.codemia.api.entity.Withdrawal.WithdrawalStatus;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.repository.OrderDetailRepository;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.repository.WithdrawalRepository;
import vn.codemia.api.service.NotificationService;
import vn.codemia.api.service.WithdrawalService;
import vn.codemia.api.enums.WithdrawalType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WithdrawalServiceImpl implements WithdrawalService {

	private final WithdrawalRepository  withdrawalRepository;
	private final OrderDetailRepository orderDetailRepository;
	private final UserRepository        userRepository;
	private final NotificationService   notificationService;
	private final ObjectMapper          objectMapper;

	// ── Helper ────────────────────────────────────────────────────────────────

	private User getCurrentUser() {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
	}

	/**
	 * availableBalance = totalEarned - totalApproved - totalFrozen
	 * Trừ cả HOLD + PENDING để tránh teacher rút trùng số tiền đang bị giữ.
	 */
	private double calcAvailableBalance(String teacherId) {
		double totalEarned   = orderDetailRepository.sumTotalEarningsByTeacherId(teacherId);
		double totalApproved = withdrawalRepository.sumApprovedByTeacherId(teacherId);
		double totalFrozen   = withdrawalRepository.sumFrozenByTeacherId(teacherId);
		return Math.max(totalEarned - totalApproved - totalFrozen, 0);
	}

	private WithdrawalResponse toResponse(Withdrawal w) {
		User teacher = w.getTeacher();
		String teacherName = (teacher.getProfile() != null && teacher.getProfile().getFullName() != null)
				? teacher.getProfile().getFullName() : teacher.getEmail();
		String bankInfo = teacher.getProfile() != null
				&& teacher.getProfile().getBankAccountInfo() != null
				? teacher.getProfile().getBankAccountInfo()
				: null;

		return WithdrawalResponse.builder()
				.id(w.getId())
				.amount(w.getAmount())
				.status(w.getStatus().name())
				.note(w.getNote())
				.createdAt(w.getCreatedAt())
				.processedAt(w.getProcessedAt())
				.processedBy(w.getProcessedBy())
				.teacherId(teacher.getId())
				.teacherName(teacherName)
				.teacherEmail(teacher.getEmail())
				.bankAccountInfo(bankInfo)
				.bankSnapshot(w.getBankSnapshot())
				.withdrawalType(resolveType(w).name())
				.build();
	}

	/**
	 * Xác định loại nguồn gốc của withdrawal dựa trên note pattern.
	 * Logic match phải khớp chính xác với các note được ghi trong:
	 *   - AdminServiceImpl.downgradeUserRole()  → DOWNGRADE_AUTO
	 *   - AdminServiceImpl.deleteAdminCourse()   → COURSE_DELETED_HOLD / COURSE_DELETED_CLAWBACK
	 *   - AdminServiceImpl.blockTeacher()        → ACCOUNT_BLOCKED
	 *   - WithdrawalServiceImpl.requestWithdrawal() → TEACHER_MANUAL (note = null)
	 */
	private WithdrawalType resolveType(Withdrawal w) {
		String note = w.getNote();
		if (note == null || note.isBlank()) {
			return WithdrawalType.TEACHER_MANUAL;
		}
		String lower = note.toLowerCase();
		if (lower.contains("thu hồi earnings") || lower.contains("thu hồi earning")) {
			return WithdrawalType.COURSE_DELETED_CLAWBACK;
		}
		if (lower.contains("bị tạm giữ") && lower.contains("bị admin xóa")) {
			return WithdrawalType.COURSE_DELETED_HOLD;
		}
		if (lower.contains("final payout") && lower.contains("hạ role")) {
			return WithdrawalType.DOWNGRADE_AUTO;
		}
		// blockTeacher() ghi 2 loại note khác nhau (2 hàm)
		if (lower.contains("bị khóa vi phạm")
				|| lower.contains("tài khoản bị khóa")
				|| lower.contains("khóa vi phạm")
				|| lower.contains("tài khoản giảng viên bị khóa")) {
			return WithdrawalType.ACCOUNT_BLOCKED;
		}
		// Fallback: note tồn tại nhưng không khớp — coi là manual (admin reject note, v.v.)
		return WithdrawalType.TEACHER_MANUAL;
	}

	/** Parse bankAccountInfo JSON → BankSnapshot — mirror của RefundServiceImpl. */
	private BankSnapshot parseBankSnapshot(String bankJson) {
		BankSnapshot snap = new BankSnapshot();
		if (bankJson == null || bankJson.isBlank()) return snap;
		try {
			JsonNode node = objectMapper.readTree(bankJson);
			snap.bankName          = node.path("bankName").asText(null);
			snap.bankAccountNumber = node.has("accountNumber")
					? node.path("accountNumber").asText(null)
					: node.path("bankAccountNumber").asText(null);
			snap.bankAccountName   = node.has("accountName")
					? node.path("accountName").asText(null)
					: node.path("bankAccountName").asText(null);
		} catch (Exception e) {
			log.warn("Cannot parse bankAccountInfo JSON for withdrawal: {}", bankJson);
		}
		return snap;
	}

	/** Mask số tài khoản: chỉ hiện 4 số cuối — "****1234". */
	private String maskAccountNumber(String accountNumber) {
		if (accountNumber == null || accountNumber.length() <= 4) return "****";
		return "****" + accountNumber.substring(accountNumber.length() - 4);
	}

	// ── Teacher ───────────────────────────────────────────────────────────────

	@Override
	public TeacherBalanceResponse getMyBalance() {
		User teacher = getCurrentUser();
		String teacherId = teacher.getId();

		double totalEarned   = orderDetailRepository.sumTotalEarningsByTeacherId(teacherId);
		double totalApproved = withdrawalRepository.sumApprovedByTeacherId(teacherId);
		double totalFrozen   = withdrawalRepository.sumFrozenByTeacherId(teacherId);
		double available     = Math.max(totalEarned - totalApproved - totalFrozen, 0);

		String bankInfo = teacher.getProfile() != null
				&& teacher.getProfile().getBankAccountInfo() != null
				? teacher.getProfile().getBankAccountInfo()
				: null;

		return TeacherBalanceResponse.builder()
				.totalEarned(BigDecimal.valueOf(totalEarned))
				.totalWithdrawn(BigDecimal.valueOf(totalApproved))
				.availableBalance(BigDecimal.valueOf(available))
				.bankAccountInfo(bankInfo)
				.build();
	}

	@Override
	@Transactional
	public WithdrawalResponse requestWithdrawal(BigDecimal amount) {
		User teacher = getCurrentUser();
		String teacherId = teacher.getId();

		if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
			throw new AppException(ErrorCode.INVALID_REQUEST);
		}

		if (amount.compareTo(new BigDecimal("50000")) < 0) {
			throw new AppException(ErrorCode.WITHDRAWAL_MIN_LIMIT);
		}

		if (withdrawalRepository.existsByTeacherIdAndStatus(teacherId, WithdrawalStatus.PENDING)) {
			throw new AppException(ErrorCode.WITHDRAWAL_ALREADY_PENDING);
		}

		double available = calcAvailableBalance(teacherId);
		if (amount.doubleValue() > available) {
			throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
		}

		// Snapshot bank info tại thời điểm tạo lệnh rút.
		// Đảm bảo admin luôn thấy đúng STK dù teacher cập nhật bank sau này,
		// và cho phép downgrade logic giữ PENDING thay vì HOLD khi teacher đã có bank.
		String bankSnapshot = (teacher.getProfile() != null)
				? teacher.getProfile().getBankAccountInfo()
				: null;

		Withdrawal withdrawal = Withdrawal.builder()
				.teacher(teacher)
				.amount(amount)
				.status(WithdrawalStatus.PENDING)
				.bankSnapshot(bankSnapshot)
				.build();

		Withdrawal saved = withdrawalRepository.save(withdrawal);

		notificationService.notifyAllAdmins(
				"Yêu cầu rút tiền mới",
				"Teacher " + teacher.getEmail() + " vừa gửi yêu cầu rút "
						+ amount.toPlainString() + " VNĐ."
		);

		return toResponse(saved);
	}

	@Override
	public List<WithdrawalResponse> getMyWithdrawals() {
		User teacher = getCurrentUser();
		return withdrawalRepository
				.findByTeacherIdOrderByCreatedAtDesc(teacher.getId())
				.stream()
				.map(this::toResponse)
				.collect(Collectors.toList());
	}

	// ── Admin ─────────────────────────────────────────────────────────────────

	@Override
	public List<WithdrawalResponse> getAllWithdrawals(String status) {
		WithdrawalStatus statusEnum = null;
		if (status != null && !status.isBlank()) {
			try {
				statusEnum = WithdrawalStatus.valueOf(status.toUpperCase());
			} catch (IllegalArgumentException e) {
				throw new AppException(ErrorCode.INVALID_STATUS);
			}
		}
		return withdrawalRepository.findAllWithFilter(statusEnum)
				.stream()
				.map(this::toResponse)
				.collect(Collectors.toList());
	}

	@Override
	public Page<WithdrawalResponse> getAllWithdrawals(String status, int page, int size) {
		WithdrawalStatus statusEnum = null;
		if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
			try {
				statusEnum = WithdrawalStatus.valueOf(status.toUpperCase());
			} catch (IllegalArgumentException e) {
				throw new AppException(ErrorCode.INVALID_STATUS);
			}
		}
		// page từ FE là 1-indexed, Spring Pageable là 0-indexed
		PageRequest pageable = PageRequest.of(
				Math.max(page - 1, 0), size,
				Sort.by(Sort.Direction.DESC, "createdAt")
		);
		return withdrawalRepository.findAllWithFilter(statusEnum, pageable)
				.map(this::toResponse);
	}

	@Override
	@Transactional
	public void approveWithdrawal(Integer id) {
		Withdrawal withdrawal = withdrawalRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.WITHDRAWAL_NOT_FOUND));

		if (withdrawal.getStatus() != WithdrawalStatus.PENDING) {
			throw new AppException(ErrorCode.WITHDRAWAL_ALREADY_PROCESSED);
		}

		String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();

		withdrawal.setStatus(WithdrawalStatus.APPROVED);
		withdrawal.setProcessedAt(LocalDateTime.now());
		withdrawal.setProcessedBy(adminEmail);
		withdrawalRepository.save(withdrawal);

		notificationService.notifyUser(
				withdrawal.getTeacher(),
				"Yêu cầu rút tiền được chấp thuận ✓",
				"Yêu cầu rút " + withdrawal.getAmount().toPlainString()
						+ " VNĐ của bạn đã được chấp thuận. "
						+ "Tiền sẽ được chuyển vào tài khoản ngân hàng của bạn."
		);
	}

	@Override
	@Transactional
	public void rejectWithdrawal(Integer id, String note) {
		Withdrawal withdrawal = withdrawalRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.WITHDRAWAL_NOT_FOUND));

		if (withdrawal.getStatus() != WithdrawalStatus.PENDING) {
			throw new AppException(ErrorCode.WITHDRAWAL_ALREADY_PROCESSED);
		}

		String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();

		withdrawal.setStatus(WithdrawalStatus.REJECTED);
		withdrawal.setNote(note);
		withdrawal.setProcessedAt(LocalDateTime.now());
		withdrawal.setProcessedBy(adminEmail);
		withdrawalRepository.save(withdrawal);

		String content = "Yêu cầu rút " + withdrawal.getAmount().toPlainString() + " VNĐ của bạn bị từ chối."
				+ (note != null && !note.isBlank() ? " Lý do: " + note : "");

		notificationService.notifyUser(withdrawal.getTeacher(), "Yêu cầu rút tiền bị từ chối", content);
	}

	@Override
	@Transactional
	public void remindTeacher(Integer id) {
		Withdrawal withdrawal = withdrawalRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.WITHDRAWAL_NOT_FOUND));

		// Chỉ nhắc HOLD chưa có bank — không nhắc system HOLD (đã có bankSnapshot)
		if (withdrawal.getStatus() != WithdrawalStatus.HOLD) {
			throw new AppException(ErrorCode.INVALID_REQUEST);
		}
		if (withdrawal.getBankSnapshot() != null) {
			throw new AppException(ErrorCode.INVALID_REQUEST);
		}

		notificationService.notifyUser(
				withdrawal.getTeacher(),
				"⚠️ Cần cập nhật thông tin ngân hàng",
				"Bạn có " + withdrawal.getAmount().toPlainString()
						+ " VNĐ chưa được rút do tài khoản chưa có thông tin ngân hàng. "
						+ "Vui lòng vào Hồ sơ → Tài khoản ngân hàng để cập nhật "
						+ "để Admin có thể chuyển khoản cho bạn."
		);
	}

	@Override
	@Transactional
	public void completeHoldWithdrawal(Integer id, String note, String adminEmail) {
		Withdrawal withdrawal = withdrawalRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.WITHDRAWAL_NOT_FOUND));

		if (withdrawal.getStatus() != WithdrawalStatus.HOLD) {
			throw new AppException(ErrorCode.WITHDRAWAL_ALREADY_PROCESSED);
		}

		withdrawal.setStatus(WithdrawalStatus.APPROVED);
		withdrawal.setNote(note);
		withdrawal.setProcessedAt(LocalDateTime.now());
		withdrawal.setProcessedBy(adminEmail);
		withdrawalRepository.save(withdrawal);

		String content = "Khoản thanh toán " + withdrawal.getAmount().toPlainString()
				+ " VNĐ đã được Admin xử lý thủ công và đánh dấu hoàn tất."
				+ (note != null && !note.isBlank() ? " Ghi chú: " + note : "");

		notificationService.notifyUser(
				withdrawal.getTeacher(),
				"Khoản thanh toán đã hoàn tất ✓",
				content
		);
	}

	/**
	 * Trigger khi teacher cập nhật bank info trong Profile.
	 *
	 * Điều kiện để tự động chuyển trạng thái:
	 *   - status == HOLD
	 *   - bankSnapshot == null  (HOLD do hạ role mà chưa có bank lúc đó)
	 *
	 * Flow mirror RefundService.onStudentBankInfoUpdated():
	 *   1. Tìm tất cả Withdrawal HOLD + bankSnapshot == null của teacher
	 *   2. Parse bank info mới từ UserProfile
	 *   3. Ghi bankSnapshot + chuyển HOLD → PENDING
	 *   4. Notify teacher: khoản sẽ được xử lý
	 *   5. Notify admins: có withdrawal mới cần approve
	 *
	 * Hook vào: UserServiceImpl.updateBankInfo() hoặc UserProfileServiceImpl.updateProfile()
	 */
	@Override
	@Transactional
	public void onTeacherBankInfoUpdated(String teacherId) {
		// Chỉ lấy HOLD chưa có bankSnapshot — tức là HOLD do hạ role khi teacher chưa có bank
		List<Withdrawal> holdWithoutBank = withdrawalRepository
				.findByTeacherIdAndStatusAndBankSnapshotIsNull(teacherId, WithdrawalStatus.HOLD);

		if (holdWithoutBank.isEmpty()) return;

		User teacher = userRepository.findById(teacherId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		String bankJson = teacher.getProfile() != null
				? teacher.getProfile().getBankAccountInfo() : null;

		if (bankJson == null) return; // Vẫn chưa có — không làm gì

		BankSnapshot snap = parseBankSnapshot(bankJson);
		if (snap.bankAccountNumber == null && snap.bankName == null) return;

		String masked = maskAccountNumber(snap.bankAccountNumber);

		for (Withdrawal withdrawal : holdWithoutBank) {
			withdrawal.setStatus(WithdrawalStatus.PENDING);
			withdrawal.setBankSnapshot(bankJson);
			withdrawalRepository.save(withdrawal);

			// Notify teacher: tiền sẽ được xử lý
			notificationService.notifyUser(
					teacher,
					"Thông tin ngân hàng đã được ghi nhận ✓",
					String.format(
							"Thông tin ngân hàng của bạn đã được cập nhật thành công. " +
									"Khoản thanh toán %.0f₫ sẽ được Admin chuyển vào STK %s " +
									"(%s) trong thời gian sớm nhất.",
							withdrawal.getAmount().doubleValue(),
							masked,
							snap.bankName != null ? snap.bankName : ""
					)
			);
		}

		// Notify admins: có withdrawal(s) mới chuyển sang PENDING cần xử lý
		String teacherName = teacher.getProfile() != null && teacher.getProfile().getFullName() != null
				? teacher.getProfile().getFullName() : teacher.getEmail();

		notificationService.notifyAllAdmins(
				"⚠️ Withdrawal cần xử lý",
				String.format(
						"Teacher \"%s\" (%s) vừa cập nhật thông tin ngân hàng. " +
								"%d yêu cầu rút tiền (trạng thái HOLD) đã tự động chuyển sang PENDING — cần approve.",
						teacherName,
						teacher.getEmail(),
						holdWithoutBank.size()
				)
		);

		log.info("onTeacherBankInfoUpdated: {} HOLD withdrawal(s) → PENDING for teacher {}",
				holdWithoutBank.size(), teacherId);
	}

	/** Inner record giữ parsed bank info — không expose ra ngoài. */
	private static class BankSnapshot {
		String bankName;
		String bankAccountNumber;
		String bankAccountName;
	}
}