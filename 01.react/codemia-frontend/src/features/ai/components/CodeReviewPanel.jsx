// features/ai/components/CodeReviewPanel.jsx
// Note: This panel is currently registered as a reusable layout but not directly imported in active JSX views.
import { useState } from "react";
import { reviewCode } from "../api/ai.api";

const SEVERITY_CONFIG = {
  error:   { label: "Lỗi",      bg: "bg-red-900/30",    border: "border-red-800/50",    text: "text-red-300",    icon: "❌" },
  warning: { label: "Cảnh báo", bg: "bg-orange-900/30", border: "border-orange-800/50", text: "text-orange-300", icon: "⚠️" },
  info:    { label: "Gợi ý",    bg: "bg-blue-900/30",   border: "border-blue-800/50",   text: "text-blue-300",   icon: "💡" },
  success: { label: "Tốt",      bg: "bg-green-900/30",  border: "border-green-800/50",  text: "text-green-300",  icon: "✅" },
};

/**
 * Parse string review từ BE thành reviewItems cho UI.
 *
 * BE trả về text thuần như:
 *   "❌ Lỗi: thiếu dấu chấm phẩy\n⚠️ Cảnh báo: biến chưa dùng\n💡 Gợi ý: dùng const"
 *   hoặc dạng gạch đầu dòng không có icon.
 *
 * Heuristic: detect icon để gán severity, fallback về "info".
 */
function parseReview(raw) {
  if (!raw) return [];

  const lines = raw
    .split("\n")
    .map((l) => l.replace(/^[-*\d.]+\s*/, "").trim())
    .filter(Boolean);

  return lines.map((line) => {
    let severity = "info";
    if (/^❌|lỗi|error/i.test(line))         severity = "error";
    else if (/^⚠️|cảnh báo|warning/i.test(line)) severity = "warning";
    else if (/^✅|tốt|good|ok/i.test(line))   severity = "success";

    // Bỏ icon/emoji ở đầu nếu có
    const title = line.replace(/^[❌⚠️✅💡]\s*/, "").trim();

    return { severity, title, explanation: null, fix: null, location: null };
  });
}

// ─────────────────────────────────────────────
// Hook — gọi từ ngoài để trigger review
// ─────────────────────────────────────────────
export function useCodeReview() {
  const [reviewItems, setReviewItems] = useState([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState(null);

  const runReview = async ({ code, language, context }) => {
    if (!code?.trim()) return;
    setIsLoading(true);
    setError(null);
    setReviewItems([]);

    try {
      const res = await reviewCode({ code, language, context });
      // BE: { code, result: { review, language, usedProvider } }
      const raw = res.data?.result?.review ?? "";
      setReviewItems(parseReview(raw));
    } catch {
      setError("AI review tạm thời không khả dụng.");
    } finally {
      setIsLoading(false);
    }
  };

  return { reviewItems, isLoading, error, runReview };
}

// ─────────────────────────────────────────────
// Sub-component ReviewItem (không đổi)
// ─────────────────────────────────────────────
function ReviewItem({ item }) {
  const [open, setOpen] = useState(true);
  const cfg = SEVERITY_CONFIG[item.severity] ?? SEVERITY_CONFIG.info;

  return (
    <div className={`rounded-lg border ${cfg.bg} ${cfg.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-2.5 p-3 text-left"
      >
        <span className="text-base flex-shrink-0 leading-none mt-0.5">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>
              {cfg.label}
            </span>
            {item.location && (
              <span className="text-xs text-gray-500 font-mono">{item.location}</span>
            )}
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{item.title}</p>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5 transition-transform ${open ? "" : "-rotate-90"}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {item.explanation && (
            <p className="text-xs text-gray-400 leading-relaxed">{item.explanation}</p>
          )}
          {item.fix && (
            <div className="bg-gray-900 rounded-lg p-3 font-mono border border-gray-700">
              <p className="text-xs text-gray-500 mb-1">Sửa thành:</p>
              <pre className="text-xs text-green-400 whitespace-pre-wrap">{item.fix}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function CodeReviewPanel({
  isLoading = false,
  reviewItems = [],
  errorSummary = null,
  error = null,
  onClose,
}) {
  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-700 bg-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366F1, #A855F7)" }}>
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">AI Code Review</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-2.5">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-700/50 rounded-lg p-3 animate-pulse space-y-2">
                <div className="h-3 bg-gray-600 rounded w-1/3" />
                <div className="h-2.5 bg-gray-600 rounded w-full" />
                <div className="h-2.5 bg-gray-600 rounded w-4/5" />
              </div>
            ))}
          </div>
        )}

        {/* API error */}
        {!isLoading && error && (
          <p className="text-xs text-red-400 text-center py-4">{error}</p>
        )}

        {/* Error summary block */}
        {!isLoading && errorSummary && (
          <div className="bg-red-900/25 border border-red-800/40 rounded-lg p-3 mb-1">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">
              {errorSummary.type}
            </p>
            <p className="text-xs text-red-300 font-mono">{errorSummary.message}</p>
          </div>
        )}

        {/* Review items */}
        {!isLoading && reviewItems.map((item, i) => (
          <ReviewItem key={i} item={item} />
        ))}

        {/* Empty state */}
        {!isLoading && !error && !errorSummary && reviewItems.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "linear-gradient(135deg, #6366F1, #A855F7)" }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Chạy code để nhận phản hồi từ AI</p>
          </div>
        )}
      </div>
    </div>
  );
}