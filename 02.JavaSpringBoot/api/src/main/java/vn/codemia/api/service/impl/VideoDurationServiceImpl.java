package vn.codemia.api.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vn.codemia.api.entity.Lesson;
import vn.codemia.api.enums.VideoPlatform;
import vn.codemia.api.repository.LessonRepository;
import vn.codemia.api.service.VideoDurationService;
import vn.codemia.api.utils.VideoUrlUtils;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoDurationServiceImpl implements VideoDurationService {

	private final LessonRepository lessonRepository;
	private final RestTemplate     restTemplate;
	private final ObjectMapper     objectMapper;

	// Khai báo trong application.yml:
	//   youtube:
	//     api-key: AIza...
	// Nếu chưa có key, để trống — service sẽ skip YouTube và log warning.
	@Value("${youtube.api-key:}")
	private String youtubeApiKey;

	// ── YouTube Data API v3 ──────────────────────────────────────────────
	// Trả về: items[0].contentDetails.duration = "PT4M13S" (ISO 8601)
	private static final String YT_API =
			"https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=%s&key=%s";

	// ── Vimeo oEmbed (public, không cần API key) ─────────────────────────
	// Trả về: { "duration": 253, ... }
	private static final String VIMEO_OEMBED =
			"https://vimeo.com/api/oembed.json?url=%s";

	// ────────────────────────────────────────────────────────────────────

	@Override
	public void fetchAndSaveDuration(Lesson lesson) {
		String url = lesson.getVideoUrl();
		if (url == null || url.isBlank()) return;

		VideoPlatform platform = VideoUrlUtils.detect(url);
		int durationSeconds;

		switch (platform) {
			case YOUTUBE -> durationSeconds = fetchFromYouTube(url);
			case VIMEO   -> durationSeconds = fetchFromVimeo(url);
			default -> {
				log.warn("[Duration] Unknown platform for url={}", url);
				return;
			}
		}

		if (durationSeconds <= 0) {
			log.warn("[Duration] Could not fetch duration for lessonId={} url={}", lesson.getId(), url);
			return;
		}

		// Fetch lại entity từ DB để tránh stale state (async thread chạy sau commit)
		lessonRepository.findById(lesson.getId()).ifPresent(fresh -> {
			fresh.setDuration(durationSeconds);
			lessonRepository.save(fresh);
			log.info("[Duration] Saved {}s for lessonId={} platform={}", durationSeconds, fresh.getId(), platform);
		});
	}

	// ── YouTube ──────────────────────────────────────────────────────────

	private int fetchFromYouTube(String videoUrl) {
		if (youtubeApiKey == null || youtubeApiKey.isBlank()) {
			log.warn("[Duration] youtube.api.key not configured — skipping YouTube duration fetch");
			return 0;
		}

		String videoId = VideoUrlUtils.extractYouTubeId(videoUrl);
		if (videoId == null) {
			log.warn("[Duration] Cannot extract YouTube videoId from url={}", videoUrl);
			return 0;
		}

		try {
			String apiUrl = String.format(YT_API, videoId, youtubeApiKey);
			ResponseEntity<String> response = restTemplate.getForEntity(apiUrl, String.class);

			if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) return 0;

			JsonNode root  = objectMapper.readTree(response.getBody());
			JsonNode items = root.path("items");

			if (!items.isArray() || items.isEmpty()) {
				log.warn("[Duration] YouTube API returned 0 items for videoId={}", videoId);
				return 0;
			}

			// duration = "PT4M13S" → java.time.Duration parse → giây
			String isoDuration = items.get(0).path("contentDetails").path("duration").asText();
			return (int) Duration.parse(isoDuration).getSeconds();

		} catch (Exception e) {
			log.error("[Duration] YouTube API error for videoId={}: {}", videoId, e.getMessage());
			return 0;
		}
	}

	// ── Vimeo ────────────────────────────────────────────────────────────

	private int fetchFromVimeo(String videoUrl) {
		try {
			// Vimeo oEmbed nhận nguyên URL, không cần extract ID
			String apiUrl = String.format(VIMEO_OEMBED, videoUrl);
			ResponseEntity<String> response = restTemplate.getForEntity(apiUrl, String.class);

			if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) return 0;

			JsonNode root = objectMapper.readTree(response.getBody());
			// Vimeo trả về duration trực tiếp bằng giây — không cần parse
			return root.path("duration").asInt(0);

		} catch (Exception e) {
			log.error("[Duration] Vimeo oEmbed error for url={}: {}", videoUrl, e.getMessage());
			return 0;
		}
	}
}