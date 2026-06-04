package vn.codemia.api.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiCacheSummaryResponse {
	private Integer lessonId;
	private String  lessonTitle;
	private String  courseId;
	private String  courseTitle;
	private boolean hasSummaryCache;
	private boolean hasTranscript;
	private Integer transcriptLength;   // số ký tự transcript, null nếu không có
}