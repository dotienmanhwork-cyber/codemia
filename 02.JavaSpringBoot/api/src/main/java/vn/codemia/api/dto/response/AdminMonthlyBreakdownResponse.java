package vn.codemia.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMonthlyBreakdownResponse {
	private String month;       // format "2025-05"
	private double revenue;
	private double payouts;
	private double net;
	private long transactions;
}