package vn.codemia.api.service;

import vn.codemia.api.entity.Order;

public interface OrderService {
	/**
	 * Chuyển đổi toàn bộ item trong giỏ hàng thành một Đơn hàng (Order)
	 * @return Đối tượng Order sau khi đã lưu vào DB
	 */
	Order createOrderFromCart();
	void processVnPayCallback(String orderId, boolean isSuccess);
}