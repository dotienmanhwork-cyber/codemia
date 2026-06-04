package vn.codemia.api.dto.response;

import lombok.Builder;
import lombok.Data;
import vn.codemia.api.enums.AiFeature;
import vn.codemia.api.enums.AiProviderType;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AiFeatureConfigResponse {
	private AiFeature            feature;
	private List<AiProviderType> providerOrder;
	private boolean              enabled;      // ← thêm mới
	private LocalDateTime        updatedAt;
}