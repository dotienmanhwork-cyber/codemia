package vn.codemia.api.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.entity.User;
import vn.codemia.api.enums.UserStatus;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.repository.UserRepository;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Proxy CV cho Admin.
 *
 * File CV được upload lên Cloudinary dạng PUBLIC (upload_preset unsigned,
 * không có s--signature-- trong URL) → fetch thẳng cvUrl, không cần auth.
 *
 * Tại sao cần proxy thay vì trả URL thẳng cho FE?
 *   - Ẩn Cloudinary URL khỏi browser Admin (tránh leak/share link)
 *   - Dễ thêm logic audit log sau này
 *   - FE không cần xử lý CORS với Cloudinary
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class CvProxyController {

	private final UserRepository userRepository;

	private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
			.connectTimeout(Duration.ofSeconds(10))
			.followRedirects(HttpClient.Redirect.NORMAL)
			.build();

	@GetMapping("/cv-proxy/{userId}")
	public ResponseEntity<byte[]> proxyCv(@PathVariable String userId) {

		User user = userRepository.findById(userId)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		String cvUrl = user.getCvUrl();
		if (cvUrl == null || cvUrl.isBlank()) {
			log.warn("[CvProxy] No cvUrl for userId={}", userId);
			return ResponseEntity.notFound().build();
		}

		if (user.getStatus() != UserStatus.PENDING_TEACHER) {
			return ResponseEntity.status(HttpStatus.GONE).build();
		}

		log.info("[CvProxy] Fetching cvUrl={} for userId={}", cvUrl, userId);

		try {
			// File là public trên Cloudinary → fetch thẳng, không cần auth
			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(cvUrl))
					.timeout(Duration.ofSeconds(20))
					.header("User-Agent", "Mozilla/5.0") // tránh bị Cloudinary block bot
					.GET()
					.build();

			HttpResponse<byte[]> response = HTTP_CLIENT.send(
					request, HttpResponse.BodyHandlers.ofByteArray());

			log.info("[CvProxy] Cloudinary returned {} ({} bytes) for userId={}",
					response.statusCode(), response.body().length, userId);

			if (response.statusCode() != 200) {
				log.warn("[CvProxy] Non-200 from Cloudinary: {}", response.statusCode());
				return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
			}

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_PDF);
			headers.set(HttpHeaders.CONTENT_DISPOSITION,
					"inline; filename=\"cv_" + userId + ".pdf\"");
			headers.setCacheControl("private, max-age=300");

			return new ResponseEntity<>(response.body(), headers, HttpStatus.OK);

		} catch (IOException | InterruptedException e) {
			log.error("[CvProxy] Failed to fetch CV for userId={}: {}", userId, e.getMessage());
			Thread.currentThread().interrupt();
			return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
		}
	}
}