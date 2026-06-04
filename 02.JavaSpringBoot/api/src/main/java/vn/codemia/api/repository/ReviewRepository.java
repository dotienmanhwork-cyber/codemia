package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.codemia.api.entity.Review;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Integer> {

	// Lấy tất cả review của 1 course, mới nhất trước
	List<Review> findByCourseIdOrderByCreatedAtDesc(String courseId);

	// Lấy review của 1 student trong 1 course (mỗi student chỉ review 1 lần)
	Optional<Review> findByStudentIdAndCourseId(String studentId, String courseId);

	// Kiểm tra student đã review chưa
	boolean existsByStudentIdAndCourseId(String studentId, String courseId);

	// Rating trung bình của course
	@Query("SELECT AVG(r.rating) FROM Review r WHERE r.course.id = :courseId")
	Double findAverageRatingByCourseId(@Param("courseId") String courseId);

	// Số lượng review của course
	long countByCourseId(String courseId);

	@Modifying
	@Query("DELETE FROM Review r WHERE r.course.id = :courseId")
	void deleteByCourseId(@Param("courseId") String courseId);
}
