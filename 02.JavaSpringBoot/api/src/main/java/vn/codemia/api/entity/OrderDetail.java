package vn.codemia.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDetail {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_id", nullable = false)
	private Order order;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "course_id", nullable = true)
	private Course course;

	/**
	 * Snapshot teacher tại thời điểm mua.
	 * Không thay đổi khi course bị xóa (nullifyCourseReference).
	 * Dùng để tính balance teacher ngay cả khi od.course = NULL.
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "teacher_id", nullable = true)
	private User teacher;

	@Column(name = "price_at_purchase", nullable = false)
	private BigDecimal priceAtPurchase;

	@Column(name = "teacher_earnings", nullable = false)
	private BigDecimal teacherEarnings;

	@Column(name = "platform_fee", nullable = false)
	private BigDecimal platformFee;
}