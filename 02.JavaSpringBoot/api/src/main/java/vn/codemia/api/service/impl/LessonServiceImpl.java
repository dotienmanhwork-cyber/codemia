package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import vn.codemia.api.dto.request.LessonReorderRequest;
import vn.codemia.api.dto.request.LessonRequest;
import vn.codemia.api.dto.response.LessonResponse;
import vn.codemia.api.entity.Lesson;
import vn.codemia.api.entity.Section;
import vn.codemia.api.entity.User;
import vn.codemia.api.enums.Role;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.mapper.LessonMapper;
import vn.codemia.api.repository.ExerciseRepository;
import vn.codemia.api.repository.LessonProgressRepository;
import vn.codemia.api.repository.LessonRepository;
import vn.codemia.api.repository.SectionRepository;
import vn.codemia.api.repository.SubmissionRepository;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.service.AiService;
import vn.codemia.api.service.LessonService;
import vn.codemia.api.service.NotificationService;
import vn.codemia.api.service.TranscriptService;
import vn.codemia.api.service.VideoDurationService;  // << thêm

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonServiceImpl implements LessonService {

	private final LessonRepository         lessonRepository;
	private final SectionRepository        sectionRepository;
	private final UserRepository           userRepository;
	private final LessonMapper             lessonMapper;
	private final TranscriptService        transcriptService;
	private final AiService                aiService;
	private final VideoDurationService     videoDurationService;  // << thêm
	private final LessonProgressRepository lessonProgressRepository;
	private final ExerciseRepository       exerciseRepository;
	private final SubmissionRepository     submissionRepository;
	private final NotificationService      notificationService;

	// ─── Helper ───────────────────────────────────────────────────────────────
	private User getCurrentUser() {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
	}

	private void checkSectionOwnership(Section section, User currentUser) {
		boolean isAdmin = currentUser.getRole() == Role.ADMIN;
		boolean isOwner = section.getCourse().getTeacher().getId().equals(currentUser.getId());
		if (!isOwner && !isAdmin) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}
	}

	@Override
	@Transactional
	public LessonResponse create(LessonRequest request) {
		var section = sectionRepository.findById(request.getSectionId())
				.orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

		checkSectionOwnership(section, getCurrentUser());

		Lesson lesson = lessonMapper.toLesson(request);
		lesson.setSection(section);

		Lesson saved = lessonRepository.save(lesson);

		triggerAsyncProcessing(saved);

		// THÊM MỚI: Notify enrolled students
		String courseId    = section.getCourse().getId();
		String courseTitle = section.getCourse().getTitle();
		notificationService.notifyEnrolledStudents(
				courseId,
				"Bài học mới: " + saved.getTitle(),
				"Khóa học \"" + courseTitle + "\" vừa được thêm bài học mới: \""
						+ saved.getTitle() + "\"."
		);

		return lessonMapper.toLessonResponse(saved);
	}

	@Override
	@Transactional
	public LessonResponse update(Integer id, LessonRequest request) {
		Lesson lesson = lessonRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

		checkSectionOwnership(lesson.getSection(), getCurrentUser());

		String oldVideoUrl = lesson.getVideoUrl();
		lessonMapper.updateLesson(lesson, request);

		if (!lesson.getSection().getId().equals(request.getSectionId())) {
			var newSection = sectionRepository.findById(request.getSectionId())
					.orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));
			checkSectionOwnership(newSection, getCurrentUser());
			lesson.setSection(newSection);
		}

		Lesson saved = lessonRepository.save(lesson);

		String newVideoUrl = request.getVideoUrl();
		if (newVideoUrl != null && !newVideoUrl.isBlank() && !newVideoUrl.equals(oldVideoUrl)) {
			triggerAsyncProcessing(saved);
		}

		return lessonMapper.toLessonResponse(saved);
	}

	@Override
	@Transactional
	public void delete(Integer id) {
		Lesson lesson = lessonRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));

		checkSectionOwnership(lesson.getSection(), getCurrentUser());

		// Lấy thông tin TRƯỚC khi xóa — sau khi xóa entity không còn accessible
		String courseId    = lesson.getSection().getCourse().getId();
		String courseTitle = lesson.getSection().getCourse().getTitle();
		String lessonTitle = lesson.getTitle();

		lessonRepository.deleteLesson(id);

		// THÊM MỚI: Notify enrolled students
		notificationService.notifyEnrolledStudents(
				courseId,
				"Bài học đã bị xoá",
				"Khóa học \"" + courseTitle + "\" vừa xoá bài học: \""
						+ lessonTitle + "\"."
		);
	}

	@Override
	public List<LessonResponse> getBySectionId(Integer sectionId) {
		return lessonRepository.findBySectionIdOrderByOrderIndexAsc(sectionId)
				.stream()
				.map(lessonMapper::toLessonResponse)
				.collect(Collectors.toList());
	}

	@Override
	@Transactional
	public void reorder(LessonReorderRequest request) {
		request.getLessons().forEach(item ->
				lessonRepository.updateOrderIndex(item.getId(), item.getOrderIndex())
		);
	}

	// ─── Helper: chạy async sau khi transaction commit ────────────────────────
	// Thứ tự: duration trước (nhanh, ~200ms) → transcript → AI summary
	private void triggerAsyncProcessing(Lesson lesson) {
		if (lesson.getVideoUrl() == null || lesson.getVideoUrl().isBlank()) return;

		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				CompletableFuture.runAsync(() -> {
					try {
						// 1. Pull transcript (save entity gốc → phải chạy trước)
						transcriptService.pullAndSaveTranscript(lesson);
						log.info("[Transcript] Auto pulled for lessonId={}", lesson.getId());

						// 2. Sinh AI summary ngay sau khi có transcript
						aiService.summarizeLesson(lesson.getId());
						log.info("[AI] Auto summarized for lessonId={}", lesson.getId());
					} catch (Exception e) {
						log.warn("[Transcript/AI] Auto process failed for lessonId={}: {}", lesson.getId(), e.getMessage());
					}

					try {
						// 3. Duration fetch CUỐI CÙNG — re-fetch entity từ DB nên không bị transcript đè
						videoDurationService.fetchAndSaveDuration(lesson);
						log.info("[Duration] Auto fetched for lessonId={}", lesson.getId());
					} catch (Exception e) {
						log.warn("[Duration] Auto fetch failed for lessonId={}: {}", lesson.getId(), e.getMessage());
					}
				});
			}
		});
	}
}