package vn.codemia.api.service;

import vn.codemia.api.dto.request.SectionRequest;
import vn.codemia.api.dto.request.SectionReorderRequest;
import vn.codemia.api.dto.response.SectionResponse;

import java.util.List;

public interface SectionService {
	SectionResponse create(SectionRequest request);
	SectionResponse update(Integer id, SectionRequest request);
	void delete(Integer id);
	List<SectionResponse> getByCourseId(String courseId);
	void reorder(SectionReorderRequest request); // ← thêm mới
}