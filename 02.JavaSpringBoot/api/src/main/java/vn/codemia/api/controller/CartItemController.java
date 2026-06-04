package vn.codemia.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.CartItemRequest;
import vn.codemia.api.dto.response.ApiResponse;
import vn.codemia.api.dto.response.CartItemResponse;
import vn.codemia.api.service.CartItemService;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartItemController {

	private final CartItemService cartItemService;

	@PostMapping
	public ResponseEntity<ApiResponse<CartItemResponse>> addToCart(@RequestBody CartItemRequest request) {
		return ResponseEntity.ok(
				ApiResponse.<CartItemResponse>builder()
						.result(cartItemService.addToCart(request))
						.build()
		);
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<CartItemResponse>>> getMyCart() {
		return ResponseEntity.ok(
				ApiResponse.<List<CartItemResponse>>builder()
						.result(cartItemService.getMyCart())
						.build()
		);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> removeFromCart(@PathVariable Integer id) {
		cartItemService.removeFromCart(id);
		return ResponseEntity.ok(
				ApiResponse.<Void>builder()
						.message("Đã xóa khỏi giỏ hàng")
						.build()
		);
	}
}