package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.dto.request.ChangePasswordRequest;
import vn.codemia.api.dto.request.LoginRequest;
import vn.codemia.api.dto.request.RegisterRequest;
import vn.codemia.api.dto.response.AuthenticationResponse;
import vn.codemia.api.dto.response.UserResponse;
import vn.codemia.api.entity.User;
import vn.codemia.api.entity.UserProfile;
import vn.codemia.api.enums.Role;
import vn.codemia.api.enums.UserStatus;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.mapper.UserMapper;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.service.AuthService;
import vn.codemia.api.service.JwtService;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
	private final JwtService jwtService;
	@Override
	@Transactional // Đảm bảo nếu lưu Profile lỗi thì User cũng không được tạo
	public UserResponse register(RegisterRequest request) {
		System.out.println("====== EMAIL NHẬN ĐƯỢC TỪ REACT: " + request.getEmail() + " ======");
		// 1. Kiểm tra email tồn tại
		if (userRepository.existsByEmail(request.getEmail())) {
			throw new AppException(ErrorCode.USER_EXISTED);
		}
		// 2. CHỐT CHẶN MỚI THÊM VÀO:
		// 2. Tạo Entity User và mã hóa mật khẩu
		User user = User.builder()
				.email(request.getEmail())
				.passwordHash(passwordEncoder.encode(request.getPassword()))

				// Không lấy từ request nữa, mà gán cứng mặc định là học viên
				.role(Role.STUDENT)

				.status(UserStatus.ACTIVE)
				.build();

		// 3. Tạo Entity UserProfile và thiết lập quan hệ
		UserProfile profile = UserProfile.builder()
				.user(user)
				.fullName(request.getFullName())
				.build();

		user.setProfile(profile);

		// 4. Lưu vào DB (Cascade sẽ tự lưu Profile)
		User savedUser = userRepository.save(user);

		// 5. Trả về DTO
		return userMapper.toUserResponse(savedUser);
	}
	@Override
	public AuthenticationResponse login(LoginRequest request) {
		// 1. Tìm user theo email, nếu không thấy thì ném lỗi 1002
		User user = userRepository.findByEmail(request.getEmail())
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		//1.5 Kiểm tra acc có bị khóa không
		if (user.getStatus() == UserStatus.BLOCKED) {
			throw new AppException(ErrorCode.USER_BLOCKED);
		}
		// 2. So sánh mật khẩu gốc với mật khẩu đã băm trong DB
		// Lưu ý: Tuyệt đối không dùng request.getPassword().equals(...)
		boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

		if (!authenticated) {
			throw new AppException(ErrorCode.UNAUTHENTICATED);
		}

		String token = jwtService.generateToken(user);

		return AuthenticationResponse.builder()
				.token(token)
				.user(userMapper.toUserResponse(user))
				.build();
	}
	@Override
	@Transactional
	public void changePassword(String userId, ChangePasswordRequest request) {
		// 1. Tìm user
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
		// 2. Kiểm tra mật khẩu cũ có khớp không
		boolean isMatch = passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash());
		if (!isMatch) {
			throw new AppException(ErrorCode.PASSWORD_INCORRECT);
		}

		user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
		userRepository.save(user);
	}
}