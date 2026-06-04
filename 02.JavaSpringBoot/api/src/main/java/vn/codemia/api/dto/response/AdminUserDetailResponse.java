package vn.codemia.api.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailResponse {
	private UserResponse user;
	private List<RoleChangeLogResponse> roleLogs;
}