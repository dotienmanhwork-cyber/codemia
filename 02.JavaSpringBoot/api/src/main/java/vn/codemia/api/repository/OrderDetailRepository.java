package vn.codemia.api.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.codemia.api.entity.OrderDetail;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {

	// --- Đã có sẵn ---

	@Query("SELECT COALESCE(SUM(od.priceAtPurchase), 0) FROM OrderDetail od " +
			"JOIN od.order o " +
			"WHERE od.course.teacher.id = :teacherId " +
			"AND o.status = vn.codemia.api.enums.OrderStatus.SUCCESS " +
			"AND o.createdAt >= :from AND o.createdAt < :to")
	double sumRevenueByTeacherIdAndPeriod(@Param("teacherId") String teacherId,
	                                      @Param("from") LocalDateTime from,
	                                      @Param("to") LocalDateTime to);

	@Query("SELECT COALESCE(SUM(od.priceAtPurchase), 0) FROM OrderDetail od " +
			"JOIN od.order o " +
			"WHERE od.course.id = :courseId " +
			"AND o.status = vn.codemia.api.enums.OrderStatus.SUCCESS")
	double sumRevenueByCourseId(@Param("courseId") String courseId);

	@Query("SELECT od FROM OrderDetail od " +
			"JOIN od.order o " +
			"WHERE od.course.teacher.id = :teacherId " +
			"AND o.status = vn.codemia.api.enums.OrderStatus.SUCCESS " +
			"ORDER BY o.createdAt DESC")
	List<OrderDetail> findRecentByTeacherId(@Param("teacherId") String teacherId,
	                                        Pageable pageable);

	// --- Teacher Finance ---

	/**
	 * FIX: dùng od.teacher.id thay vì od.course.teacher.id.
	 * Sau khi Admin xóa course, nullifyCourseReference() SET od.course = NULL,
	 * khiến INNER JOIN qua od.course bỏ sót các rows đó → totalRevenue bị undercount.
	 * od.teacher là snapshot tại thời điểm mua, không bị ảnh hưởng khi course bị xóa.
	 */
	@Query("""
		SELECT COALESCE(SUM(od.priceAtPurchase), 0)
		FROM OrderDetail od
		JOIN od.order o
		WHERE (od.teacher.id = :teacherId OR (od.teacher.id IS NULL AND od.course.teacher.id = :teacherId))
		AND o.status = vn.codemia.api.enums.OrderStatus.SUCCESS
	""")
	double sumTotalRevenueByTeacherId(@Param("teacherId") String teacherId);

	/**
	 * FIX: dùng od.teacher.id thay vì od.course.teacher.id — cùng lý do trên.
	 * Đây là query trực tiếp ảnh hưởng đến currentBalance hiển thị trên UI teacher
	 * và logic tính holdAmount trong deleteAdminCourse / downgradeUserRole.
	 */
	@Query("""
		SELECT COALESCE(SUM(od.teacherEarnings), 0)
		FROM OrderDetail od
		JOIN od.order o
		WHERE (od.teacher.id = :teacherId OR (od.teacher.id IS NULL AND od.course.teacher.id = :teacherId))
		AND o.status = vn.codemia.api.enums.OrderStatus.SUCCESS
	""")
	double sumTotalEarningsByTeacherId(@Param("teacherId") String teacherId);

	@Query("""
		SELECT FUNCTION('DATE_FORMAT', o.createdAt, '%Y-%m') AS month,
		       COALESCE(SUM(od.priceAtPurchase), 0) AS revenue
		FROM OrderDetail od
		JOIN od.order o
		WHERE od.course.teacher.id = :teacherId
		AND o.status = vn.codemia.api.enums.OrderStatus.SUCCESS
		AND o.createdAt >= :from
		GROUP BY FUNCTION('DATE_FORMAT', o.createdAt, '%Y-%m')
		ORDER BY month ASC
	""")
	List<Object[]> findMonthlyRevenueByTeacherId(@Param("teacherId") String teacherId,
	                                             @Param("from") LocalDateTime from);

	@Query("""
		SELECT od.course.id, od.course.title, COALESCE(SUM(od.priceAtPurchase), 0)
		FROM OrderDetail od
		JOIN od.order o
		WHERE od.course.teacher.id = :teacherId
		AND o.status = vn.codemia.api.enums.OrderStatus.SUCCESS
		GROUP BY od.course.id, od.course.title
		ORDER BY SUM(od.priceAtPurchase) DESC
	""")
	List<Object[]> findRevenueGroupedByCourse(@Param("teacherId") String teacherId);

	@Query("""
		SELECT od FROM OrderDetail od
		JOIN od.order o
		WHERE od.course.teacher.id = :teacherId
		AND o.status = vn.codemia.api.enums.OrderStatus.SUCCESS
		AND (:keyword IS NULL
		     OR LOWER(od.course.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
		     OR LOWER(o.user.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
		     OR LOWER(o.user.profile.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))
		ORDER BY o.createdAt DESC
	""")
	List<OrderDetail> findTransactionsByTeacherIdWithFilter(@Param("teacherId") String teacherId,
	                                                        @Param("keyword") String keyword,
	                                                        Pageable pageable);

	@Query("""
		SELECT COUNT(od) FROM OrderDetail od
		JOIN od.order o
		WHERE od.course.teacher.id = :teacherId
		AND o.status = vn.codemia.api.enums.OrderStatus.SUCCESS
		AND (:keyword IS NULL
		     OR LOWER(od.course.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
		     OR LOWER(o.user.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
		     OR LOWER(o.user.profile.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))
	""")
	long countTransactionsByTeacherIdWithFilter(@Param("teacherId") String teacherId,
	                                            @Param("keyword") String keyword);

	// --- Admin Finance ---

	@Query("""
		SELECT COALESCE(SUM(od.priceAtPurchase), 0)
		FROM OrderDetail od
		JOIN od.order o
		WHERE o.status = vn.codemia.api.enums.OrderStatus.SUCCESS
		AND o.createdAt >= :from
		AND o.createdAt < :to
	""")
	double sumTotalRevenueByPeriod(@Param("from") LocalDateTime from,
	                               @Param("to") LocalDateTime to);

	@Query("""
		SELECT COALESCE(SUM(od.teacherEarnings), 0)
		FROM OrderDetail od
		JOIN od.order o
		WHERE o.status = vn.codemia.api.enums.OrderStatus.SUCCESS
		AND o.createdAt >= :from
		AND o.createdAt < :to
	""")
	double sumTotalPayoutsByPeriod(@Param("from") LocalDateTime from,
	                               @Param("to") LocalDateTime to);

	@Query("""
		SELECT COUNT(od)
		FROM OrderDetail od
		JOIN od.order o
		WHERE o.status = vn.codemia.api.enums.OrderStatus.SUCCESS
		AND o.createdAt >= :from
		AND o.createdAt < :to
	""")
	long countTransactionsByPeriod(@Param("from") LocalDateTime from,
	                               @Param("to") LocalDateTime to);

	@Query("""
		SELECT FUNCTION('DATE_FORMAT', o.createdAt, '%Y-%m') AS month,
		       COALESCE(SUM(od.priceAtPurchase), 0)          AS revenue,
		       COALESCE(SUM(od.teacherEarnings), 0)          AS payouts,
		       COUNT(od)                                     AS transactions
		FROM OrderDetail od
		JOIN od.order o
		WHERE o.status = vn.codemia.api.enums.OrderStatus.SUCCESS
		AND o.createdAt >= :from
		GROUP BY FUNCTION('DATE_FORMAT', o.createdAt, '%Y-%m')
		ORDER BY month ASC
	""")
	List<Object[]> findMonthlyBreakdown(@Param("from") LocalDateTime from);

	@Query("""
		SELECT t.id,
		       p.fullName,
		       COUNT(DISTINCT od.course.id),
		       COUNT(DISTINCT o.user.id),
		       COALESCE(SUM(od.priceAtPurchase), 0),
		       COALESCE(SUM(od.teacherEarnings), 0)
		FROM OrderDetail od
		JOIN od.order o
		JOIN od.course.teacher t
		LEFT JOIN t.profile p
		WHERE o.status = vn.codemia.api.enums.OrderStatus.SUCCESS
		AND o.createdAt >= :from
		AND o.createdAt < :to
		GROUP BY t.id, p.fullName
		ORDER BY SUM(od.priceAtPurchase) DESC
	""")
	List<Object[]> findTeacherPayoutsByPeriod(@Param("from") LocalDateTime from,
	                                          @Param("to") LocalDateTime to);

	// ── Phase 2: Refund ───────────────────────────────────────────────────────

	@Query("""
		SELECT od FROM OrderDetail od
		JOIN od.order o
		WHERE od.course.id = :courseId
		  AND o.user.id    = :studentId
		  AND o.status     = vn.codemia.api.enums.OrderStatus.SUCCESS
	""")
	Optional<OrderDetail> findSuccessByCourseIdAndStudentId(
			@Param("courseId")  String courseId,
			@Param("studentId") String studentId
	);

	@Query("""
		SELECT COALESCE(SUM(od.teacherEarnings), 0)
		FROM OrderDetail od
		JOIN od.order o
		WHERE od.course.id = :courseId
		  AND o.status     = vn.codemia.api.enums.OrderStatus.SUCCESS
	""")
	double sumEarningsByCourseId(@Param("courseId") String courseId);

	@Modifying
	@Query("UPDATE OrderDetail od SET od.course = null WHERE od.course.id = :courseId")
	void nullifyCourseReference(@Param("courseId") String courseId);
	@Query("""
		SELECT COALESCE(SUM(od.teacherEarnings), 0)
		FROM OrderDetail od
		JOIN od.order o
		WHERE od.course.teacher.id = :teacherId
		AND o.status = vn.codemia.api.enums.OrderStatus.SUCCESS
	""")
	double sumTeacherEarningsByTeacherId(@Param("teacherId") String teacherId);
}