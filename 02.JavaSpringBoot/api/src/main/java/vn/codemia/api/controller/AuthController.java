package vn.codemia.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.ChangePasswordRequest;
import vn.codemia.api.dto.request.LoginRequest;
import vn.codemia.api.dto.request.RegisterRequest;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.dto.response.AuthenticationResponse;
import vn.codemia.api.dto.response.UserResponse;
import vn.codemia.api.entity.User;
import vn.codemia.api.service.AuthService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@PostMapping("/register")
	public ApiResponse<UserResponse> register(@RequestBody RegisterRequest request) {
		// Trả về ApiResponse bọc lấy UserResponse
		return ApiResponse.<UserResponse>builder()
				.result(authService.register(request))
				.build();
	}
	@PostMapping("/login")
	public ApiResponse<AuthenticationResponse> login(@RequestBody LoginRequest request) {
		return ApiResponse.<AuthenticationResponse>builder()
				.result(authService.login(request))
				.build();
	}
	@PutMapping("/my-profile/change-password")
	public ApiResponse<String> changePassword(@RequestBody ChangePasswordRequest request) {

		// 1. Tự động lấy thông tin người dùng đang đăng nhập từ SecurityContext
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		// 2. Ép kiểu Principal về đối tượng User (Vì trong Filter bạn đã set Principal là User)
		User currentUser = (User) authentication.getPrincipal();

		// 3. Lấy ID của chính người đó và truyền vào Service
		authService.changePassword(currentUser.getId(), request);

		return ApiResponse.<String>builder()
				.message("Password changed successfully")
				.result("Success")
				.build();
	}
}