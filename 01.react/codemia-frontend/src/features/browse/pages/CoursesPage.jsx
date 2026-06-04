import { Loader2, BookOpen } from "lucide-react";
import CourseCard from "../components/CourseCard";
import { C } from "@/shared/utils/constants";
import { useCatalog } from "../hooks/useCatalog";

export default function CoursesPage() {
  const {
    categories,
    loading,
    activeCatId,
    handleCatChange,
    filtered,
    activeCatName,
    searchQuery,
  } = useCatalog();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ backgroundColor: "#fcf8f8" }}>
        <Loader2 className="animate-spin" size={40} style={{ color: C.secondary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fcf8f8" }}>

      {/* ── Page header ── */}
      <div className="border-b" style={{ backgroundColor: C.surface, borderColor: C.outline }}>
        <div className="px-10 py-8" style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h1 className="text-[28px] font-bold text-[#181a1c] mb-1">
            {searchQuery.trim()
              ? `Kết quả tìm kiếm: "${searchQuery}"`
              : activeCatName
                ? `Khóa học: ${activeCatName}`
                : "Tất cả khóa học"}
          </h1>
          <p className="text-[15px]" style={{ color: C.onVariant }}>
            {filtered.length} khóa học
            {searchQuery.trim()
              ? ` khớp với từ khóa của bạn`
              : activeCatName
                ? ` trong danh mục "${activeCatName}"`
                : ""}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-10 py-8" style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => handleCatChange(null)}
              className="px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors"
              style={
                !activeCatId
                  ? { backgroundColor: C.secondary, color: "white", borderColor: C.secondary }
                  : { backgroundColor: C.surfaceCont, color: C.onVariant, borderColor: C.outline }
              }
              onMouseEnter={(e) => { if (activeCatId) e.currentTarget.style.backgroundColor = C.surfaceHigh; }}
              onMouseLeave={(e) => { if (activeCatId) e.currentTarget.style.backgroundColor = C.surfaceCont; }}
            >
              Tất cả
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCatChange(cat.id)}
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

        {/* Course grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 py-24">
            <BookOpen size={44} style={{ color: C.outline }} />
            <p className="text-[15px] font-medium" style={{ color: C.onVariant }}>
              Không có khóa học nào trong danh mục này
            </p>
            <button
              onClick={() => handleCatChange(null)}
              className="mt-2 px-5 py-2 rounded-lg text-[13px] font-semibold text-white transition-colors"
              style={{ backgroundColor: C.secondary }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.secondary)}
            >
              Xem tất cả khóa học
            </button>
          </div>
        )}
      </div>
    </div>
  );
}