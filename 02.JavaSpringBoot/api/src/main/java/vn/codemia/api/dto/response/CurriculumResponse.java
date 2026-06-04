package vn.codemia.api.dto.response;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurriculumResponse {
	private List<SectionLearningResponse> chapters;
}