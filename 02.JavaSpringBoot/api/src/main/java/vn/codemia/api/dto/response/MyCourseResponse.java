package vn.codemia.api.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyCourseResponse {
	private String courseId;
	private String slug;
	private String title;
	private String thumbnailUrl;
	private BigDecimal progressPercent; // 0.00 → 100.00
	private LocalDateTime enrolledAt;
}