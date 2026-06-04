package vn.codemia.api.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherExerciseStatsResponse {
	private long totalExercises;
	private long quizExercises;
	private long codeExercises;
	private long totalSubmissions;
}