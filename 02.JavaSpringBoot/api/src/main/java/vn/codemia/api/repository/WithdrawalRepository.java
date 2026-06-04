package vn.codemia.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.codemia.api.entity.Withdrawal;
import vn.codemia.api.entity.Withdrawal.WithdrawalStatus;

import java.util.List;

public interface WithdrawalRepository extends JpaRepository<Withdrawal, Integer> {

	// Lịch sử rút tiền của 1 teacher, mới nhất trước
	List<Withdrawal> findByTeacherIdOrderByCreatedAtDesc(String teacherId);

	// Tất cả request cho admin — filter theo status nếu có
	@Query("""
        SELECT w FROM Withdrawal w
        JOIN FETCH w.teacher t
        LEFT JOIN FETCH t.profile
        WHERE (:status IS NULL OR w.status = :status)
        ORDER BY w.createdAt DESC
    """)
	List<Withdrawal> findAllWithFilter(@Param("status") WithdrawalStatus status);

	// Phân trang — dùng cho admin list
	@Query(value = """
        SELECT w FROM Withdrawal w
        JOIN FETCH w.teacher t
        LEFT JOIN FETCH t.profile
        WHERE (:status IS NULL OR w.status = :status)
        ORDER BY w.createdAt DESC
    """,
			countQuery = """
        SELECT COUNT(w) FROM Withdrawal w
        WHERE (:status IS NULL OR w.status = :status)
    """)
	Page<Withdrawal> findAllWithFilter(@Param("status") WithdrawalStatus status, Pageable pageable);

	// Tổng tiền đã được APPROVED của 1 teacher — dùng để tính availableBalance
	@Query("""
        SELECT COALESCE(SUM(w.amount), 0)
        FROM Withdrawal w
        WHERE w.teacher.id = :teacherId
        AND w.status = vn.codemia.api.entity.Withdrawal.WithdrawalStatus.APPROVED
    """)
	double sumApprovedByTeacherId(@Param("teacherId") String teacherId);

	@Query("""
        SELECT COALESCE(SUM(w.amount), 0)
        FROM Withdrawal w
        WHERE w.teacher.id = :teacherId
        AND w.status IN (
            vn.codemia.api.entity.Withdrawal.WithdrawalStatus.HOLD,
            vn.codemia.api.entity.Withdrawal.WithdrawalStatus.PENDING
        )
    """)
	double sumFrozenByTeacherId(@Param("teacherId") String teacherId);

	// Kiểm tra teacher có request PENDING không — tránh spam request
	boolean existsByTeacherIdAndStatus(String teacherId, WithdrawalStatus status);

	// ── Role Downgrade / Course Delete ───────────────────────────────────────

	// Tìm withdrawal theo teacher + status — dùng khi hạ role hoặc xóa course
	List<Withdrawal> findByTeacherIdAndStatus(String teacherId, WithdrawalStatus status);

	// ── Bank Info Updated ─────────────────────────────────────────────────────

	// HOLD records chưa có bankSnapshot — tức là bị HOLD do hạ role khi chưa có bank.
	// Khi teacher cập nhật bank info, chỉ unblock đúng nhóm này, không đụng tới
	// HOLD do course bị xóa (bankSnapshot đã có sẵn khi tạo).
	List<Withdrawal> findByTeacherIdAndStatusAndBankSnapshotIsNull(
			String teacherId, WithdrawalStatus status);
}