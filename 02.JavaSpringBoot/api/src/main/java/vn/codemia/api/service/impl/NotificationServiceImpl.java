package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.entity.Notification;
import vn.codemia.api.entity.User;
import vn.codemia.api.enums.Role;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.repository.EnrollmentRepository;   // THÊM MỚI
import vn.codemia.api.repository.NotificationRepository;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.service.NotificationService;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

	private final NotificationRepository notificationRepository;
	private final UserRepository         userRepository;
	private final EnrollmentRepository   enrollmentRepository; // THÊM MỚI

	@Override
	@Transactional
	public void notifyUser(User user, String title, String content) {
		notificationRepository.save(Notification.builder()
				.user(user)
				.title(title)
				.content(content)
				.isRead(false)
				.build());
		log.info("Sent notification '{}' to user {}", title, user.getEmail());
	}

	@Override
	@Transactional
	public void notifyAllAdmins(String title, String content) {
		List<Notification> notifications = userRepository.findByRole(Role.ADMIN)
				.stream()
				.map(admin -> Notification.builder()
						.user(admin)
						.title(title)
						.content(content)
						.isRead(false)
						.build())
				.toList();

		notificationRepository.saveAll(notifications);
		log.info("Sent notification '{}' to {} admin(s)", title, notifications.size());
	}

	// THÊM MỚI
	@Override
	@Transactional
	public void notifyEnrolledStudents(String courseId, String title, String content) {
		List<Notification> notifications = enrollmentRepository.findByCourseId(courseId)
				.stream()
				.map(enrollment -> Notification.builder()
						.user(enrollment.getStudent())
						.title(title)
						.content(content)
						.isRead(false)
						.build())
				.toList();

		if (notifications.isEmpty()) {
			log.info("No enrolled students for courseId={}, skip notification", courseId);
			return;
		}

		notificationRepository.saveAll(notifications);
		log.info("Sent notification '{}' to {} student(s) of courseId={}",
				title, notifications.size(), courseId);
	}

	@Override
	@Transactional
	public void markAsRead(Integer id) {
		Notification notif = notificationRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		notif.setRead(true);
		notificationRepository.save(notif);
	}

	@Override
	@Transactional
	public void markAllAsRead(User user) {
		List<Notification> list = notificationRepository.findByUserOrderByCreatedAtDesc(user);
		list.forEach(n -> n.setRead(true));
		notificationRepository.saveAll(list);
	}
}