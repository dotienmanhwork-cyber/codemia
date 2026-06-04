package vn.codemia.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.codemia.api.entity.Category;
import vn.codemia.api.entity.Course;
import vn.codemia.api.entity.Enrollment;
import vn.codemia.api.enums.CourseStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {

	// --- Đã có sẵn ---
	Optional<Course> findBySlug(String slug);
	boolean existsBySlug(String slug);
	List<Course> findAllByStatus(CourseStatus status);

	// --- Teacher Dashboard ---
	List<Course> findAllByTeacherId(String teacherId);
	long countByTeacherId(String teacherId);
	long countByTeacherIdAndStatus(String teacherId, CourseStatus status);

	// --- Teacher Courses page: filter theo status và/hoặc keyword ---
	@Query("""
	    SELECT c FROM Course c
	    WHERE c.teacher.id = :teacherId
	    AND (:status IS NULL OR c.status = :status)
	    AND (:keyword IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
	    ORDER BY c.createdAt DESC
	""")
	List<Course> findByTeacherIdWithFilter(
			@Param("teacherId") String teacherId,
			@Param("status")    CourseStatus status,
			@Param("keyword")   String keyword
	);

	@Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.course.teacher.id = :teacherId")
	double findAverageRatingByTeacherId(@Param("teacherId") String teacherId);

	// --- Admin Courses page: filter theo status và/hoặc keyword (title hoặc teacher name) ---
	@Query("""
		SELECT c FROM Course c
		LEFT JOIN c.teacher t
		LEFT JOIN t.profile p
		WHERE (:status IS NULL OR c.status = :status)
		AND (
			:keyword IS NULL
			OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
			OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
		)
		ORDER BY 
			CASE WHEN (:status = vn.codemia.api.enums.CourseStatus.PENDING) THEN c.createdAt END ASC,
			CASE WHEN (:status IS NULL OR :status != vn.codemia.api.enums.CourseStatus.PENDING) THEN c.createdAt END DESC
	""")
	Page<Course> findByAdminFilter(
			@Param("status") CourseStatus status,
			@Param("keyword") String keyword,
			Pageable pageable
	);

	// --- Admin Courses page: filter với price range ---
	@Query("""
	    SELECT c FROM Course c
	    LEFT JOIN c.teacher t
	    LEFT JOIN t.profile p
	    WHERE (:status IS NULL OR c.status = :status)
	    AND (
	        :keyword IS NULL
	        OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
	        OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
	    )
	    AND (:minPrice IS NULL OR c.price >= :minPrice)
	    AND (:maxPrice IS NULL OR c.price <= :maxPrice)
	    ORDER BY 
	        CASE WHEN (:status = vn.codemia.api.enums.CourseStatus.PENDING) THEN c.createdAt END ASC,
	        CASE WHEN (:status IS NULL OR :status != vn.codemia.api.enums.CourseStatus.PENDING) THEN c.createdAt END DESC
	""")
	Page<Course> findByAdminFilter(
			@Param("status")   CourseStatus status,
			@Param("keyword")  String keyword,
			@Param("minPrice") Double minPrice,
			@Param("maxPrice") Double maxPrice,
			Pageable pageable
	);

	// --- Lấy tất cả enrollment của 1 course (dùng khi xóa course để notify student) ---
	@Query("SELECT e FROM Enrollment e WHERE e.course.id = :courseId")
	List<Enrollment> findAllEnrollmentsByCourseId(@Param("courseId") String courseId);

	// --- Đếm số học viên của 1 course ---
	@Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId")
	long countStudentsByCourseId(@Param("courseId") String courseId);

	// ── Category delete guard ─────────────────────────────────────────────────

	long countByCategoryId(Integer categoryId);

	@Query("SELECT c FROM Course c JOIN FETCH c.teacher WHERE c.category.id = :categoryId")
	List<Course> findAllByCategoryIdWithTeacher(@Param("categoryId") Integer categoryId);

	@Modifying(clearAutomatically = true)
	@Query("UPDATE Course c SET c.category = :newCategory WHERE c.category.id = :oldCategoryId")
	int reassignCategory(@Param("oldCategoryId") Integer oldCategoryId,
	                     @Param("newCategory")   Category newCategory);

	// ── Slug uniqueness check (bypass @SQLRestriction) ───────────────────────
	@Query(value = "SELECT COUNT(*) FROM courses WHERE slug = :slug", nativeQuery = true)
	int countBySlugIncludingDeleted(@Param("slug") String slug);

	// ── Role Downgrade ────────────────────────────────────────────────────────

	/**
	 * Bulk update status courses của 1 teacher theo oldStatus → newStatus.
	 * Dùng khi hạ role: PENDING → DRAFT.
	 * 1 câu SQL duy nhất, không load từng entity → không N+1.
	 */
	@Modifying(clearAutomatically = true)
	@Query("""
	    UPDATE Course c SET c.status = :newStatus
	    WHERE c.teacher.id = :teacherId
	    AND c.status = :oldStatus
	""")
	int updateStatusByTeacherAndStatus(
			@Param("teacherId") String teacherId,
			@Param("oldStatus") CourseStatus oldStatus,
			@Param("newStatus") CourseStatus newStatus
	);

	// ── Phase 2: Refund — lấy course của teacher theo status ─────────────────

	/**
	 * Lấy tất cả course của teacher với status nằm trong danh sách cho trước.
	 * Dùng trong downgrade flow: List.of(PUBLISHED, UNLISTED, SUSPENDED)
	 */
	@Query("""
	    SELECT c FROM Course c
	    WHERE c.teacher.id = :teacherId
	      AND c.status IN :statuses
	""")
	List<Course> findByTeacherIdAndStatusIn(
			@Param("teacherId") String teacherId,
			@Param("statuses")  List<CourseStatus> statuses
	);
}