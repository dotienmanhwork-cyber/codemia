package vn.codemia.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.dto.response.NotificationResponse;
import vn.codemia.api.entity.User;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.repository.NotificationRepository;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.service.NotificationService;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

	private final NotificationRepository notificationRepository;
	private final UserRepository userRepository;
	private final NotificationService notificationService;

	private User getCurrentUser() {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
	}

	@GetMapping
	public ApiResponse<?> getMyNotifications() {
		List<NotificationResponse> result = notificationRepository
				.findByUserOrderByCreatedAtDesc(getCurrentUser(), PageRequest.of(0, 10))
				.stream()
				.map(NotificationResponse::from)
				.toList();

		return ApiResponse.builder().result(result).build();
	}

	@PutMapping("/{id}/read")
	public ApiResponse<?> markAsRead(@PathVariable Integer id) {
		notificationService.markAsRead(id);
		return ApiResponse.builder().result("OK").build();
	}

	@PutMapping("/read-all")
	public ApiResponse<?> markAllAsRead() {
		notificationService.markAllAsRead(getCurrentUser());
		return ApiResponse.builder().result("OK").build();
	}
}