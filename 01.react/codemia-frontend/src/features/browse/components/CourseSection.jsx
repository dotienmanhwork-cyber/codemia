import { useState, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import CourseCard from "./CourseCard";
import { C } from "@/shared/utils/constants";
import { useNavigate } from "react-router-dom";

export default function CourseSection({
  title,
  subtitle,
  courses = [],
  accentColor,
  icon: Icon,
  showCategories = false,
  categories = [],   // ← nhận từ API thật, không dùng CATS mock nữa
  viewAllPath,
}) {
  const [activeCatId, setActiveCatId] = useState(null); // null = Tất cả
  const navigate = useNavigate();

  // Lọc courses theo category đang chọn
  const filtered = useMemo(() => {
    if (!activeCatId) return courses;
    return courses.filter((c) => c.category?.id === activeCatId);
  }, [courses, activeCatId]);

  return (
    <section className="py-14 px-6" style={{ maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {Icon && <Icon size={22} style={{ color: accentColor || C.secondary }} />}
            <h2 className="text-[26px] font-bold text-[#181a1c]">{title}</h2>
          </div>
          {subtitle && (
            <p className="text-[15px]" style={{ color: C.onVariant }}>{subtitle}</p>
          )}
        </div>
        <button
          onClick={() =>
            viewAllPath
              ? navigate(viewAllPath)
              : navigate(activeCatId ? `/courses?category=${activeCatId}` : "/courses")
          }
          className="text-[14px] font-semibold flex items-center gap-1 transition-colors"
          style={{ color: accentColor || C.secondary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.accentHover)}
          onMouseLeave={(e) => (e.currentTarget.style.color = accentColor || C.secondary)}
        >
          Xem tất cả <ArrowRight size={15} />
        </button>
      </div>

      {/* Category pills — chỉ hiện khi showCategories=true VÀ có data */}
      {showCategories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Nút "Tất cả" */}
          <button
            onClick={() => setActiveCatId(null)}
            className="px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors"
            style={
              activeCatId === null
                ? { backgroundColor: C.secondary, color: "white", borderColor: C.secondary }
                : { backgroundColor: C.surfaceCont, color: C.onVariant, borderColor: C.outline }
            }
            onMouseEnter={(e) => { if (activeCatId !== null) e.currentTarget.style.backgroundColor = C.surfaceHigh; }}
            onMouseLeave={(e) => { if (activeCatId !== null) e.currentTarget.style.backgroundColor = C.surfaceCont; }}
          >
            Tất cả
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCatId(cat.id)}
              className="px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors"
              style={
                activeCatId === cat.id
                  ? { backgroundColor: C.secondary, color: "white", borderColor: C.secondary }
                  : { backgroundColor: C.surfaceCont, color: C.onVariant, borderColor: C.outline }
              }
              onMouseEnter={(e) => { if (activeCatId !== cat.id) e.currentTarget.style.backgroundColor = C.surfaceHigh; }}
              onMouseLeave={(e) => { if (activeCatId !== cat.id) e.currentTarget.style.backgroundColor = C.surfaceCont; }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      ) : (
        <div className="py-16 text-center" style={{ color: C.onVariant }}>
          Không có khóa học nào trong danh mục này.
        </div>
      )}
    </section>
  );
}