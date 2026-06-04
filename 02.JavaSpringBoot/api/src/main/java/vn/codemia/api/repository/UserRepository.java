package vn.codemia.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.codemia.api.entity.User;
import vn.codemia.api.enums.Role;
import vn.codemia.api.enums.UserStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

	Optional<User> findByEmail(String email);

	boolean existsByEmail(String email);

	// --- Admin Dashboard ---
	long countByStatus(UserStatus status);

	@Query(value = "SELECT u FROM User u LEFT JOIN FETCH u.profile WHERE u.status = :status",
			countQuery = "SELECT COUNT(u) FROM User u WHERE u.status = :status")
	Page<User> findByStatusWithProfile(@Param("status") UserStatus status, Pageable pageable);

	// --- Admin Roles ---
	@Query("SELECT u FROM User u LEFT JOIN FETCH u.profile WHERE u.status = :status ORDER BY u.updatedAt DESC")
	List<User> findAllByStatusWithProfile(@Param("status") UserStatus status);

	// --- Admin Users: filter theo keyword + role, phân trang ---
	// Bỏ FETCH để tránh HibernateJpaDialect warning khi dùng Pageable
	// Page size nhỏ (10) nên lazy load profile chấp nhận được
	@Query(value = """
            SELECT u FROM User u LEFT JOIN u.profile p
            WHERE (:keyword IS NULL OR :keyword = ''
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))
            AND (:role IS NULL OR :role = '' OR u.role = :roleEnum)
            ORDER BY u.createdAt DESC
            """,
			countQuery = """
            SELECT COUNT(u) FROM User u LEFT JOIN u.profile p
            WHERE (:keyword IS NULL OR :keyword = ''
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))
            AND (:role IS NULL OR :role = '' OR u.role = :roleEnum)
            """)
	Page<User> findAllWithFilter(
			@Param("keyword") String keyword,
			@Param("role") String role,
			@Param("roleEnum") Role roleEnum,
			Pageable pageable
	);
	List<User> findByRole(Role role);
}