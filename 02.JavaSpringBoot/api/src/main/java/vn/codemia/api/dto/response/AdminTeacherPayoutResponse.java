package vn.codemia.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTeacherPayoutResponse {
	private String teacherId;
	private String teacherName;
	private long totalCourses;
	private long totalStudents;
	private double earned;      // tổng priceAtPurchase của teacher trong tháng
	private double payout;      // tổng teacherEarnings từ DB (75%)
	private String status;      // "PAID" | "PENDING"
}