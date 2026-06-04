import axios from "axios";

// 1. Khởi tạo Axios Instance
const apiClient = axios.create({
  // Sử dụng biến môi trường Vite, nếu không có thì mặc định gọi vào Spring Boot local
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 10000, // Huỷ request nếu server không phản hồi sau 10 giây
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor: Can thiệp trước khi request được gửi đi
apiClient.interceptors.request.use(
  (config) => {
    // Tự động tìm JWT Token trong localStorage và gắn vào Header
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Can thiệp ngay khi nhận được response từ server
apiClient.interceptors.response.use(
  (response) => {
    // Trả về thẳng response.data để các file gọi API viết code ngắn gọn hơn
    // Thay vì res.data.data thì chỉ cần res.data
    return response.data;
  },
  (error) => {
    // Bỏ qua lỗi do AbortController.abort() — không phải lỗi thật.
    // Axios set error.code = 'ERR_CANCELED' khi request bị cancel (signal.abort()).
    // Nếu không filter ở đây, interceptor sẽ log "Không thể kết nối" sai lệch
    // và downstream catch() cần phân biệt cancel vs lỗi thật.
    if (error.code === "ERR_CANCELED" || error.name === "CanceledError") {
      return Promise.reject(error);
    }

    // Xử lý lỗi tập trung
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        console.error("Token không hợp lệ hoặc đã hết hạn!");
        // Xóa token cũ và đá người dùng về trang Đăng nhập
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else if (status === 403) {
        console.error("Bạn không có quyền truy cập tài nguyên này (Forbidden)!");
      }
    } else {
      console.error("Không thể kết nối đến Server Spring Boot!");
    }

    return Promise.reject(error);
  }
);

export default apiClient;