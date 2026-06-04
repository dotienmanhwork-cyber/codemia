package vn.codemia.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {

	private Integer id;

	// ── Course core ──────────────────────────────────────────────
	private String courseId;
	private String courseTitle;
	private String courseThumbnailUrl;
	private BigDecimal coursePrice;

	// ── Các field bổ sung cho UI giỏ hàng ───────────────────────
	private BigDecimal courseOriginalPrice; // Giá gốc → tính % giảm giá
	private String    instructorName;       // Tên giảng viên
	private Double    courseRating;         // Điểm TB (VD: 4.9)
	private Integer   courseRatingCount;    // Số lượt đánh giá
	private Boolean   isBestseller;         // Badge "Bestseller"

	// ── Meta ─────────────────────────────────────────────────────
	private LocalDateTime createdAt;
}