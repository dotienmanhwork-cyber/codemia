package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import vn.codemia.api.enums.Role;

import java.time.LocalDateTime;

@Entity
@Table(name = "role_change_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleChangeLog {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(columnDefinition = "VARCHAR(36)")
	private String id;

	// user bị đổi role
	@Column(name = "user_id", nullable = false)
	private String userId;

	// email của admin thực hiện thao tác
	@Column(name = "changed_by_email")
	private String changedByEmail;

	@Enumerated(EnumType.STRING)
	@Column(name = "from_role")
	private Role fromRole;

	@Enumerated(EnumType.STRING)
	@Column(name = "to_role")
	private Role toRole;

	// ghi chú tùy chọn (admin có thể để lại lý do)
	@Column(columnDefinition = "TEXT")
	private String note;

	@CreationTimestamp
	@Column(name = "changed_at", updatable = false)
	private LocalDateTime changedAt;
}