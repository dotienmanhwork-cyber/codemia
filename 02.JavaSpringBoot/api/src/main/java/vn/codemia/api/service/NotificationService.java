package vn.codemia.api.service;

import vn.codemia.api.entity.User;

public interface NotificationService {

	void notifyUser(User user, String title, String content);

	void notifyAllAdmins(String title, String content);

	// MỚI: Gửi notification đến toàn bộ student đang enroll courseId.
	// Nếu không có student nào enroll → không làm gì, không throw exception.
	void notifyEnrolledStudents(String courseId, String title, String content);

	void markAsRead(Integer id);

	void markAllAsRead(User user);
}