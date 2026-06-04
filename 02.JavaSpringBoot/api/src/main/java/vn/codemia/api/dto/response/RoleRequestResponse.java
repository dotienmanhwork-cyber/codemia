package vn.codemia.api.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoleRequestResponse {
	String userId;
	String name;          // từ UserProfile.fullName
	String email;
	String avatar;        // từ UserProfile.avatarUrl
	String currentRole;
	String requestedRole;
	String reason;
	String cvUrl;
	String portfolioUrl;
	LocalDateTime requestedAt;
}