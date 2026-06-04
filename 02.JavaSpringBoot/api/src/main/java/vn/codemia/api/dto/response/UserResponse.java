package vn.codemia.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
	private String id;
	private String email;
	private String fullName;
	private String avatarUrl;
	private String bio;
	private String bankAccountInfo;
	private String role;
	private String status;
	private LocalDateTime createdAt; //  cho cột JOINED trên UI
}