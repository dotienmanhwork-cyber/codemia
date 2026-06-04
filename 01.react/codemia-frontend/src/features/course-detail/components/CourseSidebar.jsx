// src/features/course-detail/components/CourseSidebar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/context/AuthContext";
import { orderApi } from "../../checkout/api/order.api";

const Icon = ({ name, filled = false, size, style: extra = {} }) => (
  <span className={`cd-ms${filled ? " cd-ms-fill" : ""}`} style={{ fontSize: size, ...extra }}>
    {name}
  </span>
);

function LoginRequiredModal({ onClose, onLogin }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "2rem",
        width: 340, textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "#f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1rem",
        }}>
          <span style={{ fontSize: 26 }}>🔒</span>
        </div>

        <p style={{ fontSize: 17, fontWeight: 600, margin: "0 0 8px", color: "#111" }}>
          Bạn chưa đăng nhập
        </p>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
          Vui lòng đăng nhập để đăng ký khóa học và bắt đầu học ngay.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={onLogin}
            style={{
              padding: "10px 0", borderRadius: 8,
              background: "#111", color: "#fff",
              border: "none", fontSize: 14, fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Đăng nhập ngay
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px 0", borderRadius: 8,
              background: "transparent", color: "#6b7280",
              border: "1px solid #e5e7eb", fontSize: 14,
              cursor: "pointer",
            }}
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CourseSidebar({ course }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMsg, setCartMsg] = useState(null); // { type: "success"|"error", text }

  const isFree = course.price === 0;

  const displayPrice = isFree
    ? "Miễn phí"
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      setShowModal(true);
      return;
    }

    // Khóa học miễn phí → vào thẳng
    if (isFree) {
      navigate(`/learning-workspace/${course.slug}`);
      return;
    }

    // Khóa học có phí → thêm vào giỏ hàng
    try {
      setAddingToCart(true);
      setCartMsg(null);
      await orderApi.addToCart(course.id);
      setCartMsg({ type: "success", text: "Đã thêm vào giỏ hàng!" });
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể thêm vào giỏ hàng.";
      setCartMsg({ type: "error", text: msg });
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <>
      {showModal && (
        <LoginRequiredModal
          onClose={() => setShowModal(false)}
          onLogin={() => navigate("/login")}
        />
      )}

      <div className="bg-[var(--cd-surface-lo)] border border-[var(--cd-outline)] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-4 relative z-2">
        <img
          className="w-full h-40 object-cover rounded-lg border border-[var(--cd-outline)] block mb-3.5 bg-[var(--cd-surface-v)]"
          src={course.thumbnailUrl || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=60"}
          alt={course.title}
        />
        <div className="text-[11px] font-semibold tracking-wider text-[var(--cd-on-sv)] uppercase mb-[3px]">Chi phí khóa học</div>
        <div className="text-2xl font-bold text-[var(--cd-on-s)] mb-3">{displayPrice}</div>
        <button className="w-full py-[11px] bg-[var(--cd-purple)] text-white font-semibold text-sm border-none rounded cursor-pointer transition-colors duration-180 mb-2 font-inherit hover:bg-[var(--cd-purple-h)]" onClick={handleEnroll} disabled={addingToCart}
          style={{ opacity: addingToCart ? 0.75 : 1, cursor: addingToCart ? "not-allowed" : "pointer" }}
        >
          {addingToCart
            ? "Đang thêm..."
            : isFree ? "Đăng ký học ngay" : "Thêm vào giỏ hàng"}
        </button>

        {/* Feedback sau khi add to cart */}
        {cartMsg && (
          <div style={{
            margin: "8px 0 0",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            backgroundColor: cartMsg.type === "success" ? "#eafaf1" : "#fdf0f0",
            color: cartMsg.type === "success" ? "#1E7E34" : "#c0392b",
            border: `1px solid ${cartMsg.type === "success" ? "#a9dfbf" : "#f5c6cb"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}>
            <span>{cartMsg.type === "success" ? "✓ " : "✗ "}{cartMsg.text}</span>
            {cartMsg.type === "success" && (
              <button
                onClick={() => navigate("/cart")}
                style={{
                  background: "#1E7E34", color: "#fff",
                  border: "none", borderRadius: 6,
                  padding: "4px 10px", fontSize: 12,
                  fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                Xem giỏ hàng
              </button>
            )}
          </div>
        )}
        <p className="text-center text-[11px] text-[var(--cd-on-sv)] mb-3.5">Đảm bảo hoàn tiền trong 30 ngày</p>

        <p className="text-sm font-semibold text-[var(--cd-on-s)] mb-2.5">Khóa học này bao gồm:</p>
        <ul className="list-none flex flex-col gap-1.5 p-0 m-0">
          <li className="flex items-center gap-2 text-xs text-[var(--cd-on-sv)]"><Icon name="ondemand_video" size={18} /> Video chất lượng cao</li>
          <li className="flex items-center gap-2 text-xs text-[var(--cd-on-sv)]"><Icon name="all_inclusive" size={18} /> Quyền truy cập trọn đời</li>
          <li className="flex items-center gap-2 text-xs text-[var(--cd-on-sv)]"><Icon name="phone_iphone" size={18} /> Học trên mọi thiết bị</li>
          <li className="flex items-center gap-2 text-xs text-[var(--cd-on-sv)]"><Icon name="emoji_events" size={18} /> Cấp chứng nhận hoàn thành</li>
        </ul>
      </div>
    </>
  );
}