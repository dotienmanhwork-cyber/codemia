package vn.codemia.api.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.codemia.api.dto.request.LessonRequest;
import vn.codemia.api.dto.response.LessonResponse;
import vn.codemia.api.entity.Lesson;

@Mapper(componentModel = "spring")
public interface LessonMapper {

	@Mapping(target = "section",             ignore = true)
	@Mapping(target = "id",                  ignore = true)
	@Mapping(target = "aiSummaryCache",      ignore = true)
	@Mapping(target = "transcript",          ignore = true)
	@Mapping(target = "transcriptPulledAt",  ignore = true)
	@Mapping(target = "duration",            ignore = true) // tự động fetch từ YouTube/Vimeo
	Lesson toLesson(LessonRequest request);

	@Mapping(target = "sectionId", source = "section.id")
	LessonResponse toLessonResponse(Lesson lesson);

	@Mapping(target = "section",             ignore = true)
	@Mapping(target = "id",                  ignore = true)
	@Mapping(target = "aiSummaryCache",      ignore = true)
	@Mapping(target = "transcript",          ignore = true)
	@Mapping(target = "transcriptPulledAt",  ignore = true)
	@Mapping(target = "duration",            ignore = true) // không cho teacher ghi đè
	void updateLesson(@MappingTarget Lesson lesson, LessonRequest request);
}