package vn.codemia.api.dto.response;

import lombok.*;
import vn.codemia.api.entity.Notification;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

	private Integer id;
	private String title;
	private String content;
	private boolean read;
	private LocalDateTime createdAt;

	// Chỉ lấy đúng fields cần thiết — không embed cả User/UserProfile entity
	private String userId;
	private String userEmail;
	private String userFullName;
	private String userAvatarUrl;

	public static NotificationResponse from(Notification notification) {
		NotificationResponseBuilder builder = NotificationResponse.builder()
				.id(notification.getId())
				.title(notification.getTitle())
				.content(notification.getContent())
				.read(notification.isRead())
				.createdAt(notification.getCreatedAt());

		var user = notification.getUser();
		if (user != null) {
			builder.userId(user.getId())
					.userEmail(user.getEmail());

			var profile = user.getProfile();
			if (profile != null) {
				builder.userFullName(profile.getFullName())
						.userAvatarUrl(profile.getAvatarUrl());
			}
		}

		return builder.build();
	}
}