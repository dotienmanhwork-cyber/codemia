package vn.codemia.api.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import vn.codemia.api.enums.AiProviderType;

import java.util.List;

@Data
public class AiFeatureConfigUpdateRequest {

	@NotEmpty(message = "providerOrder không được để trống")
	private List<AiProviderType> providerOrder;

	/** true = feature hoạt động bình thường, false = BE từ chối gọi AI */
	private boolean enabled = true;
}