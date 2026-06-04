package vn.codemia.api.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.codemia.api.dto.request.SectionRequest;
import vn.codemia.api.dto.response.SectionResponse;
import vn.codemia.api.entity.Section;

@Mapper(componentModel = "spring", uses = {LessonMapper.class})
public interface SectionMapper {

	// Bỏ qua course_id khi map vào entity, ta sẽ set thủ công ở Service
	@Mapping(target = "course", ignore = true)
	@Mapping(target = "id", ignore = true)
	Section toSection(SectionRequest request);

	// Trích xuất id từ object Course để gán vào biến courseId của Response
	@Mapping(target = "courseId", source = "course.id")
	SectionResponse toSectionResponse(Section section);

	@Mapping(target = "course", ignore = true)
	void updateSection(@MappingTarget Section section, SectionRequest request);
}