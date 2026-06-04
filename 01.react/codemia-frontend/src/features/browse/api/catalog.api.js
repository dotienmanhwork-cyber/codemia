import apiClient from "../../../shared/config/axios";

export const catalogApi = {
  getAllCourses: async () => {
    try {
      const response = await apiClient.get("/courses");
      // Interceptor đã bóc .data rồi, response = { code, result }
      return response.result || [];  // ✅ Bỏ .data
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khóa học:", error);
      return [];
    }
  },

  getAllCategories: async () => {
    try {
      const response = await apiClient.get("/categories");
      return response.result || [];  // ✅ Bỏ .data
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
      return [];
    }
  }
};