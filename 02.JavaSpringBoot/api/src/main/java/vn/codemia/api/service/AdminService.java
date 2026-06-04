package vn.codemia.api.service;

import org.springframework.data.domain.Page;
import vn.codemia.api.dto.request.AdminCourseStatusRequest;
import vn.codemia.api.dto.response.*;

import java.util.List;

public interface AdminService {

	// Dashboard
	AdminDashboardStatsResponse getDashboardStats();
	List<RoleRequestResponse> getRoleRequests(int limit);

	// Roles
	List<RoleRequestResponse> getAllRoleRequests();
	void approveRole(String userId);
	void declineRole(String userId, String reason);

	// Finance
	AdminFinanceStatsResponse getFinanceStats();
	List<AdminMonthlyBreakdownResponse> getMonthlyBreakdown(int months);
	List<AdminTeacherPayoutResponse> getTeacherPayouts(String month);

	// Courses
	Page<AdminCourseResponse> getCourses(
			int page, int size,
			String status, String keyword,
			Double minPrice, Double maxPrice
	);
	AdminCourseDetailResponse getCourseDetail(String courseId);
	void updateCourseStatus(String courseId, AdminCourseStatusRequest request);

	/**
	 * Xóa course bởi Admin — khác với Teacher delete:
	 *   1. Tạo RefundRequest cho toàn bộ student đã thanh toán (nếu có)
	 *   2. Xóa course (hard delete, cascade xuống sections/lessons/enrollments)
	 *
	 * Thay thế lời gọi courseService.delete() ở AdminController để đảm bảo
	 * refund flow được thực thi trong cùng 1 transaction.
	 */
	void deleteAdminCourse(String courseId, String adminEmail);

	// Lessons
	LessonResponse getLessonDetail(Integer lessonId);

	// Trả về impact summary để FE hiển thị confirmation modal
	RoleDowngradeImpactResponse getDowngradeImpact(String userId);

	// Thực hiện hạ role + toàn bộ side effects trong 1 transaction
	void downgradeUserRole(String userId, String adminEmail, String note);
	void blockTeacher(String teacherId, String reason);
	void blockTeacherAndHandleAssets(String teacherId);
}