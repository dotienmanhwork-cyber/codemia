package vn.codemia.api.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleChangeLogResponse {
	private String id;
	private String changedByEmail;
	private String fromRole;
	private String toRole;
	private String note;
	private LocalDateTime changedAt;
}