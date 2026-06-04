package vn.codemia.api.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.codemia.api.entity.Enrollment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, String> {

	// --- Đã có sẵn ---
	Optional<Enrollment> findByStudentIdAndCourseId(String studentId, String courseId);
	boolean existsByStudentIdAndCourseId(String studentId, String courseId);

	@Query("SELECT e FROM Enrollment e JOIN e.course c WHERE e.student.id = :studentId")
	List<Enrollment> findAllByStudentId(@Param("studentId") String studentId);

	// --- Teacher Dashboard ---
	@Query("SELECT COUNT(DISTINCT e.student.id) FROM Enrollment e WHERE e.course.teacher.id = :teacherId")
	long countDistinctStudentsByTeacherId(@Param("teacherId") String teacherId);

	@Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId")
	long countByCourseId(@Param("courseId") String courseId);

	@Query("SELECT COUNT(DISTINCT e.student.id) FROM Enrollment e " +
			"WHERE e.course.teacher.id = :teacherId " +
			"AND e.enrolledAt >= :from AND e.enrolledAt < :to")
	long countStudentsByTeacherIdAndPeriod(@Param("teacherId") String teacherId,
	                                       @Param("from") LocalDateTime from,
	                                       @Param("to") LocalDateTime to);

	@Query("SELECT e FROM Enrollment e " +
			"WHERE e.course.teacher.id = :teacherId " +
			"ORDER BY e.enrolledAt DESC")
	List<Enrollment> findRecentByTeacherId(@Param("teacherId") String teacherId,
	                                       Pageable pageable);

	// --- Teacher Students page ---

	/**
	 * Lấy tất cả enrollment của teacher, filter theo courseId + keyword (optional).
	 * LEFT JOIN profile để không mất học viên chưa có profile.
	 * Dùng khi không cần phân trang (ví dụ: export, thống kê toàn bộ).
	 */
	@Query("""
		SELECT e FROM Enrollment e
		LEFT JOIN e.student.profile p
		WHERE e.course.teacher.id = :teacherId
		AND (:courseId IS NULL OR e.course.id = :courseId)
		AND (:keyword IS NULL
		     OR LOWER(e.student.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
		     OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))
		ORDER BY e.enrolledAt DESC
	""")
	List<Enrollment> findByTeacherIdWithFilter(@Param("teacherId") String teacherId,
	                                           @Param("courseId") String courseId,
	                                           @Param("keyword") String keyword);

	/**
	 * Overload có Pageable — dùng cho API getStudentsWithFilter() để tránh load
	 * toàn bộ enrollment vào memory rồi mới filter. Giảm đáng kể N+1 queries
	 * khi số học viên lớn.
	 */
	@Query("""
		SELECT e FROM Enrollment e
		LEFT JOIN e.student.profile p
		WHERE e.course.teacher.id = :teacherId
		AND (:courseId IS NULL OR e.course.id = :courseId)
		AND (:keyword IS NULL
		     OR LOWER(e.student.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
		     OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))
		ORDER BY e.enrolledAt DESC
	""")
	List<Enrollment> findByTeacherIdWithFilter(@Param("teacherId") String teacherId,
	                                           @Param("courseId") String courseId,
	                                           @Param("keyword") String keyword,
	                                           Pageable pageable);

	// Đếm tổng học viên của teacher (cho stat cards)
	@Query("SELECT COUNT(DISTINCT e.student.id) FROM Enrollment e WHERE e.course.teacher.id = :teacherId")
	long countTotalStudentsByTeacherId(@Param("teacherId") String teacherId);

	/**
	 * Đếm học viên đã hoàn thành: số lesson đã complete = tổng lesson của course.
	 * LessonProgress join qua enrollment — dùng lp.enrollment.id = e.id.
	 */
	@Query("""
		SELECT COUNT(DISTINCT e.student.id) FROM Enrollment e
		WHERE e.course.teacher.id = :teacherId
		AND (
		    SELECT COUNT(lp) FROM LessonProgress lp
		    WHERE lp.enrollment.id = e.id
		    AND lp.isCompleted = true
		) = (
		    SELECT COUNT(l) FROM Lesson l
		    WHERE l.section.course.id = e.course.id
		)
	""")
	long countCompletedStudentsByTeacherId(@Param("teacherId") String teacherId);

	/**
	 * Đếm học viên ACTIVE: progress > 0%, chưa hoàn thành, hoạt động trong 7 ngày qua.
	 * Điều kiện: có ít nhất 1 lesson completed, chưa hoàn thành hết, có activity gần đây.
	 */
	@Query("""
		SELECT COUNT(DISTINCT e.student.id) FROM Enrollment e
		WHERE e.course.teacher.id = :teacherId
		AND (
		    SELECT COUNT(lp) FROM LessonProgress lp
		    WHERE lp.enrollment.id = e.id
		    AND lp.isCompleted = true
		) > 0
		AND (
		    SELECT COUNT(lp) FROM LessonProgress lp
		    WHERE lp.enrollment.id = e.id
		    AND lp.isCompleted = true
		) < (
		    SELECT COUNT(l) FROM Lesson l
		    WHERE l.section.course.id = e.course.id
		)
		AND (
		    SELECT MAX(lp.completedAt) FROM LessonProgress lp
		    WHERE lp.enrollment.id = e.id
		) >= :sevenDaysAgo
	""")
	long countActiveStudentsByTeacherId(@Param("teacherId") String teacherId,
	                                    @Param("sevenDaysAgo") LocalDateTime sevenDaysAgo);

	// TB tiến độ toàn bộ học viên — tính từ LessonProgress qua enrollment
	@Query("""
		SELECT COALESCE(AVG(
		    CASE
		        WHEN (SELECT COUNT(l) FROM Lesson l WHERE l.section.course.id = e.course.id) = 0 THEN 0
		        ELSE 100.0 *
		            (SELECT COUNT(lp) FROM LessonProgress lp
		             WHERE lp.enrollment.id = e.id
		             AND lp.isCompleted = true)
		            /
		            (SELECT COUNT(l) FROM Lesson l WHERE l.section.course.id = e.course.id)
		    END
		), 0)
		FROM Enrollment e
		WHERE e.course.teacher.id = :teacherId
	""")
	double findAverageProgressByTeacherId(@Param("teacherId") String teacherId);

	@Query("SELECT COUNT(e) FROM Enrollment e WHERE e.student.id = :studentId")
	long countByStudentId(@Param("studentId") String studentId);

	@Query("SELECT e FROM Enrollment e WHERE e.course.id = :courseId")
	List<Enrollment> findByCourseId(@Param("courseId") String courseId);

	@Modifying
	@Query("DELETE FROM Enrollment e WHERE e.course.id = :courseId")
	void deleteAllByCourseId(@Param("courseId") String courseId);
}