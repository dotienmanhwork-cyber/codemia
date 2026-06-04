package vn.codemia.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.codemia.api.enums.LessonType;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonResponse {
	private Integer id;
	private String title;
	private String videoUrl;        // đổi từ contentUrl → videoUrl cho đồng nhất với entity + DB
	private LessonType type;
	private Integer orderIndex;
	private Integer duration;
	private Boolean isFreePreview;
	private String aiSummaryCache;
	private Integer sectionId;
	private LocalDateTime createdAt;
	private List<ExerciseResponse> exercises; // dành cho type = EXERCISE
	private String content;
}