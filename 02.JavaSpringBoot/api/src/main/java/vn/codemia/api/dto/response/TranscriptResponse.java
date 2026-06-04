package vn.codemia.api.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TranscriptResponse {
	private Integer       lessonId;
	private String        transcript;
	private boolean       fromCache;
	private LocalDateTime pulledAt;
}