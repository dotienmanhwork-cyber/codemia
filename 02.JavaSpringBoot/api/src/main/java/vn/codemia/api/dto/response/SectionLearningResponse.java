package vn.codemia.api.dto.response;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionLearningResponse {
	private String id;
	private String title;
	private List<LessonLearningResponse> lessons;
}