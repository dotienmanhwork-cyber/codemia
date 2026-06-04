package vn.codemia.api.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.codemia.api.dto.request.CourseRequest;
import vn.codemia.api.dto.response.CourseResponse;
import vn.codemia.api.entity.Course;

@Mapper(componentModel = "spring", uses = {SectionMapper.class})
public interface CourseMapper {

	@Mapping(target = "tags", ignore = true)
	@Mapping(target = "category", ignore = true)
	@Mapping(target = "id", ignore = true)
	Course toCourse(CourseRequest request);

	@Mapping(target = "teacherId", source = "teacher.id")
	@Mapping(target = "teacherName", expression = "java(course.getTeacher().getProfile() != null ? course.getTeacher().getProfile().getFullName() : course.getTeacher().getEmail())")
	@Mapping(target = "enrolled", ignore = true)
	CourseResponse toCourseResponse(Course course);

	@Mapping(target = "tags", ignore = true)
	@Mapping(target = "category", ignore = true)
	void updateCourse(@MappingTarget Course course, CourseRequest request);
}