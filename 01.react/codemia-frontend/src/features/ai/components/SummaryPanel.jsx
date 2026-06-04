// features/ai/components/SummaryPanel.jsx
// Used in: features/learning/pages/LearningPage.jsx
import { useState, useEffect } from "react";
import { getLessonSummary } from "../api/ai.api";

const C = {
  secondary: "#8c06d8",
  secondaryLight: "#f3daff",
};

/**
 * Parse string tóm tắt từ BE thành array summaryItems cho UI.
 *
 * BE trả về dạng:
 *   "- **Khái niệm X**: mô tả\n- **Khái niệm Y**: mô tả"
 *   hoặc numbered list "1. ...\n2. ..."
 *
 * Output: [{ time: "00:00", label: "Khái niệm X", text: "mô tả" }, ...]
 */
function parseSummary(raw) {
  if (!raw) return [];

  const lines = raw
    .split("\n")
    .map((l) => l.replace(/^[-*\d.]+\s*/, "").trim()) // bỏ "- " hoặc "1. "
    .filter(Boolean);

  return lines.map((line, i) => {
    // Tách "**Label**: text" hoặc "Label: text"
    const match = line.match(/^\*{0,2}([^:*]+)\*{0,2}:\s*(.+)$/);
    if (match) {
      return { time: "00:00", label: match[1].trim(), text: match[2].trim() };
    }
    return { time: "00:00", label: `Điểm ${i + 1}`, text: line };
  });
}

/**
 * Hook fetch summary — dùng trong component cha hoặc trực tiếp ở đây.
 * Export ra để parent có thể dùng nếu muốn.
 */
export function useLessonSummary(lessonId) {
  const [summaryItems, setSummaryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lessonId) return;
    setIsLoading(true);
    setError(null);

    getLessonSummary(lessonId)
      .then((res) => {
        // BE: { code, result: { lessonId, summary, fromCache, usedProvider } }
        const raw = res.result?.summary ?? res.data?.result?.summary ?? "";
        setSummaryItems(parseSummary(raw));
      })
      .catch(() => setError("Không thể tải tóm tắt. Vui lòng thử lại."))
      .finally(() => setIsLoading(false));
  }, [lessonId]);

  return { summaryItems, isLoading, error };
}

// ─────────────────────────────────────────────
// UI Component (không đổi giao diện)
// ─────────────────────────────────────────────
export default function SummaryPanel({
  lessonId = null,          // truyền lessonId để tự fetch
  lessonTitle = "",
  summaryItems: propItems,  // hoặc truyền sẵn items từ ngoài
  isLoading: propLoading,
  onTimestampClick = null,
}) {
  // Nếu parent truyền sẵn data thì dùng, không thì tự fetch
  const { summaryItems: fetchedItems, isLoading: fetchLoading, error } =
    useLessonSummary(lessonId);

  const summaryItems = propItems ?? fetchedItems;
  const isLoading    = propLoading ?? fetchLoading;

  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex-shrink-0 animate-pulse"
            style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }} />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded-full animate-pulse w-40" />
            <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-28" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-6 w-14 rounded-md animate-pulse flex-shrink-0"
                style={{ background: C.secondaryLight }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-3 bg-gray-100 rounded-full animate-pulse w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
            <svg className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Nội dung chính bài học</p>
            {lessonTitle && (
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{lessonTitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1"
            style={{ color: C.secondary, borderColor: C.secondary, background: "#fdf5ff" }}>
            <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor"
              strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            AI Tóm tắt
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? "" : "rotate-180"}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 text-center py-4">{error}</p>
      )}

      {/* Summary items */}
      {expanded && !error && (
        <div className="space-y-4">
          {summaryItems.length > 0 ? summaryItems.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full"
                style={{ background: C.secondary }}
              />
              <p className="text-sm text-gray-700 leading-relaxed">
                {item.label && item.label !== `Điểm ${i + 1}` ? (
                  <><span className="font-semibold text-gray-900">{item.label}</span>{" "}{item.text}</>
                ) : item.text}
              </p>
            </div>
          )) : (
            <p className="text-sm text-gray-400 text-center py-6">
              Chưa có tóm tắt. Hãy bắt đầu xem video!
            </p>
          )}
        </div>
      )}
    </div>
  );
}