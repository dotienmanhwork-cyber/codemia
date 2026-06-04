package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.codemia.api.entity.Section;

import java.util.List;

@Repository
public interface SectionRepository extends JpaRepository<Section, Integer> {

	List<Section> findByCourseIdOrderByOrderIndexAsc(String courseId);
	List<Section> findByCourseIdOrderByOrderIndex(String courseId);

	// ✅ MỚI — dùng để validate trước khi Teacher submit course
	long countByCourseId(String courseId);

	@Query("""
		SELECT COUNT(l)
		FROM Lesson l
		JOIN l.section s
		WHERE s.course.id = :courseId
	""")
	long countLessonsByCourseId(@Param("courseId") String courseId);

	@Modifying
	@Query("DELETE FROM Section s WHERE s.course.id = :courseId")
	void deleteAllByCourseId(@Param("courseId") String courseId);
}
