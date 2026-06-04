package vn.codemia.api.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherStatsResponse {
    private long totalStudents;
    private long totalCourses;
    private long draftCourses;
    private double monthlyRevenue;
    private double revenueGrowth;
    private double studentGrowth;
    private double averageRating;
}
