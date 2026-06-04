/**
 * AuthContext.jsx
 * Đặt file này tại: src/shared/context/AuthContext.jsx
 *
 * Cung cấp:
 *   - user        : { name, email, token, ... } | null
 *   - login(data) : lưu user + token vào state & localStorage
 *   - logout()    : xóa user + token
 */
import { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync role mới nhất từ server mỗi khi app khởi động
 useEffect(() => {
  const token = localStorage.getItem("token");
  console.log("useEffect chạy, token:", token); // ← thêm
  if (!token) return;

  fetch("/api/users/my-profile", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      console.log("my-profile response:", data); // ← thêm
      if (data?.result) {
        const updated = { ...user, ...data.result };
        console.log("updated user:", updated); // ← thêm
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
      }
    })
    .catch((err) => console.error("fetch error:", err)); // ← thêm
}, []);
  /**
   * Gọi sau khi backend trả về thành công.
   * @param {object} userData  - object chứa ít nhất { name, email }
   * @param {string} token     - JWT token
   */
  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Cập nhật thông tin user sau khi edit profile
  const updateUser = (newData) => {
    const merged = { ...user, ...newData };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook tiện dụng — dùng ở bất kỳ component nào
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  return ctx;
}