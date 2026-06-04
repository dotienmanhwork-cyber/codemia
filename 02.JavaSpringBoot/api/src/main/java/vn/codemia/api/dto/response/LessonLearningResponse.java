package vn.codemia.api.dto.response;

import lombok.*;
import vn.codemia.api.enums.LessonType;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonLearningResponse {

	// ── Core lesson fields (khớp với DB lessons) ─────────────────────────────
	private Integer id;          // INT AUTO_INCREMENT
	private String title;
	private LessonType type;     // enum VIDEO / TEXT / EXERCISE — KHÔNG toString
	private Integer orderIndex;
	private Integer duration;

	// DB: video_url — field đổi từ contentUrl → videoUrl
	private String videoUrl;

	// ── Learning-specific fields ──────────────────────────────────────────────
	private boolean completed;           // map từ lesson_progress.is_completed
	private List<String> summaryItems;   // parse từ lessons.ai_summary_cache
	private String content;

	// KHÔNG có: status (String), videoTimestamp — không tồn tại trong DB
	// KHÔNG có: isFreePreview, aiSummaryCache (raw), sectionId, createdAt — không cần expose
}