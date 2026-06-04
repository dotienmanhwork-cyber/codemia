package vn.codemia.api.dto.response;

import lombok.Builder;
import lombok.Data;
import vn.codemia.api.enums.AiProviderType;

@Data
@Builder
public class AiProviderStatusResponse {
	private AiProviderType provider;
	private boolean keyConfigured;   // API key có trong env hay không
	private boolean available;       // ping thật trả về HTTP 200
	private Long    latencyMs;       // thời gian ping (ms) — null nếu offline
	private String  model;           // model đang dùng (thông tin)
	private String  note;            // ghi chú thêm (e.g. "Dùng cho CODE_RUN")
}