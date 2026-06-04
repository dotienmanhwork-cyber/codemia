package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.codemia.api.entity.Exercise;

import java.util.List;

public interface ExerciseRepository extends JpaRepository<Exercise, Integer> {

	List<Exercise> findByLessonId(Integer lessonId);

	@Query("""
		SELECT e FROM Exercise e
		WHERE e.lesson.section.course.teacher.id = :teacherId
		AND (:type IS NULL OR e.type = :type)
		AND (:keyword IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
		     OR LOWER(e.lesson.section.course.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
		ORDER BY e.lesson.section.course.title ASC, e.id ASC
	""")
	List<Exercise> findByTeacherIdWithFilter(
			@Param("teacherId") String teacherId,
			@Param("type") String type,
			@Param("keyword") String keyword
	);

	@Query("""
		SELECT COUNT(e) FROM Exercise e
		WHERE e.lesson.section.course.teacher.id = :teacherId
		AND (:type IS NULL OR e.type = :type)
	""")
	long countByTeacherIdAndType(
			@Param("teacherId") String teacherId,
			@Param("type") String type
	);

	@Modifying
	@Query("DELETE FROM Exercise e WHERE e.lesson.id = :lessonId")
	void deleteByLessonId(@Param("lessonId") Integer lessonId);

	@Modifying
	@Query("""
		DELETE FROM Exercise e
		WHERE e.lesson.id IN (
		    SELECT l.id FROM Lesson l
		    WHERE l.section.id IN (
		        SELECT s.id FROM Section s WHERE s.course.id = :courseId
		    )
		)
		""")
	void deleteByCourseId(@Param("courseId") String courseId);
}
