package vn.codemia.api;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import vn.codemia.api.entity.Lesson;
import vn.codemia.api.repository.LessonRepository;
import vn.codemia.api.service.AiService;
import vn.codemia.api.service.TranscriptService;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class TranscriptStartupRunner {

	private final LessonRepository  lessonRepository;
	private final TranscriptService transcriptService;
	private final AiService         aiService;

	/**
	 * Chạy 1 lần sau khi Spring Boot khởi động xong.
	 * 1) Lesson có video_url nhưng chưa có transcript → pull transcript → sinh summary
	 * 2) Lesson đã có transcript nhưng chưa có summary → sinh summary
	 */
	@EventListener(ApplicationReadyEvent.class)
	public void pullMissingTranscripts() {

		// ── 1) Lesson chưa có transcript ──────────────────────────────────
		List<Lesson> missingTranscript =
				lessonRepository.findByVideoUrlIsNotNullAndTranscriptIsNull();

		if (!missingTranscript.isEmpty()) {
			log.info("[StartupRunner] {} lesson chưa có transcript, bắt đầu pull...",
					missingTranscript.size());

			for (Lesson lesson : missingTranscript) {
				CompletableFuture.runAsync(() -> {
					try {
						transcriptService.pullAndSaveTranscript(lesson);
						log.info("[StartupRunner] ✓ Transcript pulled lessonId={}", lesson.getId());

						// Sinh summary ngay sau khi có transcript
						aiService.summarizeLesson(lesson.getId());
						log.info("[StartupRunner] ✓ Summary done lessonId={}", lesson.getId());
					} catch (Exception e) {
						log.warn("[StartupRunner] ✗ Failed lessonId={} title='{}': {}",
								lesson.getId(), lesson.getTitle(), e.getMessage());
					}
				});
			}
		} else {
			log.info("[StartupRunner] Tất cả lesson đã có transcript.");
		}

		// ── 2) Lesson có transcript nhưng chưa có summary ─────────────────
		List<Lesson> missingSummary =
				lessonRepository.findByTranscriptIsNotNullAndAiSummaryCacheIsNull();

		if (!missingSummary.isEmpty()) {
			log.info("[StartupRunner] {} lesson chưa có summary, bắt đầu sinh...",
					missingSummary.size());

			for (Lesson lesson : missingSummary) {
				CompletableFuture.runAsync(() -> {
					try {
						aiService.summarizeLesson(lesson.getId());
						log.info("[StartupRunner] ✓ Summary done lessonId={}", lesson.getId());
					} catch (Exception e) {
						log.warn("[StartupRunner] ✗ Summary failed lessonId={} title='{}': {}",
								lesson.getId(), lesson.getTitle(), e.getMessage());
					}
				});
			}
		} else {
			log.info("[StartupRunner] Tất cả lesson đã có summary.");
		}
	}
}