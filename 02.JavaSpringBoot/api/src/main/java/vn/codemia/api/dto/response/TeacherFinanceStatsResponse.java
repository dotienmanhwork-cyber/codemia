package vn.codemia.api.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherFinanceStatsResponse {
	private double totalRevenue;        // Tổng all-time
	private double thisMonthRevenue;    // Tháng này
	private double lastMonthRevenue;    // Tháng trước
	private double averagePerCourse;    // TB / khóa học
	private double revenueGrowth;       // % tăng trưởng so với tháng trước
}