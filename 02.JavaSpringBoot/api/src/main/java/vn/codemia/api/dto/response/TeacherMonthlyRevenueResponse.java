package vn.codemia.api.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherMonthlyRevenueResponse {
	private String month;       // "2025-05"
	private double revenue;
}