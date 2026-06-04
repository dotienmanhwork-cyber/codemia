package vn.codemia.api.service;

import vn.codemia.api.dto.request.CourseRequest;
import vn.codemia.api.dto.response.CourseResponse;

import java.util.List;

public interface CourseService {
	CourseResponse create(CourseRequest request);
	CourseResponse getById(String id);
	CourseResponse getBySlug(String slug);
	List<CourseResponse> getAll();
	CourseResponse update(String id, CourseRequest request);
	CourseResponse updateStatus(String id, String status);
	void delete(String id);

	// ✅ MỚI — Teacher submit course lên PENDING để Admin review
	void submitCourse(String courseId);
	void cancelPendingCourse(String courseId);
	void unpublishCourse(String courseId);
	void republishCourse(String courseId);
}