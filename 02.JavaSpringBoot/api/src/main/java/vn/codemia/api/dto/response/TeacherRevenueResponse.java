package vn.codemia.api.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherRevenueResponse {
    private String orderId;
    private String courseId;
    private String courseName;
    private double amount;
    private String type;        // "ENROLLMENT"
    private String status;      // "SUCCESS"
    private LocalDateTime createdAt;
}
