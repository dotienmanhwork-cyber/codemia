// src/features/course-detail/components/CourseCurriculum.jsx
import { useState } from "react";

// Tái tạo lại Component Icon chuẩn từ file UI gốc, 
// sử dụng class cd-ms đã được cấu hình trong index.css
const Icon = ({ name, filled, size = 24, style }) => (
  <span
    className="cd-ms"
    style={{
      fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
      fontSize: size,
      ...style,
    }}
  >
    {name}
  </span>
);

export default function CourseCurriculum({ sections = [] }) {
  // Mở mặc định chương đầu tiên
  const defaultOpen = sections.length > 0 ? { [sections[0].id]: true } : {};
  const [openSections, setOpenSections] = useState(defaultOpen);

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allOpen = {};
    sections.forEach((s) => (allOpen[s.id] = true));
    setOpenSections(allOpen);
  };

  // Hàm chuyển đổi giây -> Phút:Giây (VD: 03:15)
  const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Hàm chuyển đổi giây -> Giờ & Phút
  const formatTotalTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return "0 phút";
    if (totalSeconds < 60) return "< 1 phút";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
  };

  // Tính toán tổng số liệu
  const totalLessons = sections.reduce((total, sec) => total + (sec.lessons?.length || 0), 0);
  const totalCourseDuration = sections.reduce(
    (total, sec) => total + (sec.lessons?.reduce((sum, l) => sum + (l.duration || 0), 0) || 0),
    0
  );

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-5 text-[#1c1b1b]">Nội dung khóa học</h2>

      {/* Header thống kê */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-[#6a6f73]">
          {sections.length} phần • {totalLessons} bài học • {formatTotalTime(totalCourseDuration)}
        </span>
        <button className="text-[var(--cd-purple)] font-semibold text-sm border-none bg-transparent cursor-pointer ml-3 hover:underline" onClick={expandAll}>
          Mở rộng tất cả
        </button>
      </div>

      {/* Danh sách Chương */}
      <div className="border border-[var(--cd-outline)] rounded-lg overflow-hidden">
        {sections.map((section) => {
          const isOpen = openSections[section.id];
          const lessonCount = section.lessons?.length || 0;
          const sectionDuration = section.lessons?.reduce((sum, l) => sum + (l.duration || 0), 0) || 0;

          return (
            <div key={section.id} className="border-b border-[var(--cd-outline)] last:border-b-0">
              {/* Nút bấm của mỗi chương */}
              <button className="w-full flex justify-between items-center p-[16px_24px] bg-[#f7f9fa] border-none border-b border-[var(--cd-outline)] cursor-pointer transition-colors duration-200 hover:bg-[#edeff0]" onClick={() => toggleSection(section.id)}>
                <div className="flex items-center gap-3">
                  <Icon name={isOpen ? "expand_less" : "expand_more"} size={24} />
                  <span className="font-bold text-base text-[#1c1b1b]">{section.title}</span>
                </div>
                <span className="text-[13px] text-[#6a6f73]">
                  {lessonCount} bài học • {formatTotalTime(sectionDuration)}
                </span>
              </button>

              {/* Danh sách bài học (Chỉ hiện khi isOpen = true) */}
              {isOpen && section.lessons && section.lessons.length > 0 && (
                <div className="bg-white">
                  {section.lessons.map((lesson, lessonIdx) => (
                    <div key={lesson.id} className="flex justify-between p-[12px_24px_12px_48px] text-sm border-b border-[#f1f3f5] last:border-b-0">
                      <div className="flex gap-3 text-[#2d2f31] items-start">
                        <Icon 
                          name={
                            lesson.type === "VIDEO" 
                              ? "ondemand_video" 
                              : lesson.type === "EXERCISE" 
                                ? "code" 
                                : "article"
                          } 
                          size={16}
                          style={{ marginTop: 2, flexShrink: 0 }}
                        />
                        <span className={`flex items-start gap-2 ${lesson.isFreePreview ? "text-[var(--cd-purple)] underline cursor-pointer" : ""}`}>
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: '#9ca3af',
                            background: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            borderRadius: 4,
                            padding: '1px 6px',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                            marginTop: 2,
                          }}>
                            Bài {lessonIdx + 1}
                          </span>
                          {lesson.title}
                        </span>
                      </div>
                      <span className="text-[#6a6f73] text-[13px]">
                        {lesson.type === 'VIDEO' && lesson.duration > 0
                          ? formatDuration(lesson.duration)
                          : null}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}