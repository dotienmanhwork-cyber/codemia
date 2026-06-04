package vn.codemia.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.codemia.api.entity.RefundRequest;
import vn.codemia.api.enums.RefundStatus;

import java.util.List;

public interface RefundRequestRepository extends JpaRepository<RefundRequest, String> {

	// ── Admin list với filter theo status ─────────────────────────────────
	@Query("""
		SELECT r FROM RefundRequest r
		LEFT JOIN FETCH r.student s
		LEFT JOIN FETCH s.profile
		WHERE (:status IS NULL OR r.status = :status)
		ORDER BY r.createdAt DESC
	""")
	Page<RefundRequest> findAllWithFilter(@Param("status") RefundStatus status, Pageable pageable);

	// ── Trigger khi student cập nhật bank info ────────────────────────────
	List<RefundRequest> findByStudentIdAndStatus(String studentId, RefundStatus status);

	// ── Check duplicate theo courseId (dùng cho DOWNGRADE_TEACHER — course_id còn đó)
	boolean existsByStudentIdAndCourseId(String studentId, String courseId);

	// ── Check duplicate theo orderId (dùng cho DELETE_COURSE — course_id = NULL)
	// orderId luôn có giá trị và unique theo từng giao dịch gốc
	boolean existsByStudentIdAndOrderId(String studentId, String orderId);

	// ── Stats cho Finance overview ────────────────────────────────────────
	long countByStatus(RefundStatus status);

	@Modifying
	@Query("UPDATE RefundRequest r SET r.course = null WHERE r.course.id = :courseId")
	void nullifyCourseReference(@Param("courseId") String courseId);
}