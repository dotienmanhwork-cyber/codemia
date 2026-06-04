package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.codemia.api.enums.LessonType;

import java.time.LocalDateTime;

@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lesson {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "section_id", nullable = false)
	private Section section;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private LessonType type;

	@Column(nullable = false)
	private String title;

	@Column(name = "video_url", length = 500)
	private String videoUrl;

	@Builder.Default
	@Column(columnDefinition = "int default 0")
	private Integer duration = 0;

	// ── AI Cache ─────────────────────────────────────────────────────────
	@Column(name = "ai_summary_cache", columnDefinition = "TEXT")
	private String aiSummaryCache;

	// ── Transcript (phụ đề + timestamp từ YouTube) ────────────────────
	@Column(name = "transcript", columnDefinition = "LONGTEXT")
	private String transcript;

	@Column(name = "transcript_pulled_at")
	private LocalDateTime transcriptPulledAt;

	// ── Ordering ──────────────────────────────────────────────────────────
	@Column(name = "order_index", nullable = false)
	private Integer orderIndex;

	@Column(name = "content", columnDefinition = "LONGTEXT")
	private String content;
}