package vn.codemia.api.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherStudentStatsResponse {
	private long totalStudents;
	private long activeStudents;      // progress > 0 && progress < 100 && active trong 7 ngày
	private long completedStudents;   // progress = 100
	private double averageProgress;   // TB % tiến độ
}