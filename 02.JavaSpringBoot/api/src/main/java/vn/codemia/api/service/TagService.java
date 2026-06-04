package vn.codemia.api.service;

import vn.codemia.api.dto.request.TagRequest;
import vn.codemia.api.dto.response.TagResponse;
import java.util.List;

public interface TagService {
	List<TagResponse> getAll();
	TagResponse getById(Integer id);
	TagResponse create(TagRequest request);
	TagResponse update(Integer id, TagRequest request);
	void delete(Integer id);
}