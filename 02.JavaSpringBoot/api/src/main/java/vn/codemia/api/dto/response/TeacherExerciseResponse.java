package vn.codemia.api.dto.response;

import lombok.*;
import vn.codemia.api.enums.ExerciseDifficulty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherExerciseResponse {
	private Integer id;
	private String title;
	private String type;                   // "QUIZ" | "CODE"
	private ExerciseDifficulty difficulty;
	private String courseId;       // để FE redirect về /courses/:id/edit
	private String courseName;
	private Integer lessonId;
	private String lessonTitle;
	private long totalSubmissions;
}