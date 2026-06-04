package vn.codemia.api.service;

import vn.codemia.api.dto.request.LessonReorderRequest;
import vn.codemia.api.dto.request.LessonRequest;
import vn.codemia.api.dto.response.LessonResponse;

import java.util.List;

public interface LessonService {
	LessonResponse create(LessonRequest request);
	LessonResponse update(Integer id, LessonRequest request);
	void delete(Integer id);
	List<LessonResponse> getBySectionId(Integer sectionId);
	void reorder(LessonReorderRequest request);
}