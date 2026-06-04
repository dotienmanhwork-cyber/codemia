package vn.codemia.api.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminDashboardStatsResponse {
	long totalUsers;
	long pendingApprovals;
	double systemHealth;
	double monthlyRevenue;
	double userGrowth;
}