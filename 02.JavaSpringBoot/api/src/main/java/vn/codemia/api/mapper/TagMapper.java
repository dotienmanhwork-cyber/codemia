package vn.codemia.api.mapper;

import org.springframework.stereotype.Component;
import vn.codemia.api.dto.response.TagResponse;
import vn.codemia.api.entity.Tag;

@Component
public class TagMapper {
	public TagResponse toTagResponse(Tag tag) {
		if (tag == null) return null;

		return TagResponse.builder()
				.id(tag.getId())
				.name(tag.getName())
				.slug(tag.getSlug())
				.build();
	}
}