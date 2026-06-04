package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.codemia.api.entity.Certificate;

import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, String> {

	/** Kiểm tra / lấy cert theo student + course — dùng khi cấp cert và getCertificate() */
	Optional<Certificate> findByStudentIdAndCourseId(String studentId, String courseId);

	/** Lấy toàn bộ cert của student, mới nhất trước — dùng cho /my-certificates */
	List<Certificate> findAllByStudentIdOrderByIssuedAtDesc(String studentId);

	@Modifying
	@Query("DELETE FROM Certificate c WHERE c.course.id = :courseId")
	void deleteByCourseId(@Param("courseId") String courseId);
}
