// src/features/checkout/api/order.api.js
import apiClient from "../../../shared/config/axios";

export const orderApi = {
  /** Lấy danh sách items trong giỏ hàng */
  getMyCart: async () => {
    try {
      const response = await apiClient.get("/cart");
      return response.result || [];
    } catch (error) {
      console.error("Lỗi khi lấy giỏ hàng:", error);
      return [];
    }
  },

  /** ✅ THÊM MỚI: Thêm khóa học vào giỏ hàng */
  addToCart: async (courseId) => {
    const response = await apiClient.post("/cart", { courseId });
    return response.result;
  },

  /** Xóa một item khỏi giỏ hàng */
  removeCartItem: async (id) => {
    try {
      return await apiClient.delete(`/cart/${id}`);
    } catch (error) {
      console.error("Lỗi khi xóa item giỏ hàng:", error);
      throw error;
    }
  },

  /** Tạo order từ cart + lấy VNPAY payment URL */
  checkout: async () => {
    const response = await apiClient.post("/orders/checkout");
    return response.result;
  },
};