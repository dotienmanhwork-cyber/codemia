package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.codemia.api.entity.LessonProgress;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, String> {

	List<LessonProgress> findAllByEnrollmentId(String enrollmentId);

	Optional<LessonProgress> findByEnrollmentIdAndLessonId(String enrollmentId, Integer lessonId);

	@Query("SELECT COUNT(lp) FROM LessonProgress lp " +
			"WHERE lp.enrollment.student.id = :studentId " +
			"AND lp.enrollment.course.id = :courseId " +
			"AND lp.completedAt IS NOT NULL")
	long countCompletedLessonsByStudentAndCourse(@Param("studentId") String studentId,
	                                             @Param("courseId") String courseId);

	@Query("SELECT MAX(lp.completedAt) FROM LessonProgress lp " +
			"WHERE lp.enrollment.student.id = :studentId " +
			"AND lp.enrollment.course.id = :courseId")
	Optional<LocalDateTime> findLastActivAtByStudentAndCourse(@Param("studentId") String studentId,
	                                                          @Param("courseId") String courseId);

	@Modifying
	@Query("DELETE FROM LessonProgress lp WHERE lp.lesson.id = :lessonId")
	void deleteByLessonId(@Param("lessonId") Integer lessonId);

	@Modifying
	@Query("""
		DELETE FROM LessonProgress lp
		WHERE lp.lesson.id IN (
		    SELECT l.id FROM Lesson l
		    WHERE l.section.id IN (
		        SELECT s.id FROM Section s WHERE s.course.id = :courseId
		    )
		)
		""")
	void deleteByCourseId(@Param("courseId") String courseId);
}
