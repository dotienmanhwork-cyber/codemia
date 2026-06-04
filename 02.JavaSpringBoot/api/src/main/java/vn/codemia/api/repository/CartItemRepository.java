package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.codemia.api.entity.CartItem;

import java.util.List;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {

	// ── Giữ nguyên method cũ — OrderServiceImpl đang dùng ────────
	List<CartItem> findByUserIdOrderByCreatedAtDesc(String userId);

	// ── Method mới có JOIN FETCH — CartItemServiceImpl dùng ───────
	// Load course + teacher trong 1 query, tránh N+1
	@Query("""
		SELECT ci FROM CartItem ci
		JOIN FETCH ci.course co
		LEFT JOIN FETCH co.teacher
		WHERE ci.user.id = :userId
		ORDER BY ci.createdAt DESC
	""")
	List<CartItem> findByUserIdWithDetails(@Param("userId") String userId);

	// ── Kiểm tra khoá học đã có trong giỏ hàng chưa ──────────────
	boolean existsByUserIdAndCourseId(String userId, String courseId);

	// ── Xóa sạch giỏ hàng sau khi thanh toán ─────────────────────
	@Modifying
	@Query("DELETE FROM CartItem c WHERE c.user.id = :userId")
	void deleteByUserId(@Param("userId") String userId);

	@Modifying
	@Query("DELETE FROM CartItem ci WHERE ci.course.id = :courseId")
	void deleteByCourseId(@Param("courseId") String courseId);
}
