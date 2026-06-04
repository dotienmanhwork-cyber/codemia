import apiClient from "@/shared/config/axios";

export const courseApi = {
  getCourseDetail: async (slug) => {
    try {
      // THÊM /slug/ VÀO ĐÂY LÀ CHẠY NGON 100%
      const response = await apiClient.get(`/courses/slug/${slug}`); 
      
      return response.result || response.data; 
    } catch (error) {
      console.error("Lỗi khi fetch chi tiết khóa học:", error);
      throw error;
    }
  },
};