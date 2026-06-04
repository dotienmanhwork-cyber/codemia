package vn.codemia.api.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import vn.codemia.api.config.AiConfig;
import vn.codemia.api.dto.response.TranscriptResponse;
import vn.codemia.api.entity.Lesson;
import vn.codemia.api.enums.VideoPlatform;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.repository.LessonRepository;
import vn.codemia.api.service.TranscriptService;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class TranscriptServiceImpl implements TranscriptService {

	private final LessonRepository lessonRepository;
	private final RestTemplate     restTemplate;
	private final AiConfig         aiConfig;
	private final ObjectMapper     objectMapper = new ObjectMapper();

	// ── YouTube timedtext API (không cần key, public endpoint) ───────────
	private static final String YT_TIMEDTEXT_URL =
			"https://www.youtube.com/api/timedtext?v=%s&lang=vi&fmt=json3";

	// ── Groq Whisper API ──────────────────────────────────────────────────
	private static final String GROQ_WHISPER_URL =
			"https://api.groq.com/openai/v1/audio/transcriptions";

	// ── Inner record — chỉ dùng nội bộ trong service này ─────────────────
	private record VideoInfo(VideoPlatform platform, String videoId, String originalUrl) {}

	// ─────────────────────────────────────────────────────────────────────

	/**
	 * Pull transcript có cache check — dùng khi student/AI cần transcript.
	 * Nếu đã có trong DB thì trả về luôn, không pull lại.
	 */
	@Override
	@Transactional
	public TranscriptResponse pullTranscript(Integer lessonId) {
		Lesson lesson = lessonRepository.findById(lessonId)
				.orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

		// Cache hit — không pull lại
		if (lesson.getTranscript() != null && !lesson.getTranscript().isBlank()) {
			log.info("[Transcript] Cache hit for lessonId={}", lessonId);
			return TranscriptResponse.builder()
					.lessonId(lessonId)
					.transcript(lesson.getTranscript())
					.fromCache(true)
					.pulledAt(lesson.getTranscriptPulledAt())
					.build();
		}

		return doPullAndSave(lesson);
	}

	/**
	 * Pull transcript và lưu, KHÔNG check cache — dùng nội bộ bởi LessonService
	 * khi teacher tạo/cập nhật lesson. Không expose ra endpoint cho student.
	 */
	@Override
	@Transactional
	public TranscriptResponse pullAndSaveTranscript(Integer lessonId) {
		Lesson lesson = lessonRepository.findById(lessonId)
				.orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

		log.info("[Transcript] Force pull (no cache) for lessonId={}", lessonId);
		return doPullAndSave(lesson);
	}

	/**
	 * Overload nhận thẳng Lesson entity — tránh race condition khi transaction
	 * của create() chưa commit mà async thread đã query DB.
	 */
	@Override
	@Transactional
	public TranscriptResponse pullAndSaveTranscript(Lesson lesson) {
		log.info("[Transcript] Force pull (no cache, entity passed) for lessonId={}", lesson.getId());
		return doPullAndSave(lesson);
	}

	/**
	 * Logic pull thực tế — dùng chung cho cả 3 method trên.
	 * Tự động phân nhánh theo platform (YouTube / Vimeo).
	 */
	private TranscriptResponse doPullAndSave(Lesson lesson) {
		VideoInfo info = extractVideoInfo(lesson.getVideoUrl());

		if (info.platform() == VideoPlatform.UNKNOWN || info.videoId() == null) {
			throw new AppException(ErrorCode.INVALID_VIDEO_URL);
		}

		log.info("[Transcript] Platform={} videoId={}", info.platform(), info.videoId());

		String transcript = null;

		// YouTube: thử timedtext API trước (nhanh, không cần cài thêm gì)
		if (info.platform() == VideoPlatform.YOUTUBE) {
			transcript = fetchYoutubeTranscript(info.videoId(), "vi");

			if (transcript == null || transcript.isBlank()) {
				log.info("[Transcript] timedtext VI not found, trying EN for videoId={}", info.videoId());
				transcript = fetchYoutubeTranscript(info.videoId(), "en");
			}
		}

		// Vimeo: dùng Groq Whisper (download audio → transcribe)
		if (info.platform() == VideoPlatform.VIMEO
				&& (transcript == null || transcript.isBlank())) {
			log.info("[Transcript] Vimeo detected — trying Groq Whisper for url={}", info.originalUrl());
			transcript = fetchVimeoTranscriptViaGroqWhisper(info.originalUrl());
		}

		// YouTube: vào yt-dlp nếu timedtext cũng fail
		// Vimeo: vào yt-dlp nếu Groq Whisper cũng fail (last resort)
		if (transcript == null || transcript.isBlank()) {
			log.info("[Transcript] Trying yt-dlp VI for platform={} url={}", info.platform(), info.originalUrl());
			transcript = fetchTranscriptViaYtDlp(info.originalUrl(), "vi");
		}

		if (transcript == null || transcript.isBlank()) {
			log.info("[Transcript] Trying yt-dlp EN for platform={} url={}", info.platform(), info.originalUrl());
			transcript = fetchTranscriptViaYtDlp(info.originalUrl(), "en");
		}

		if (transcript == null || transcript.isBlank()) {
			throw new AppException(ErrorCode.TRANSCRIPT_NOT_FOUND);
		}

		// Lưu vào DB
		lesson.setTranscript(transcript);
		lesson.setTranscriptPulledAt(LocalDateTime.now());
		lessonRepository.save(lesson);
		log.info("[Transcript] Saved transcript for lessonId={}, length={}", lesson.getId(), transcript.length());

		return TranscriptResponse.builder()
				.lessonId(lesson.getId())
				.transcript(transcript)
				.fromCache(false)
				.pulledAt(lesson.getTranscriptPulledAt())
				.build();
	}

	@Override
	public String getTranscriptWindow(Integer lessonId, int timestampSeconds, int windowSeconds) {
		Lesson lesson = lessonRepository.findById(lessonId)
				.orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

		if (lesson.getTranscript() == null || lesson.getTranscript().isBlank()) {
			return "";
		}

		// Lọc các dòng trong khoảng [timestamp - window, timestamp + window]
		String[] lines = lesson.getTranscript().split("\n");
		List<String> result = new ArrayList<>();
		int from = timestampSeconds - windowSeconds;
		int to   = timestampSeconds + windowSeconds;

		for (String line : lines) {
			// Mỗi dòng có format: [HH:MM:SS] nội dung
			int lineTimestamp = parseTimestampFromLine(line);
			if (lineTimestamp >= from && lineTimestamp <= to) {
				result.add(line);
			}
		}

		return String.join("\n", result);
	}

	// ── Helpers ──────────────────────────────────────────────────────────

	/**
	 * Parse URL → VideoInfo{platform, videoId, originalUrl}.
	 * Support: YouTube (watch/short/embed) và Vimeo.
	 */
	private VideoInfo extractVideoInfo(String url) {
		if (url == null || url.isBlank())
			return new VideoInfo(VideoPlatform.UNKNOWN, null, url);

		// YouTube: youtu.be/ID
		Matcher m = Pattern.compile("youtu\\.be/([\\w-]{11})").matcher(url);
		if (m.find()) return new VideoInfo(VideoPlatform.YOUTUBE, m.group(1), url);

		// YouTube: watch?v=ID hoặc embed/ID
		m = Pattern.compile("[?&/](?:v=|embed/)([\\w-]{11})").matcher(url);
		if (m.find()) return new VideoInfo(VideoPlatform.YOUTUBE, m.group(1), url);

		// Vimeo: vimeo.com/123456789
		m = Pattern.compile("vimeo\\.com/(\\d+)").matcher(url);
		if (m.find()) return new VideoInfo(VideoPlatform.VIMEO, m.group(1), url);

		return new VideoInfo(VideoPlatform.UNKNOWN, null, url);
	}

	/**
	 * Gọi YouTube timedtext API, parse JSON3 → text có timestamp.
	 * Format lưu: [HH:MM:SS] nội dung mỗi dòng.
	 * Chỉ dùng cho YouTube — Vimeo không có API này.
	 */
	private String fetchYoutubeTranscript(String videoId, String lang) {
		try {
			String url = String.format(YT_TIMEDTEXT_URL.replace("vi", lang), videoId);
			ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

			if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
				return null;
			}

			JsonNode root   = objectMapper.readTree(response.getBody());
			JsonNode events = root.path("events");
			if (!events.isArray() || events.isEmpty()) return null;

			StringBuilder sb = new StringBuilder();
			for (JsonNode event : events) {
				// tStartMs: thời điểm bắt đầu (ms)
				long startMs = event.path("tStartMs").asLong(0);
				int  seconds = (int) (startMs / 1000);

				JsonNode segs = event.path("segs");
				if (!segs.isArray()) continue;

				StringBuilder text = new StringBuilder();
				for (JsonNode seg : segs) {
					text.append(seg.path("utf8").asText(""));
				}
				String content = text.toString().trim().replace("\n", " ");
				if (content.isBlank() || content.equals("\n")) continue;

				// Format: [HH:MM:SS] nội dung
				sb.append(formatTimestamp(seconds))
						.append(" ")
						.append(content)
						.append("\n");
			}
			return sb.toString().trim();

		} catch (Exception e) {
			log.warn("[Transcript] Failed to fetch timedtext lang={}: {}", lang, e.getMessage());
			return null;
		}
	}

	/** Seconds → [HH:MM:SS] */
	private String formatTimestamp(int totalSeconds) {
		int h = totalSeconds / 3600;
		int m = (totalSeconds % 3600) / 60;
		int s = totalSeconds % 60;
		return String.format("[%02d:%02d:%02d]", h, m, s);
	}

	/** Parse [HH:MM:SS] từ đầu dòng transcript → seconds */
	private int parseTimestampFromLine(String line) {
		Pattern p = Pattern.compile("\\[(\\d{2}):(\\d{2}):(\\d{2})]");
		Matcher m = p.matcher(line);
		if (!m.find()) return -1;
		return Integer.parseInt(m.group(1)) * 3600
				+ Integer.parseInt(m.group(2)) * 60
				+ Integer.parseInt(m.group(3));
	}

	// ── yt-dlp fallback ──────────────────────────────────────────────────

	/**
	 * Dùng yt-dlp CLI để download subtitle .vtt về thư mục temp,
	 * parse sang format [HH:MM:SS] nội dung rồi xoá file tạm.
	 *
	 * Nhận videoUrl gốc (không phải videoId) — yt-dlp tự nhận diện
	 * platform (YouTube, Vimeo, ...) từ URL, không cần xử lý riêng.
	 *
	 * Yêu cầu: yt-dlp đã được cài trên server
	 *   Ubuntu/Debian : sudo pip install yt-dlp
	 *   hoặc          : sudo apt install yt-dlp
	 */
	private String fetchTranscriptViaYtDlp(String videoUrl, String lang) {
		Path tmpDir = null;
		try {
			tmpDir = Files.createTempDirectory("yt-dlp-transcript");

			ProcessBuilder pb = new ProcessBuilder(
					"yt-dlp",
					"--write-sub",           // subtitle thủ công (do người upload)
					"--write-auto-sub",      // auto-generated caption (fallback)
					"--sub-lang", lang,
					"--sub-format", "vtt",
					"--skip-download",       // không tải video
					"--no-playlist",
					"-o", tmpDir.toAbsolutePath() + "/transcript",
					videoUrl                 // ← URL gốc, yt-dlp tự xử lý YouTube/Vimeo
			);
			pb.redirectErrorStream(true);

			Process process = pb.start();

			// Log output của yt-dlp để debug nếu cần
			StringBuilder ytdlpLog = new StringBuilder();
			try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
				String line;
				while ((line = reader.readLine()) != null) {
					ytdlpLog.append(line).append("\n");
				}
			}

			int exitCode = process.waitFor();
			log.debug("[Transcript] yt-dlp exit={} log={}", exitCode, ytdlpLog);

			// Tìm file .vtt được tạo ra trong tmpDir
			try (Stream<Path> files = Files.list(tmpDir)) {
				Path vttFile = files
						.filter(p -> p.toString().endsWith(".vtt"))
						.min(Comparator.comparing(p -> p.getFileName().toString()))
						.orElse(null);

				if (vttFile == null) {
					log.info("[Transcript] yt-dlp: no .vtt file found for url={} lang={}", videoUrl, lang);
					return null;
				}

				String vttContent = Files.readString(vttFile);
				log.info("[Transcript] yt-dlp: found .vtt file={} size={}", vttFile.getFileName(), vttContent.length());
				return parseVtt(vttContent);
			}

		} catch (Exception e) {
			log.warn("[Transcript] yt-dlp failed for url={} lang={}: {}", videoUrl, lang, e.getMessage());
			return null;
		} finally {
			// Dọn sạch thư mục temp
			if (tmpDir != null) {
				try (Stream<Path> files = Files.walk(tmpDir)) {
					files.sorted(Comparator.reverseOrder())
							.forEach(p -> {
								try { Files.deleteIfExists(p); } catch (Exception ignored) {}
							});
				} catch (Exception ignored) {}
			}
		}
	}

	/**
	 * Parse nội dung file .vtt → format [HH:MM:SS] nội dung (giống timedtext).
	 *
	 * VTT format mẫu:
	 *   00:00:01.000 --> 00:00:04.000
	 *   Xin chào các bạn
	 *
	 *   00:00:04.500 --> 00:00:07.000
	 *   Hôm nay chúng ta học ReactJS
	 */
	private String parseVtt(String vtt) {
		if (vtt == null || vtt.isBlank()) return null;

		// Regex match timestamp line: HH:MM:SS.mmm --> HH:MM:SS.mmm
		Pattern tsPattern = Pattern.compile(
				"(\\d{2}):(\\d{2}):(\\d{2})\\.\\d+ --> \\d{2}:\\d{2}:\\d{2}\\.\\d+.*"
		);
		// Regex xoá thẻ VTT như <00:00:01.000><c> hay </c>
		Pattern tagPattern = Pattern.compile("<[^>]+>");

		StringBuilder sb          = new StringBuilder();
		String[]      lines       = vtt.split("\n");
		int           curSec      = -1;
		String        lastContent = "";

		for (String line : lines) {
			line = line.trim();
			Matcher tsMatcher = tsPattern.matcher(line);

			if (tsMatcher.matches()) {
				// Dòng timestamp → lưu lại giây bắt đầu
				curSec = Integer.parseInt(tsMatcher.group(1)) * 3600
						+ Integer.parseInt(tsMatcher.group(2)) * 60
						+ Integer.parseInt(tsMatcher.group(3));
			} else if (curSec >= 0 && !line.isBlank()
					&& !line.startsWith("WEBVTT")
					&& !line.startsWith("NOTE")
					&& !line.matches("\\d+")) {
				// Dòng nội dung — xoá thẻ HTML/VTT
				String content = tagPattern.matcher(line).replaceAll("").trim();
				if (content.isBlank()) continue;

				// Bỏ duplicate liên tiếp (auto-caption thường lặp)
				if (content.equals(lastContent)) continue;
				lastContent = content;

				sb.append(formatTimestamp(curSec))
						.append(" ")
						.append(content)
						.append("\n");
				curSec = -1; // reset, chờ timestamp tiếp theo
			}
		}

		return sb.toString().trim();
	}

	// ── Groq Whisper ─────────────────────────────────────────────────────

	/**
	 * Download audio từ Vimeo (public) bằng yt-dlp → gửi lên Groq Whisper API
	 * → nhận về transcript dạng verbose_json có timestamps → format [HH:MM:SS].
	 *
	 * Yêu cầu: yt-dlp đã cài trên máy (pip install yt-dlp).
	 * Groq Whisper miễn phí, giới hạn 40MB/file và 100 req/ngày (free tier).
	 */
	private String fetchVimeoTranscriptViaGroqWhisper(String videoUrl) {
		Path tmpDir = null;
		try {
			tmpDir = Files.createTempDirectory("groq-whisper");

			// ── Bước 1: Download audio bằng yt-dlp ───────────────────────
			// %(ext)s để yt-dlp tự điền extension đúng trong từng bước:
			// bước download: "audio.m4a", bước convert: "audio.mp3"
			// Không dùng tên thuần "audio" vì Windows ffmpeg từ chối output không có extension
			String outputTemplate = tmpDir.toAbsolutePath() + "/audio.%(ext)s";

			ProcessBuilder pb = new ProcessBuilder(
					"yt-dlp",
					"--extract-audio",
					"--audio-format", "mp3",
					"--audio-quality", "5",        // 128kbps — đủ cho speech, file nhỏ
					"--no-playlist",
					"--ffmpeg-location", "C:/Users/ADMIN/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin",
					"-o", outputTemplate,          // KHÔNG thêm .mp3 — yt-dlp tự thêm sau convert
					videoUrl
			);
			pb.redirectErrorStream(true);
			Process process = pb.start();

			StringBuilder ytLog = new StringBuilder();
			try (BufferedReader reader = new BufferedReader(
					new InputStreamReader(process.getInputStream()))) {
				String line;
				while ((line = reader.readLine()) != null) ytLog.append(line).append("\n");
			}
			int exitCode = process.waitFor();
			log.debug("[Whisper] yt-dlp audio download exit={} log={}", exitCode, ytLog);

			// Tìm file .mp3 thực tế trong tmpDir (yt-dlp tự đặt tên sau convert)
			Path audioFile;
			try (Stream<Path> files = Files.list(tmpDir)) {
				audioFile = files
						.filter(p -> p.toString().endsWith(".mp3"))
						.findFirst()
						.orElse(null);
			}

			if (audioFile == null || Files.size(audioFile) == 0) {
				log.warn("[Whisper] Audio file not found or empty for url={} ytLog={}", videoUrl, ytLog);
				return null;
			}

			long fileSizeMB = Files.size(audioFile) / (1024 * 1024);
			log.info("[Whisper] Audio downloaded: {}MB file={} for url={}", fileSizeMB, audioFile.getFileName(), videoUrl);

			// Groq Whisper giới hạn 40MB
			if (fileSizeMB > 40) {
				log.warn("[Whisper] File too large ({}MB > 40MB), skipping Groq Whisper", fileSizeMB);
				return null;
			}

			// ── Bước 2: Gửi audio lên Groq Whisper ───────────────────────
			byte[] audioBytes = Files.readAllBytes(audioFile);

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.MULTIPART_FORM_DATA);
			headers.setBearerAuth(aiConfig.getGroqApiKey());

			MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
			body.add("model", "whisper-large-v3");
			body.add("language", "vi");
			body.add("response_format", "verbose_json"); // có timestamps từng segment
			body.add("file", new ByteArrayResource(audioBytes) {
				@Override
				public String getFilename() { return "audio.mp3"; }
			});

			HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
			ResponseEntity<String> response = restTemplate.postForEntity(
					GROQ_WHISPER_URL, request, String.class);

			if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
				log.warn("[Whisper] Groq API returned status={}", response.getStatusCode());
				return null;
			}

			// ── Bước 3: Parse verbose_json → format [HH:MM:SS] ───────────
			return parseWhisperVerboseJson(response.getBody());

		} catch (Exception e) {
			log.warn("[Whisper] fetchVimeoTranscriptViaGroqWhisper failed for url={}: {}",
					videoUrl, e.getMessage());
			return null;
		} finally {
			// Dọn file tạm
			if (tmpDir != null) {
				try (Stream<Path> files = Files.walk(tmpDir)) {
					files.sorted(Comparator.reverseOrder())
							.forEach(p -> { try { Files.deleteIfExists(p); } catch (Exception ignored) {} });
				} catch (Exception ignored) {}
			}
		}
	}

	/**
	 * Parse Groq Whisper verbose_json response.
	 *
	 * Response structure:
	 * {
	 *   "segments": [
	 *     { "start": 0.0, "end": 3.5, "text": "Xin chào các bạn" },
	 *     { "start": 3.5, "end": 7.2, "text": "Hôm nay chúng ta học..." }
	 *   ]
	 * }
	 *
	 * Output: [HH:MM:SS] nội dung (1 dòng / segment) — giống format YouTube timedtext.
	 */
	private String parseWhisperVerboseJson(String json) {
		try {
			JsonNode root     = objectMapper.readTree(json);
			JsonNode segments = root.path("segments");

			if (!segments.isArray() || segments.isEmpty()) {
				// Fallback: không có segments → dùng text thô, không có timestamp
				String text = root.path("text").asText("").trim();
				log.warn("[Whisper] No segments in response, using plain text (no timestamps)");
				return text.isBlank() ? null : text;
			}

			StringBuilder sb = new StringBuilder();
			for (JsonNode seg : segments) {
				double startSec = seg.path("start").asDouble(0);
				String text     = seg.path("text").asText("").trim();

				if (text.isBlank()) continue;

				sb.append(formatTimestamp((int) startSec))
						.append(" ")
						.append(text)
						.append("\n");
			}

			String result = sb.toString().trim();
			log.info("[Whisper] Parsed {} segments → {} chars", segments.size(), result.length());
			return result.isBlank() ? null : result;

		} catch (Exception e) {
			log.error("[Whisper] Failed to parse verbose_json: {}", e.getMessage());
			return null;
		}
	}
}