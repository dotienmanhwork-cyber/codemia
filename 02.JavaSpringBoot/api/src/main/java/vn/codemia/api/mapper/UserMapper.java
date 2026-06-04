package vn.codemia.api.mapper;

import org.springframework.stereotype.Component;
import vn.codemia.api.dto.response.UserResponse;
import vn.codemia.api.entity.User;

@Component
public class UserMapper {
	public UserResponse toUserResponse(User user) {
		var profile = user.getProfile();

		return UserResponse.builder()
				.id(user.getId())
				.email(user.getEmail())
				.fullName(profile != null ? profile.getFullName() : null)
				.avatarUrl(profile != null ? profile.getAvatarUrl() : null)
				.bio(profile != null ? profile.getBio() : null)
				.bankAccountInfo(profile != null ? profile.getBankAccountInfo() : null)
				.role(user.getRole().name())
				.status(user.getStatus().name())
				.createdAt(user.getCreatedAt()) // ← thêm mới
				.build();
	}
}