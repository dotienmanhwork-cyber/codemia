import apiClient from "../config/axios";

export const userApi = {
  /**
   * Gửi đơn đăng ký trở thành Teacher.
   *
   * @param {string} reason       - Lý do (20–1000 ký tự). Bắt buộc.
   * @param {string} cvUrl        - URL PDF từ Cloudinary. Bắt buộc.
   * @param {string} portfolioUrl - Link GitHub hoặc website cá nhân. Bắt buộc.
   */
  requestTeacherUpgrade: async (reason, cvUrl, portfolioUrl) => {
    const response = await apiClient.post("/users/request-teacher", {
      reason,
      cvUrl,
      portfolioUrl,
    })
    return response.result
  },
}