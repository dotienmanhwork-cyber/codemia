package vn.codemia.api.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthFilter;
	private final AuthenticationProvider authenticationProvider;

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
				.csrf(AbstractHttpConfigurer::disable)
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/api/auth/**").permitAll() // Cho phép truy cập tự do vào các endpoint auth

						// ===== CẤU HÌNH CHO CATEGORIES =====
						.requestMatchers(HttpMethod.GET, "/api/categories", "/api/categories/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/categories", "/api/categories/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole("ADMIN")

						// ===== CẤU HÌNH CHO TAGS =====
						.requestMatchers(HttpMethod.GET, "/api/tags", "/api/tags/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/tags", "/api/tags/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.PUT, "/api/tags/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.DELETE, "/api/tags/**").hasRole("ADMIN")

						// ===== CẤU HÌNH CHO COURSES =====
						// Ai cũng có thể xem danh sách và chi tiết khóa học (để còn mua chứ!)
						.requestMatchers(HttpMethod.GET, "/api/courses", "/api/courses/**").permitAll()

						// Chỉ TEACHER và ADMIN mới được Tạo, Sửa, Xóa khóa học
						.requestMatchers(HttpMethod.POST, "/api/courses", "/api/courses/**").hasAnyRole("TEACHER", "ADMIN")
						.requestMatchers(HttpMethod.PUT, "/api/courses/**").hasAnyRole("TEACHER", "ADMIN")
						.requestMatchers(HttpMethod.DELETE, "/api/courses/**").hasAnyRole("TEACHER", "ADMIN")

						// ===== CẤU HÌNH CHO SECTIONS =====
						.requestMatchers(HttpMethod.GET, "/api/sections/course/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/sections/**").hasAnyRole("TEACHER", "ADMIN")
						.requestMatchers(HttpMethod.PUT, "/api/sections/**").hasAnyRole("TEACHER", "ADMIN")
						.requestMatchers(HttpMethod.DELETE, "/api/sections/**").hasAnyRole("TEACHER", "ADMIN")

						// ===== CẤU HÌNH CHO LESSONS =====
						.requestMatchers(HttpMethod.GET, "/api/lessons/section/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/lessons/**").hasAnyRole("TEACHER", "ADMIN")
						.requestMatchers(HttpMethod.PUT, "/api/lessons/**").hasAnyRole("TEACHER", "ADMIN")
						.requestMatchers(HttpMethod.DELETE, "/api/lessons/**").hasAnyRole("TEACHER", "ADMIN")

						// Giỏ hàng: Chỉ những người đã đăng nhập (bất kể role nào) mới được vào
						.requestMatchers("/api/cart/**").authenticated()
						// ===== CẤU HÌNH KHÁC =====
						.requestMatchers("/api/ai/**").authenticated()
						.requestMatchers(HttpMethod.GET, "/api/orders/vnpay-callback").permitAll()
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						.requestMatchers("/api/teacher/**").hasRole("TEACHER")
						.anyRequest().authenticated()
				)
				// Đăng ký Provider để xử lý xác thực[cite: 2]
				.authenticationProvider(authenticationProvider)
				// Đưa JwtAuthenticationFilter vào trước màng lọc mặc định để quét Token[cite: 2]
				.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(List.of("http://localhost:5173"));
		config.setAllowedMethods(List.of("GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("*"));
		config.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}
}