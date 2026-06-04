package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.entity.*;
import vn.codemia.api.enums.OrderStatus;
import vn.codemia.api.enums.Role;
import vn.codemia.api.enums.CourseStatus;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.repository.CartItemRepository;
import vn.codemia.api.repository.EnrollmentRepository;
import vn.codemia.api.repository.OrderRepository;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.service.NotificationService;
import vn.codemia.api.service.OrderService;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

	private final UserRepository       userRepository;
	private final CartItemRepository   cartItemRepository;
	private final OrderRepository      orderRepository;
	private final EnrollmentRepository enrollmentRepository;
	private final NotificationService  notificationService;

	private static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("0.20");

	@Override
	@Transactional
	public Order createOrderFromCart() {
		// 1. Lấy thông tin user từ Token
		String email = SecurityContextHolder.getContext().getAuthentication().getName();
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		// 2. Lấy danh sách item trong giỏ hàng
		List<CartItem> cartItems = cartItemRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
		if (cartItems.isEmpty()) {
			throw new RuntimeException("Giỏ hàng rỗng, không thể tạo đơn hàng!");
		}

		// 3. Khởi tạo đơn hàng mới
		Order order = new Order();
		order.setUser(user);
		order.setStatus(OrderStatus.PENDING);
		order.setTotalAmount(BigDecimal.ZERO);

		List<OrderDetail> orderDetails = new ArrayList<>();
		BigDecimal totalOrderAmount = BigDecimal.ZERO;

		// 4. Lặp qua từng item trong giỏ để tạo Order Detail
		for (CartItem cartItem : cartItems) {
			Course course = cartItem.getCourse();

			// ── Validate course còn có thể mua không ─────────────────────────
			// Course bị unpublish hoặc teacher bị hạ role → không cho mua
			if (course.getStatus() != CourseStatus.PUBLISHED) {
				throw new AppException(ErrorCode.COURSE_ENROLLMENT_UNAVAILABLE);
			}
			// Teacher bị hạ role về STUDENT → course đóng enrollment mới
			// (course vẫn PUBLISHED để student cũ xem được, nhưng không cho mua thêm)
			if (course.getTeacher().getRole() != Role.TEACHER) {
				throw new AppException(ErrorCode.COURSE_ENROLLMENT_UNAVAILABLE);
			}
			// ─────────────────────────────────────────────────────────────────

			BigDecimal coursePrice = course.getPrice();

			// Tính toán phân chia nguồn tiền
			BigDecimal platformFee     = coursePrice.multiply(PLATFORM_FEE_RATE);
			BigDecimal teacherEarnings = coursePrice.subtract(platformFee);

			OrderDetail detail = OrderDetail.builder()
					.order(order)
					.course(course)
					.teacher(course.getTeacher())
					.priceAtPurchase(coursePrice)
					.platformFee(platformFee)
					.teacherEarnings(teacherEarnings)
					.build();

			orderDetails.add(detail);
			totalOrderAmount = totalOrderAmount.add(coursePrice);
		}

		// 5. Cập nhật tổng tiền đơn hàng và danh sách detail
		order.setTotalAmount(totalOrderAmount);
		order.setOrderDetails(orderDetails);

		// 6. Lưu đơn hàng (JPA sẽ tự động lưu cả OrderDetails nhờ CascadeType.ALL)
		Order savedOrder = orderRepository.save(order);

		// Cart giữ nguyên ở đây — chỉ xóa sau khi thanh toán thành công trong processVnPayCallback
		log.info("Đã tạo đơn hàng thành công: {} cho user: {}", savedOrder.getId(), email);

		return savedOrder;
	}

	@Override
	@Transactional
	public void processVnPayCallback(String orderId, boolean isSuccess) {
		Order order = orderRepository.findById(orderId)
				.orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng mã: " + orderId));

		// Nếu đơn hàng đã được xử lý trước đó rồi thì bỏ qua để tránh duplicate
		if (order.getStatus() == OrderStatus.SUCCESS) {
			return;
		}

		if (isSuccess) {
			order.setStatus(OrderStatus.SUCCESS);

			// Cấp quyền học cho từng course trong order
			for (OrderDetail detail : order.getOrderDetails()) {
				Enrollment enrollment = new Enrollment();
				enrollment.setStudent(order.getUser());
				enrollment.setCourse(detail.getCourse());
				enrollment.setProgressPercent(new java.math.BigDecimal("0.0"));
				enrollmentRepository.save(enrollment);
			}

			// Xóa cart sau khi thanh toán thành công
			cartItemRepository.deleteByUserId(order.getUser().getId());

			// Notify user
			notificationService.notifyUser(
					order.getUser(),
					"Thanh toán thành công ✓",
					"Đơn hàng của bạn đã được xử lý. Bạn có thể bắt đầu học ngay!"
			);

			log.info("Đã cấp quyền học thành công cho User: {} với Đơn hàng: {}",
					order.getUser().getEmail(), orderId);
		} else {
			order.setStatus(OrderStatus.FAILED);
			// Cart giữ nguyên để user có thể thử thanh toán lại
			log.warn("Đơn hàng {} thanh toán thất bại/hủy bỏ.", orderId);
		}

		orderRepository.save(order);
	}
}