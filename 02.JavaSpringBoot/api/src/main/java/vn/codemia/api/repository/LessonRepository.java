package vn.codemia.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.codemia.api.entity.Lesson;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Integer> {

	// Lấy bài học trong 1 chương, sắp xếp thứ tự
	List<Lesson> findBySectionIdOrderByOrderIndexAsc(Integer sectionId);

	// Tìm lesson có video_url nhưng chưa có transcript — dùng cho startup runner
	List<Lesson> findByVideoUrlIsNotNullAndTranscriptIsNull();
	List<Lesson> findByTranscriptIsNotNullAndAiSummaryCacheIsNull();

	// Đếm tổng số lesson theo courseId (đi qua Lesson → Section → Course)
	@Query("SELECT COUNT(l) FROM Lesson l WHERE l.section.course.id = :courseId")
	long countByCourseId(@Param("courseId") String courseId);
	@Modifying
	@Query("DELETE FROM Lesson l WHERE l.id = :id")
	void deleteLesson(@Param("id") Integer id);

	/** Cập nhật orderIndex của 1 lesson — dùng khi reorder hàng loạt */
	@Modifying
	@Query("UPDATE Lesson l SET l.orderIndex = :orderIndex WHERE l.id = :id")
	void updateOrderIndex(@Param("id") Integer id, @Param("orderIndex") Integer orderIndex);

	@Modifying
	@Query("DELETE FROM Lesson l WHERE l.section.id IN " +
			"(SELECT s.id FROM Section s WHERE s.course.id = :courseId)")
	void deleteByCourseId(@Param("courseId") String courseId);

	// ── AI Admin: cache summary ──────────────────────────────────────────

	/** Lấy toàn bộ lessons của 1 course kèm section + course (tránh N+1). */
	@Query(value = """
		SELECT l FROM Lesson l
		JOIN FETCH l.section s
		JOIN FETCH s.course c
		WHERE c.id = :courseId
		ORDER BY s.orderIndex, l.orderIndex
	""", countQuery = """
		SELECT COUNT(l) FROM Lesson l
		WHERE l.section.course.id = :courseId
	""")
	Page<Lesson> findAllByCourseId(@Param("courseId") String courseId, Pageable pageable);

	@Query("""
		SELECT l FROM Lesson l
		JOIN FETCH l.section s
		JOIN FETCH s.course c
		WHERE c.id = :courseId
		ORDER BY s.orderIndex, l.orderIndex
	""")
	List<Lesson> findAllByCourseId(@Param("courseId") String courseId);

	/** Lấy toàn bộ lessons (tất cả courses) kèm section + course (tránh N+1). */
	@Query(value = """
		SELECT l FROM Lesson l
		JOIN FETCH l.section s
		JOIN FETCH s.course c
		ORDER BY c.title, s.orderIndex, l.orderIndex
	""", countQuery = """
		SELECT COUNT(l) FROM Lesson l
	""")
	Page<Lesson> findAllWithCourseInfo(Pageable pageable);
}
