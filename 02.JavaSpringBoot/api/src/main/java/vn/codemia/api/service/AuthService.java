package vn.codemia.api.service;

import vn.codemia.api.dto.request.ChangePasswordRequest;
import vn.codemia.api.dto.request.LoginRequest;
import vn.codemia.api.dto.request.RegisterRequest;
import vn.codemia.api.dto.response.AuthenticationResponse;
import vn.codemia.api.dto.response.UserResponse;

public interface AuthService {
	UserResponse register(RegisterRequest request);
	AuthenticationResponse login(LoginRequest request);
	void changePassword(String userId, ChangePasswordRequest request);
}