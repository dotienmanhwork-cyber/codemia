package vn.codemia.api.mapper;

import org.springframework.stereotype.Component;
import vn.codemia.api.dto.response.*;
import vn.codemia.api.entity.*;
import vn.codemia.api.enums.LessonType;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * LearningMapper — mapping thủ công (không dùng MapStruct) vì:
 * 1. Cần inject LessonProgress map (is_completed) theo từng enrollment
 * 2. Logic tính % progress phụ thuộc runtime data, không phải field 1-1
 *
 * Khớp với DB thực:
 * - lessons.id          → Integer (AUTO_INCREMENT)
 * - lessons.video_url   → LessonLearningResponse.videoUrl
 * - lessons.type        → LessonType enum (VIDEO/TEXT/EXERCISE)
 * - lesson_progress     → chỉ có is_completed BOOLEAN + completed_at
 * - enrollments         → progress_percent DECIMAL, student_id (không có current_lesson_id)
 */
@Component
public class LearningMapper {

	/**
	 * Course + Enrollment → CourseProgressResponse.
	 * progress lấy thẳng từ enrollment.progressPercent (DB lưu sẵn).
	 */
	public CourseProgressResponse toCourseProgressResponse(
			Course course,
			Enrollment enrollment) {

		return CourseProgressResponse.builder()
				.courseId(course.getId())
				.slug(course.getSlug())
				.title(course.getTitle())
				.progress(enrollment.getProgressPercent())
				.build();
	}

	/**
	 * List<Section> + progressMap → CurriculumResponse.
	 *
	 * @param sections    danh sách section (đã eager-load lessons)
	 * @param progressMap key = lesson.id (Integer), value = LessonProgress (nullable per lesson)
	 */
	public CurriculumResponse toCurriculumResponse(
			List<Section> sections,
			Map<Integer, LessonProgress> progressMap) {

		List<SectionLearningResponse> chapters = sections.stream()
				.map(section -> toSectionLearningResponse(section, progressMap))
				.collect(Collectors.toList());

		return CurriculumResponse.builder()
				.chapters(chapters)
				.build();
	}

	private SectionLearningResponse toSectionLearningResponse(
			Section section,
			Map<Integer, LessonProgress> progressMap) {

		List<LessonLearningResponse> lessons = section.getLessons() == null
				? Collections.emptyList()
				: section.getLessons().stream()
				// lesson.getId() là Integer — dùng trực tiếp làm key
				  .map(lesson -> toLessonSidebarResponse(lesson, progressMap.get(lesson.getId())))
				  .collect(Collectors.toList());

		return SectionLearningResponse.builder()
				.id(String.valueOf(section.getId()))
				.title(section.getTitle())
				.lessons(lessons)
				.build();
	}

	/**
	 * Lesson + LessonProgress (nullable) → LessonLearningResponse cho sidebar.
	 * Chỉ cần: id (Integer), title, type (LessonType), isCompleted.
	 */
	public LessonLearningResponse toLessonSidebarResponse(Lesson lesson, LessonProgress progress) {
		boolean completed = progress != null && Boolean.TRUE.equals(progress.getIsCompleted());

		return LessonLearningResponse.builder()
				.id(lesson.getId())                   // Integer — KHÔNG toString
				.title(lesson.getTitle())
				.type(lesson.getType())               // LessonType enum — KHÔNG toString
				.completed(completed)
				.build();
	}

	/**
	 * Lesson + LessonProgress (nullable) → LessonLearningResponse đầy đủ cho PlayerPane.
	 * Thêm videoUrl (từ lessons.video_url) và summaryItems.
	 */
	public LessonLearningResponse toLessonDetailResponse(Lesson lesson, LessonProgress progress) {
		boolean completed = progress != null && Boolean.TRUE.equals(progress.getIsCompleted());
		List<String> summaryItems = parseSummaryCache(lesson.getAiSummaryCache());

		return LessonLearningResponse.builder()
				.id(lesson.getId())                   // Integer
				.title(lesson.getTitle())
				.type(lesson.getType())               // LessonType enum
				.completed(completed)
				.videoUrl(lesson.getVideoUrl())        // DB: video_url — KHÔNG phải contentUrl
				.summaryItems(summaryItems)
				.content(lesson.getContent())
				// KHÔNG có videoTimestamp — DB lesson_progress không có cột này
				.build();
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	/**
	 * Parse ai_summary_cache JSON string ["item1","item2"] → List<String>.
	 * Dùng split đơn giản vì đây là flat string array, không có nested object.
	 */
	private List<String> parseSummaryCache(String json) {
		if (json == null || json.isBlank()) return Collections.emptyList();
		try {
			String trimmed = json.trim();
			if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
				String inner = trimmed.substring(1, trimmed.length() - 1);
				if (inner.isBlank()) return Collections.emptyList();
				return java.util.Arrays.stream(inner.split(","))
						.map(s -> s.trim().replaceAll("^\"|\"$", ""))
						.filter(s -> !s.isBlank())
						.collect(Collectors.toList());
			}
		} catch (Exception ignored) {}
		return Collections.emptyList();
	}
	public MyCourseResponse toMyCourseResponse(Enrollment enrollment) {
		return MyCourseResponse.builder()
				.courseId(enrollment.getCourse().getId())
				.title(enrollment.getCourse().getTitle())
				.thumbnailUrl(enrollment.getCourse().getThumbnailUrl())
				.progressPercent(enrollment.getProgressPercent())
				.enrolledAt(enrollment.getEnrolledAt())
				.build();
	}
}