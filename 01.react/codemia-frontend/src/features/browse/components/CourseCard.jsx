import { Star, Sparkles, Crown, Gift } from "lucide-react";
import { C } from "@/shared/utils/constants";
import { useNavigate } from "react-router-dom";
export default function CourseCard({ course }) {
  // Mapping đúng với dữ liệu từ Spring Boot
  const isFree = course.price === 0 || course.price === null;
  const isPro  = course.price >= 1; // Giả sử trên 1 triệu là khóa Pro
  const navigate = useNavigate();
  // Format tiền VNĐ (VD: 500000 -> 500.000đ)
  const formattedPrice = isFree ? "Miễn phí" : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price);
  const handleCardClick = () => {
    if (course.enrolled) {
      navigate(`/learning-workspace/${course.id}`);
    } else {
      navigate(`/courses/${course.slug}`);
    }
  };
  return (
    <div
      onClick={handleCardClick}
      className="rounded-lg border overflow-hidden flex flex-col transition-all duration-300 cursor-pointer"
      style={{
        backgroundColor: C.surface,
        borderColor: isPro ? "#d4a800" : C.outline,
        borderTopWidth: isPro ? "2px" : "1px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden">
        {/* Đổi course.img thành course.thumbnailUrl */}
        <img src={course.thumbnailUrl || "https://placehold.co/600x400?text=No+Image"} alt={course.title} className="w-full h-full object-cover" />

        <span
          className="absolute top-2 left-2 px-2 py-0.5 text-[11px] font-semibold rounded border"
          style={{
            backgroundColor: "rgba(252,248,248,0.92)",
            backdropFilter: "blur(4px)",
            borderColor: "rgba(197,198,202,0.5)",
            color: "#181a1c",
          }}
        >
          {/* Đổi course.cat thành course.category?.name */}
          {course.category?.name || "Lập trình"}
        </span>

        {!course.enrolled && isPro && (
          <span
            className="absolute top-2 right-2 px-2 py-0.5 text-[11px] font-bold rounded flex items-center gap-1"
            style={{ backgroundColor: "#d4a800", color: "white" }}
          >
            <Crown size={12} /> PRO
          </span>
        )}

        {!course.enrolled && isFree && (
          <span
            className="absolute top-2 right-2 px-2 py-0.5 text-[11px] font-bold rounded flex items-center gap-1"
            style={{ backgroundColor: C.success, color: "white" }}
          >
            <Gift size={12} /> Miễn phí
          </span>
        )}

        {/* Badge đã đăng ký — chỉ hiện khi enrolled, không đè lên PRO/Free nữa */}
        {course.enrolled && (
          <span
            className="absolute top-2 right-2 px-2 py-0.5 text-[11px] font-bold rounded flex items-center gap-1"
            style={{ backgroundColor: C.primary, color: "white" }}
          >
            ✓ Đã đăng ký
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-[15px] font-semibold leading-snug text-[#181a1c] mb-1 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-[13px] mb-2" style={{ color: C.onVariant }}>
          {course.teacherName || "Giảng viên Codemia"}
        </p>
        <div className="flex items-center gap-1 mb-2 text-[12px]" style={{ color: C.warning }}>
          <Star size={14} fill={C.warning} />
          <span className="font-bold text-[#181a1c]">
            {course.averageRating ? course.averageRating.toFixed(1) : "0.0"}
          </span>
          <span style={{ color: C.onVariant }}>
            {course.reviewCount > 0 ? `(${course.reviewCount} xếp hạng)` : "(Chưa có đánh giá)"}
          </span>
        </div>

        {/* Footer */}
        <div
          className="mt-auto pt-2 border-t flex justify-between items-center"
          style={{ borderColor: C.outline }}
        >
          {course.enrolled ? (
            <span className="text-[14px] font-semibold" style={{ color: C.primary }}>
              ▶ Tiếp tục học
            </span>
          ) : isFree ? (
            <span className="text-[15px] font-bold" style={{ color: C.success }}>
              Miễn phí
            </span>
          ) : (
            <span className="text-[15px] font-bold text-[#181a1c]">{formattedPrice}</span>
          )}

          {/* Kiểm tra xem trong mảng tags có tag AI không */}
          {course.tags?.some(tag => tag.name.includes("AI") || tag.slug.includes("ai")) && (
            <span
              className="px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 border"
              style={{
                backgroundColor: `${C.secondary}18`,
                color: C.secondary,
                borderColor: `${C.secondary}30`,
              }}
            >
              <Sparkles size={12} /> AI
            </span>
          )}
        </div>
      </div>
    </div>
  );
}