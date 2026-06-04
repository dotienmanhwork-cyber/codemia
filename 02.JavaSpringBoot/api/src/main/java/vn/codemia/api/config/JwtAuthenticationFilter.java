package vn.codemia.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.codemia.api.entity.User;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.service.JwtService;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtService jwtService;
	private final UserRepository userRepository;

	@Override
	protected void doFilterInternal(
			@NonNull HttpServletRequest request,
			@NonNull HttpServletResponse response,
			@NonNull FilterChain filterChain
	) throws ServletException, IOException {

		// 1. Lấy Token từ Header của Request (chuẩn Bearer Token)
		final String authHeader = request.getHeader("Authorization");
		final String jwt;
		final String userEmail;

		// Nếu không có thẻ hoặc thẻ không bắt đầu bằng "Bearer ", đuổi đi luôn
		if (authHeader == null || !authHeader.startsWith("Bearer ")) {
			filterChain.doFilter(request, response);
			return;
		}

		// Cắt lấy phần chuỗi Token (bỏ chữ "Bearer " ở đầu)
		jwt = authHeader.substring(7);

		// 2. Kiểm tra thẻ có hợp lệ không
		if (jwtService.isTokenValid(jwt)) {
			userEmail = jwtService.extractEmail(jwt);

			// 3. Nếu thẻ hợp lệ, kiểm tra xem user có đang trống trong SecurityContext không
			if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
				// Móc User từ Database lên
				User user = userRepository.findByEmail(userEmail).orElse(null);

				if (user != null) {
					// Báo cáo cho Spring Security biết: "Người này là hợp lệ, cho phép đi qua!"
					UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
							user,
							null,
							Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
					);
					SecurityContextHolder.getContext().setAuthentication(authToken);
				}
			}
		}

		// Chuyển cho màng lọc tiếp theo
		filterChain.doFilter(request, response);
	}
}