// features/learning/components/LessonSidebar.jsx
import { useState } from "react";

const C = {
  secondary: "#8c06d8",
  secondaryLight: "#f3daff",
  success: "#16a34a",
  successLight: "#dcfce7",
  warning: "#d97706",
  warningLight: "#fef3c7",
  onVariant: "#44474a",
  outline: "#c5c6ca",
  surfaceLow: "#f6f3f2",
};

// Icon cho từng loại bài học
function LessonIcon({ type, completed, isActive, isLocked, index }) {
  // Bị khóa → icon ổ khóa xám
  if (isLocked) {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor"
          strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
    );
  }

  // Exercise (bài tập) luôn dùng icon riêng
  if (type === "EXERCISE") {
    return (
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: C.secondaryLight }}
      >
        <svg className="w-3.5 h-3.5" style={{ color: C.secondary }}
          fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      </div>
    );
  }

  // Completed → tick xanh
  if (completed) {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: C.success }}>
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor"
          strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  // Đang active → play icon tím
  if (isActive) {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: C.secondary }}>
        <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    );
  }

  // Chưa học → số thứ tự
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-gray-200 bg-white">
      <span className="text-xs font-semibold text-gray-400">{index}</span>
    </div>
  );
}

function ChapterItem({ chapter, activeLessonId, onLessonClick, isLessonLocked }) {
  const lessons = chapter.lessons ?? [];
  const completedCount = lessons.filter((l) => l.completed).length;
  const total = lessons.length;
  const isChapterCompleted = total > 0 && completedCount === total;
  const isChapterInProgress = completedCount > 0 && completedCount < total;

  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-b last:border-0" style={{ borderColor: C.outline }}>
      {/* Chapter header */}
      <button
        className="w-full flex items-start gap-3 px-4 py-3.5 transition-colors text-left hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0 mt-0.5">
          {isChapterCompleted && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: C.successLight }}>
              <svg className="w-3 h-3" style={{ color: C.success }} fill="none" stroke="currentColor"
                strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {isChapterInProgress && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: C.warningLight }}>
              <svg className="w-3 h-3" style={{ color: C.warning }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
          {!isChapterCompleted && !isChapterInProgress && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-100">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug text-gray-900">
            {chapter.title}
          </p>
          <p className="text-xs mt-0.5 font-medium"
            style={{ color: isChapterCompleted ? C.success : isChapterInProgress ? C.secondary : "#9ca3af" }}>
            {completedCount} / {total} bài học
            {isChapterCompleted && " • Đã hoàn thành"}
          </p>
        </div>

        <svg
          className={`w-4 h-4 flex-shrink-0 mt-1 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          style={{ color: C.onVariant }}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Lesson list */}
      {expanded && (
        <div>
          {lessons.map((lesson, idx) => {
            const isActive = lesson.id === activeLessonId;
            const locked = isLessonLocked?.(lesson.id) ?? false;

            return (
              <button
                key={lesson.id}
                onClick={() => !locked && onLessonClick?.(lesson.id)}
                disabled={locked}
                title={locked ? "Hoàn thành bài trước để mở khóa" : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${isActive ? "border-l-4 bg-purple-50" : ""}
                  ${locked ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                style={isActive ? { borderLeftColor: C.secondary } : {}}
              >
                <LessonIcon
                  type={lesson.type}
                  completed={lesson.completed}
                  isActive={isActive}
                  isLocked={locked}
                  index={idx + 1}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs leading-snug ${isActive ? "font-semibold" : locked ? "text-gray-400" : "text-gray-700"}`}
                    style={isActive ? { color: "#4c0075" } : {}}
                  >
                    <span style={{
                      display: 'inline-block',
                      fontSize: 10, fontWeight: 700,
                      color: isActive ? '#8c06d8' : '#9ca3af',
                      background: isActive ? '#f3daff' : '#f3f4f6',
                      border: `1px solid ${isActive ? '#d8b4fe' : '#e5e7eb'}`,
                      borderRadius: 4,
                      padding: '1px 5px',
                      marginRight: 6,
                      verticalAlign: 'middle',
                      flexShrink: 0,
                    }}>
                      Bài {idx + 1}
                    </span>
                    {lesson.title}
                  </p>
                  {locked ? (
                    <p className="text-xs mt-0.5 text-gray-400 italic">Chưa mở khóa</p>
                  ) : lesson.duration ? (
                    <p className="text-xs mt-0.5 flex items-center gap-1 text-gray-400">
                      <svg className="w-3 h-3 inline flex-shrink-0" fill="none" stroke="currentColor"
                        strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {lesson.duration}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LessonSidebar({ chapters = [], activeLessonId, onLessonClick, isLessonLocked }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {chapters.map((chapter) => (
          <ChapterItem
            key={chapter.id}
            chapter={chapter}
            activeLessonId={activeLessonId}
            onLessonClick={onLessonClick}
            isLessonLocked={isLessonLocked}
          />
        ))}
      </div>
    </div>
  );
}