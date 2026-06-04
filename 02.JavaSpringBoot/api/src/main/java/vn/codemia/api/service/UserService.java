package vn.codemia.api.service;

import org.springframework.data.domain.Page;
import vn.codemia.api.dto.request.UserUpdateRequest;
import vn.codemia.api.dto.response.UserResponse;

public interface UserService {
	UserResponse getMyProfile();
	UserResponse updateMyProfile(UserUpdateRequest request);

	Page<UserResponse> getAllUsers(int page, int size, String keyword, String role);

	UserResponse changeRole(String userId, String newRole);
	UserResponse changeStatus(String userId, String newStatus);


	void requestTeacherUpgrade(String reason, String cvUrl, String portfolioUrl);

	void deleteUser(String userId);
}