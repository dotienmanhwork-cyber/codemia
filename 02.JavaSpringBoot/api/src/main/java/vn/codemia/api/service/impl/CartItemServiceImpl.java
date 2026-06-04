package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codemia.api.dto.request.CartItemRequest;
import vn.codemia.api.dto.response.CartItemResponse;
import vn.codemia.api.entity.CartItem;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.mapper.CartItemMapper;
import vn.codemia.api.repository.CartItemRepository;
import vn.codemia.api.repository.CourseRepository;
import vn.codemia.api.repository.UserRepository;
import vn.codemia.api.service.CartItemService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartItemServiceImpl implements CartItemService {

	private final CartItemRepository cartItemRepository;
	private final CourseRepository   courseRepository;
	private final UserRepository     userRepository;
	private final CartItemMapper     cartItemMapper;

	// ─────────────────────────────────────────────────────────────
	// Thêm khoá học vào giỏ hàng
	// ─────────────────────────────────────────────────────────────
	@Override
	@Transactional
	public CartItemResponse addToCart(CartItemRequest request) {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();

		var user = userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		var course = courseRepository.findById(request.getCourseId())
				.orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

		if (cartItemRepository.existsByUserIdAndCourseId(user.getId(), request.getCourseId())) {
			throw new RuntimeException("Khóa học này đã có trong giỏ hàng rồi!");
		}

		CartItem cartItem = CartItem.builder()
				.user(user)
				.course(course)
				.build();

		return cartItemMapper.toCartItemResponse(cartItemRepository.save(cartItem));
	}

	// ─────────────────────────────────────────────────────────────
	// Lấy giỏ hàng của user hiện tại
	// Dùng findByUserIdWithDetails() → 1 query JOIN FETCH duy nhất,
	// tránh N+1 khi mapper truy cập course.teacher
	// ─────────────────────────────────────────────────────────────
	@Override
	public List<CartItemResponse> getMyCart() {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();

		var user = userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		return cartItemRepository.findByUserIdWithDetails(user.getId())
				.stream()
				.map(cartItemMapper::toCartItemResponse)
				.collect(Collectors.toList());
	}

	// ─────────────────────────────────────────────────────────────
	// Xoá 1 item khỏi giỏ hàng (chỉ chủ sở hữu mới được xoá)
	// ─────────────────────────────────────────────────────────────
	@Override
	@Transactional
	public void removeFromCart(Integer id) {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();

		var user = userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		CartItem item = cartItemRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Không tìm thấy item trong giỏ hàng"));

		if (!item.getUser().getId().equals(user.getId())) {
			throw new RuntimeException("Bạn không có quyền xóa item này!");
		}

		cartItemRepository.delete(item);
	}

	// ─────────────────────────────────────────────────────────────
	// Xoá toàn bộ giỏ hàng (dùng sau khi thanh toán)
	// ─────────────────────────────────────────────────────────────
	@Override
	@Transactional
	public void clearMyCart() {
		String email = SecurityContextHolder.getContext().getAuthentication().getName();

		var user = userRepository.findByEmail(email)
				.orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

		cartItemRepository.deleteByUserId(user.getId());
	}
}