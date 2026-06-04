package vn.codemia.api.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleDowngradeImpactResponse {

	private String userId;

	// Courses
	private long publishedCourses;   // giữ nguyên, block enrollment mới
	private long pendingCourses;     // → DRAFT
	private long draftCourses;       // giữ nguyên

	// Finance
	private long   pendingWithdrawals; // → HOLD
	private double remainingBalance;   // tiền available → sẽ tạo withdrawal mới (sau khi trừ frozen)
	private double totalFrozenBalance; // tiền đang bị HOLD từ trước (không tạo withdrawal mới)
}