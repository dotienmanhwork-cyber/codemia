package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import vn.codemia.api.enums.Role;
import vn.codemia.api.enums.UserStatus;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(columnDefinition = "VARCHAR(36)")
	private String id;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Role role;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private UserStatus status;

	// Lý do xin nâng cấp lên TEACHER — null nếu chưa từng request
	@Column(name = "upgrade_reason", columnDefinition = "TEXT")
	private String upgradeReason;

	// URL PDF CV trên Cloudinary
	@Column(name = "cv_url", length = 500)
	private String cvUrl;

	// Link GitHub hoặc portfolio — bắt buộc khi request nâng cấp
	@Column(name = "portfolio_url", length = 500)
	private String portfolioUrl;

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	@OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	@PrimaryKeyJoinColumn
	private UserProfile profile;

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
	}

	@Override
	public String getPassword() { return passwordHash; }

	@Override
	public String getUsername() { return email; }

	@Override
	public boolean isAccountNonExpired()     { return true; }

	@Override
	public boolean isAccountNonLocked()      { return true; }

	@Override
	public boolean isCredentialsNonExpired() { return true; }

	@Override
	public boolean isEnabled() {
		return status == UserStatus.ACTIVE;
	}
}