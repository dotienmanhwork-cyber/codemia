package vn.codemia.api.dto.response;

import lombok.Builder;
import lombok.Data;
import vn.codemia.api.enums.AiProviderType;

@Data
@Builder
public class CodeReviewResponse {
	private String review;
	private String language;
	private AiProviderType usedProvider;
}