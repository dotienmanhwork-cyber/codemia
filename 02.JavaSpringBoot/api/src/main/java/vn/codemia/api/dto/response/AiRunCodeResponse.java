package vn.codemia.api.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import vn.codemia.api.enums.AiProviderType;

import java.util.List;

/**
 * Response từ AI khi review code (fallback khi bài chưa có test cases).
 * Tách hoàn toàn khỏi RunCodeResponse (Piston format) để tránh conflict.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiRunCodeResponse {

	/** true nếu AI phát hiện lỗi compile/runtime */
	private boolean hasError;

	/** Danh sách vấn đề phát hiện được */
	private List<String> issues;

	/** Giải thích lỗi tổng thể — chỉ set khi hasError=true */
	private String errorExplanation;

	/** Gợi ý hướng sửa (không cung cấp code hoàn chỉnh) */
	private List<String> suggestions;

	/** Provider nào đã xử lý request này */
	private AiProviderType usedProvider;
}