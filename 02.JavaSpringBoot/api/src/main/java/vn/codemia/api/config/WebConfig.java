package vn.codemia.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**") // Áp dụng cho tất cả các endpoint API
				.allowedOrigins("http://localhost:5173") // Cho phép React (Vite) truy cập
				.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Các phương thức được phép
				.allowedHeaders("*") // Cho phép tất cả các Header
				.allowCredentials(true) // Cho phép gửi kèm Cookie/Auth Header nếu cần
				.maxAge(3600); // Thời gian cache cấu hình CORS (1 giờ)
	}
}