// ===== ChatResponse.java =====
package vn.codemia.api.dto.response;

import lombok.Builder;
import lombok.Data;
import vn.codemia.api.enums.AiProviderType;

@Data
@Builder
public class ChatResponse {
	private String reply;
	private AiProviderType usedProvider; // cho biết model nào đã xử lý
}