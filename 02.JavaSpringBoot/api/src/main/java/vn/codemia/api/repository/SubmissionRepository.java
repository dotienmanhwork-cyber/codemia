package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.codemia.api.entity.Submission;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, String> {

	// ── Query cũ (GIỮ NGUYÊN) ────────────────────────────────────────────

	@Query("""
        SELECT COUNT(s) FROM Submission s
        WHERE s.student.id = :studentId
        AND s.exercise.lesson.section.course.id = :courseId
    """)
	long countByStudentIdAndCourseId(@Param("studentId") String studentId,
	                                 @Param("courseId") String courseId);

	@Query("SELECT COUNT(s) FROM Submission s WHERE s.exercise.id = :exerciseId")
	long countByExerciseId(@Param("exerciseId") Integer exerciseId);

	@Query("""
        SELECT COUNT(s) FROM Submission s
        WHERE s.exercise.lesson.section.course.teacher.id = :teacherId
    """)
	long countTotalSubmissionsByTeacherId(@Param("teacherId") String teacherId);

	@Modifying
	@Query("DELETE FROM Submission s WHERE s.exercise.id = :exerciseId")
	void deleteByExerciseId(@Param("exerciseId") Integer exerciseId);

	@Modifying
	@Query("""
		DELETE FROM Submission sub
		WHERE sub.exercise.id IN (
		    SELECT e.id FROM Exercise e
		    WHERE e.lesson.id IN (
		        SELECT l.id FROM Lesson l
		        WHERE l.section.id IN (
		            SELECT s.id FROM Section s WHERE s.course.id = :courseId
		        )
		    )
		)
		""")
	void deleteByCourseId(@Param("courseId") String courseId);

	// ── Query mới cho submit flow ─────────────────────────────────────────

	/** Đếm số lần đã nộp → dùng để tính attemptNumber kế tiếp */
	@Query("SELECT COUNT(s) FROM Submission s WHERE s.student.id = :studentId AND s.exercise.id = :exerciseId")
	int countByStudentIdAndExerciseId(@Param("studentId") String studentId,
	                                  @Param("exerciseId") Integer exerciseId);

	/** Lịch sử nộp bài của học viên cho 1 exercise, mới nhất trước */
	List<Submission> findByStudentIdAndExerciseIdOrderByCreatedAtDesc(String studentId, Integer exerciseId);
}
