package vn.codemia.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminFinanceStatsResponse {
	private double monthlyRevenue;
	private double totalPayouts;
	private double platformNet;
	private long totalTransactions;
	private double revenueGrowth;
}