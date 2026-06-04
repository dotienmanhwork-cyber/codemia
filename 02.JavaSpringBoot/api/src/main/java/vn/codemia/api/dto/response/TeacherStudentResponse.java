package vn.codemia.api.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherStudentResponse {
    private String userId;
    private String name;
    private String email;
    private String avatar;
    private String courseName;
    private String courseId;
    private int progress;               // 0 → 100
    private long exercisesSubmitted;    // số bài tập đã nộp
    private LocalDateTime enrolledAt;
    private LocalDateTime lastActiveAt;
    private String status;              // "ACTIVE" | "COMPLETED" | "INACTIVE" | "NOT_STARTED"
}