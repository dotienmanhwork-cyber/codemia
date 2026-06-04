// ===== SummaryResponse.java =====
package vn.codemia.api.dto.response;

import lombok.Builder;
import lombok.Data;
import vn.codemia.api.enums.AiProviderType;

@Data
@Builder
public class SummaryResponse {
	private Integer lessonId;
	private String summary;
	private boolean fromCache;       // true nếu đọc từ ai_summary_cache
	private AiProviderType usedProvider;
}