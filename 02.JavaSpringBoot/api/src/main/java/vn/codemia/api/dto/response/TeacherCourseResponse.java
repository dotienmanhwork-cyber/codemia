package vn.codemia.api.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherCourseResponse {
    private String id;
    private String title;
    private String slug;
    private String thumbnail;
    private BigDecimal price;       // ← THÊM MỚI
    private String description;     // ← THÊM MỚI
    private long totalStudents;
    private Double rating;          // nullable — course chưa có review
    private double revenue;
    private String status;          // "PUBLISHED" | "DRAFT" | "PENDING" | "REJECTED"
    private String rejectedReason;  // nullable — chỉ có giá trị khi status = REJECTED
    private Integer categoryId;     // nullable — null nếu course chưa gán category
    private String categoryName;    // nullable — null nếu course chưa gán category
    private long totalLessons;      // tổng số bài học thuộc course
    private LocalDateTime createdAt;
}