package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import vn.codemia.api.dto.request.UserUpdateRequest;
import vn.codemia.api.dto.response.UserResponse;
import vn.codemia.api.entity.User;
import vn.codemia.api.entity.UserProfile;
import vn.codemia.api.enums.Role;
import vn.codemia.api.enums.UserStatus;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.mapper.UserMapper;
import vn.codemia.api.repository.CourseRepository;
import vn.codemia.api.repository.EnrollmentRepository;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.repository.UserProfileRepository;
import vn.codemia.api.service.RefundService;
import vn.codemia.api.service.UserService;
import vn.codemia.api.service.NotificationService;
import vn.codemia.api.service.WithdrawalService;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

	private final UserRepository        userRepository;
	private final UserProfileRepository userProfileRepository;
	private final CourseRepository      courseRepository;
	private final EnrollmentRepository  enrollmentRepository;
	private final UserMapper            userMapper;
	private final NotificationService   notificationService;
	private final RefundService         refundService;
	private final WithdrawalService     withdrawalService;

	@PersistenceContext
	private EntityManager entityManager;

	private User getCurrentUser() {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
	}

	@Override
	public UserResponse getMyProfile() {
		User user = getCurrentUser();
		return userMapper.toUserResponse(user);
	}

	@Override
	@Transactional
	public UserResponse updateMyProfile(UserUpdateRequest request) {
		User user = getCurrentUser();

		UserProfile profile = userProfileRepository.findById(user.getId()).orElse(null);

		if (profile == null) {
			profile = new UserProfile();
			profile.setUserId(user.getId());
			profile.setUser(user);
			profile.setFullName(request.getFullName() != null ? request.getFullName() : "");
			profile.setAvatarUrl(request.getAvatarUrl());
			profile.setBio(request.getBio());
			profile.setBankAccountInfo(request.getBankAccountInfo());
			entityManager.persist(profile);
		} else {
			profile.setFullName(request.getFullName() != null ? request.getFullName() : "");
			profile.setAvatarUrl(request.getAvatarUrl());
			profile.setBio(request.getBio());
			profile.setBankAccountInfo(request.getBankAccountInfo());
		}

		entityManager.flush();

		if (request.getBankAccountInfo() != null && !request.getBankAccountInfo().isBlank()) {
			refundService.onStudentBankInfoUpdated(user.getId());
			withdrawalService.onTeacherBankInfoUpdated(user.getId());
		}

		user = userRepository.findById(user.getId())
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		return userMapper.toUserResponse(user);
	}

	@Override
	public Page<UserResponse> getAllUsers(int page, int size, String keyword, String role) {
		Pageable pageable = PageRequest.of(page - 1, size);

		Role roleEnum = null;
		if (role != null && !role.isBlank()) {
			try {
				roleEnum = Role.valueOf(role.toUpperCase());
			} catch (IllegalArgumentException e) {
				return Page.empty(pageable);
			}
		}

		Page<User> users = userRepository.findAllWithFilter(keyword, role, roleEnum, pageable);
		return users.map(userMapper::toUserResponse);
	}

	@Override
	public UserResponse changeStatus(String userId, String newStatus) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		UserStatus status;
		try {
			status = UserStatus.valueOf(newStatus.toUpperCase());
		} catch (IllegalArgumentException e) {
			throw new AppException(ErrorCode.INVALID_STATUS);
		}

		user.setStatus(status);
		return userMapper.toUserResponse(userRepository.save(user));
	}

	@Override
	public UserResponse changeRole(String userId, String newRole) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		user.setRole(Role.valueOf(newRole.toUpperCase()));
		return userMapper.toUserResponse(userRepository.save(user));
	}

	@Override
	@Transactional
	public void requestTeacherUpgrade(String reason, String cvUrl, String portfolioUrl) {
		User user = getCurrentUser();

		if (user.getRole() != Role.STUDENT) {
			throw new AppException(ErrorCode.NOT_STUDENT);
		}
		if (user.getStatus() == UserStatus.PENDING_TEACHER) {
			throw new AppException(ErrorCode.ALREADY_PENDING_TEACHER);
		}

		user.setStatus(UserStatus.PENDING_TEACHER);
		user.setUpgradeReason(reason);
		user.setCvUrl(cvUrl);
		user.setPortfolioUrl(portfolioUrl);
		userRepository.save(user);

		String userName = user.getProfile() != null
				? user.getProfile().getFullName() : user.getEmail();
		notificationService.notifyAllAdmins(
				"Yêu cầu nâng cấp Teacher mới",
				"\"" + userName + "\" (" + user.getEmail() + ") vừa gửi yêu cầu nâng cấp lên Teacher."
						+ " (Có đính kèm CV + Portfolio)"
		);
	}

	@Override
	public void deleteUser(String userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		switch (user.getRole()) {
			case ADMIN -> throw new AppException(ErrorCode.UNAUTHORIZED);

			case TEACHER -> {
				if (courseRepository.countByTeacherId(userId) > 0) {
					throw new AppException(ErrorCode.TEACHER_HAS_COURSES);
				}
			}

			case STUDENT -> {
				if (enrollmentRepository.countByStudentId(userId) > 0) {
					throw new AppException(ErrorCode.STUDENT_HAS_ENROLLMENTS);
				}
			}
		}

		userRepository.delete(user);
	}
}