package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.codemia.api.enums.AiFeature;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_feature_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AiFeatureConfig {

	@Id
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, unique = true, length = 30)
	private AiFeature feature;

	@Column(name = "provider_order", nullable = false, length = 200)
	private String providerOrder;

	/** Tắt feature → BE không gọi AI, trả lỗi ngay */
	@Builder.Default
	@Column(name = "enabled", nullable = false)
	private boolean enabled = true;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@PrePersist @PreUpdate
	void onSave() { this.updatedAt = LocalDateTime.now(); }
}