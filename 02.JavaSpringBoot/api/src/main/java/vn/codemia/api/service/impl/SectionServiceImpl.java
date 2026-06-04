package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.dto.request.SectionRequest;
import vn.codemia.api.dto.request.SectionReorderRequest;
import vn.codemia.api.dto.response.SectionResponse;
import vn.codemia.api.entity.Course;
import vn.codemia.api.entity.Section;
import vn.codemia.api.entity.User;
import vn.codemia.api.enums.Role;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.mapper.SectionMapper;
import vn.codemia.api.repository.CourseRepository;
import vn.codemia.api.repository.SectionRepository;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.service.NotificationService;
import vn.codemia.api.service.SectionService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SectionServiceImpl implements SectionService {

	private final SectionRepository  sectionRepository;
	private final CourseRepository   courseRepository;
	private final UserRepository     userRepository;
	private final SectionMapper      sectionMapper;
	private final NotificationService notificationService;

	// ─── Helper ───────────────────────────────────────────────────────────────
	private User getCurrentUser() {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
	}

	private void checkCourseOwnership(Course course, User currentUser) {
		boolean isAdmin = currentUser.getRole() == Role.ADMIN;
		boolean isOwner = course.getTeacher().getId().equals(currentUser.getId());
		if (!isOwner && !isAdmin) {
			throw new AppException(ErrorCode.FORBIDDEN);
		}
	}

	@Override
	@Transactional
	public SectionResponse create(SectionRequest request) {
		var course = courseRepository.findById(request.getCourseId())
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		checkCourseOwnership(course, getCurrentUser());

		Section section = sectionMapper.toSection(request);
		section.setCourse(course);

		SectionResponse response =
				sectionMapper.toSectionResponse(sectionRepository.save(section));

		// THÊM MỚI: Notify enrolled students
		notificationService.notifyEnrolledStudents(
				course.getId(),
				"Chương mới: " + section.getTitle(),
				"Khóa học \"" + course.getTitle() + "\" vừa được thêm chương mới: \""
						+ section.getTitle() + "\"."
		);

		return response;
	}

	@Override
	@Transactional
	public SectionResponse update(Integer id, SectionRequest request) {
		Section section = sectionRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

		checkCourseOwnership(section.getCourse(), getCurrentUser());

		sectionMapper.updateSection(section, request);

		if (!section.getCourse().getId().equals(request.getCourseId())) {
			var newCourse = courseRepository.findById(request.getCourseId())
					.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
			checkCourseOwnership(newCourse, getCurrentUser());
			section.setCourse(newCourse);
		}

		return sectionMapper.toSectionResponse(sectionRepository.save(section));
	}

	@Override
	@Transactional
	public void delete(Integer id) {
		Section section = sectionRepository.findById(id)
				.orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

		checkCourseOwnership(section.getCourse(), getCurrentUser());

		// Lấy thông tin TRƯỚC khi xóa — sau khi xóa entity không còn accessible
		String courseId     = section.getCourse().getId();
		String courseTitle  = section.getCourse().getTitle();
		String sectionTitle = section.getTitle();

		sectionRepository.deleteById(id);

		// THÊM MỚI: Notify enrolled students
		notificationService.notifyEnrolledStudents(
				courseId,
				"Chương đã bị xoá",
				"Khóa học \"" + courseTitle + "\" vừa xoá chương: \""
						+ sectionTitle + "\"."
		);
	}

	@Override
	public List<SectionResponse> getByCourseId(String courseId) {
		return sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId)
				.stream()
				.map(sectionMapper::toSectionResponse)
				.collect(Collectors.toList());
	}

	// ─── Reorder ──────────────────────────────────────────────────────────────
	@Override
	@Transactional
	public void reorder(SectionReorderRequest request) {
		User currentUser = getCurrentUser();

		request.getSections().forEach(item -> {
			Section section = sectionRepository.findById(item.getId())
					.orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

			// ✅ Ownership check — mỗi section phải thuộc về teacher hiện tại
			checkCourseOwnership(section.getCourse(), currentUser);

			section.setOrderIndex(item.getOrderIndex());
			sectionRepository.save(section);
		});
	}
}