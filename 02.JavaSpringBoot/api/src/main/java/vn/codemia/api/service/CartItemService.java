package vn.codemia.api.service;

import vn.codemia.api.dto.request.CartItemRequest;
import vn.codemia.api.dto.response.CartItemResponse;

import java.util.List;

public interface CartItemService {
	CartItemResponse addToCart(CartItemRequest request);
	List<CartItemResponse> getMyCart();
	void removeFromCart(Integer id);
	void clearMyCart();
}