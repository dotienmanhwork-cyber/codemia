package vn.codemia.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.RequestTeacherUpgradeRequest;
import vn.codemia.api.dto.request.UserUpdateRequest;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.dto.response.UserResponse;
import vn.codemia.api.service.UserService;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@GetMapping("/my-profile")
	public ResponseEntity<ApiResponse<UserResponse>> getMyProfile() {
		return ResponseEntity.ok(
				ApiResponse.<UserResponse>builder()
						.code(1000)
						.result(userService.getMyProfile())
						.build()
		);
	}

	@PutMapping("/my-profile")
	public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(
			@RequestBody UserUpdateRequest request) {
		return ResponseEntity.ok(
				ApiResponse.<UserResponse>builder()
						.code(1000)
						.result(userService.updateMyProfile(request))
						.build()
		);
	}

	@PostMapping("/request-teacher")
	public ResponseEntity<ApiResponse<Void>> requestTeacherUpgrade(
			@RequestBody @Valid RequestTeacherUpgradeRequest request) {
		userService.requestTeacherUpgrade(request.getReason(), request.getCvUrl(), request.getPortfolioUrl());
		return ResponseEntity.ok(
				ApiResponse.<Void>builder()
						.code(1000)
						.message("Upgrade request submitted successfully")
						.build()
		);
	}
}