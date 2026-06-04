package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

	@Id
	@Column(name = "user_id" , length=36)
	private String userId;

	@OneToOne
	@MapsId // Đánh dấu rằng user_id vừa là PK vừa là FK nối sang bảng User
	@JoinColumn(name = "user_id")
	private User user;

	@Column(name = "full_name", nullable = false)
	private String fullName;

	@Column(name = "avatar_url", length = 500)
	private String avatarUrl;

	@Column(columnDefinition = "TEXT")
	private String bio;

	@Column(name = "bank_account_info")
	private String bankAccountInfo;
}