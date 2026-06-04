// features/learning/components/TestResultPanel.jsx
// FIX: Thêm empty state placeholder khi status = null

import { useState } from "react";

function StatusBadge({ status }) {
  const map = {
    running: { label: "Đang chạy...", bg: "bg-blue-900/40",   text: "text-blue-300",   dot: "bg-blue-400"   },
    passed:  { label: "Passed",       bg: "bg-green-900/40",  text: "text-green-300",  dot: "bg-green-400"  },
    failed:  { label: "Failed",       bg: "bg-red-900/40",    text: "text-red-300",    dot: "bg-red-400"    },
    error:   { label: "Error",        bg: "bg-orange-900/40", text: "text-orange-300", dot: "bg-orange-400" },
  };
  const m = map[status];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot} ${status === "running" ? "animate-pulse" : ""}`} />
      {m.label}
    </span>
  );
}

function BeStatusBadge({ beStatus }) {
  if (!beStatus) return null;
  const isPassed = beStatus === "PASSED";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
      isPassed
        ? "bg-green-900/50 text-green-300 border-green-700/50"
        : "bg-orange-900/50 text-orange-300 border-orange-700/50"
    }`}>
      {isPassed ? "✓ PASSED" : "⟳ SUBMITTED"}
    </span>
  );
}

function ScoreSummary({ testCases, isSubmit, beStatus }) {
  const total = testCases.length;
  if (total === 0) return null;
  const passedCount = testCases.filter((tc) => tc.status === "passed").length;
  const pct    = Math.round((passedCount / total) * 100);
  const isPassed = beStatus ? beStatus === "PASSED" : pct >= 85;
  const needed = isPassed ? 0 : Math.ceil(total * 0.85) - passedCount;

  return (
    <div className="px-4 py-3 border-b border-gray-700/50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-200">{passedCount}/{total} yêu cầu đạt</span>
          <span className={`text-xs font-semibold ${isPassed ? "text-green-400" : "text-red-400"}`}>({pct}%)</span>
        </div>
        {isSubmit && (
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
            isPassed
              ? "bg-green-900/50 text-green-300 border-green-700/50"
              : "bg-red-900/50 text-red-300 border-red-700/50"
          }`}>
            {isPassed ? "✓ Đạt" : "✗ Chưa đạt"}
          </span>
        )}
      </div>
      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isPassed ? "bg-green-500" : pct > 0 ? "bg-red-500" : "bg-gray-600"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isSubmit && !isPassed && needed > 0 && (
        <p className="text-xs text-gray-500">
          Cần thêm <span className="text-orange-400 font-semibold">{needed} yêu cầu</span> nữa để đạt.
        </p>
      )}
    </div>
  );
}

function AIFeedbackPanel({ aiFeedback }) {
  const [open, setOpen] = useState(false);
  if (!aiFeedback) return null;
  return (
    <div className="mx-4 my-3 rounded-lg border border-purple-700/40 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-purple-900/20 hover:bg-purple-900/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-purple-300">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Nhận xét của AI
        </span>
        <svg className={`w-3.5 h-3.5 text-purple-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-3 py-2.5 bg-purple-900/10">
          <p className="text-xs text-purple-200 leading-relaxed">{aiFeedback}</p>
        </div>
      )}
    </div>
  );
}

function TestCaseRow({ tc, index }) {
  const icons = {
    passed: (
      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    failed: (
      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    running: (
      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    ),
  };

  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-b border-gray-700/50 last:border-0 ${
      tc.status === "failed" ? "bg-red-900/10" : ""
    }`}>
      <div className="flex-shrink-0 mt-0.5">{icons[tc.status] ?? icons.running}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-gray-300">{tc.label ?? `Test ${index + 1}`}</span>
        </div>
        {tc.status === "failed" && tc.expected && tc.got && (
          <div className="mt-1 space-y-1">
            <p className="text-xs text-gray-400 font-mono">
              <span className="text-gray-500">expected: </span>
              <span className="text-green-400">{tc.expected}</span>
            </p>
            <p className="text-xs text-gray-400 font-mono">
              <span className="text-gray-500">got:      </span>
              <span className="text-red-400">{tc.got}</span>
            </p>
          </div>
        )}
        {tc.status === "failed" && tc.message && (
          <p className="text-xs text-red-300 font-mono mt-1">{tc.message}</p>
        )}
        {tc.status === "passed" && tc.message && (
          <p className="text-xs text-green-400/80 mt-1">{tc.message}</p>
        )}
      </div>
      {tc.time && <span className="text-xs text-gray-600 flex-shrink-0">{tc.time}</span>}
    </div>
  );
}

// FIX: Empty state khi chưa chạy lần nào
function EmptyState() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3">
      {/* Icon terminal nhỏ */}
      <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
      <p className="text-xs text-gray-500">
        Nhấn{" "}
        <span className="text-gray-400 font-semibold">Chạy thử nghiệm</span>
        {" "}để xem kết quả tại đây.
      </p>
    </div>
  );
}

export default function TestResultPanel({
  status   = null,
  result   = null,
  error    = null,
  testCases = [],
  isSubmit  = false,
  score    = null,
  aiFeedback = null,
  beStatus = null,
  onAskAI,
  onRerun,
}) {
  const hasContent  = !!status;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="flex-shrink-0 border-t border-gray-700 bg-gray-900 flex flex-col transition-all duration-300 overflow-hidden"
      style={{ maxHeight: collapsed ? "44px" : hasContent ? "260px" : "80px" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-700 flex-shrink-0 min-h-[44px]">
        {hasContent && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Test Results</span>
        {status && <StatusBadge status={status} />}
        {isSubmit && beStatus && <BeStatusBadge beStatus={beStatus} />}
        {isSubmit && score != null && (
          <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${
            beStatus === "PASSED" ? "bg-green-900/40 text-green-300" : "bg-orange-900/40 text-orange-300"
          }`}>
            {score} điểm
          </span>
        )}
        {status && status !== "running" && status !== "error" && testCases.length > 0 && !isSubmit && (
          <span className="text-xs text-gray-500 tabular-nums">
            {testCases.filter((tc) => tc.status === "passed").length}/{testCases.length}
          </span>
        )}

        <div className="flex-1" />

        {status === "passed" && result && !isSubmit && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {result.time && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {result.time}
              </span>
            )}
            {result.memory && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                </svg>
                {result.memory}
              </span>
            )}
          </div>
        )}

        {(status === "failed" || status === "error") && onAskAI && !aiFeedback && (
          <button
            onClick={onAskAI}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366F1, #A855F7)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            AI Giải thích lỗi
          </button>
        )}

        {onRerun && status && (
          <button
            onClick={onRerun}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
            title="Chạy lại"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Body ── */}
      {/* FIX: Khi chưa có kết quả (status=null) → hiện empty state thay vì khoảng trống */}
      {!hasContent ? (
        <EmptyState />
      ) : (
        <div className="flex-1 overflow-y-auto relative">
          {status === "error" && error && (
            <div className="p-4">
              <div className="bg-red-900/25 border border-red-800/40 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-red-400 uppercase">{error.type}</span>
                  {error.location && <span className="text-xs text-gray-500">at {error.location}</span>}
                </div>
                <p className="text-xs text-red-300 font-mono">{error.message}</p>
                {error.code && (
                  <div className="mt-2 bg-gray-900 rounded px-3 py-2 font-mono text-xs text-gray-300 border border-gray-700">
                    <span className="text-gray-500 mr-3">{error.lineNum}</span>
                    {error.code}
                  </div>
                )}
              </div>
            </div>
          )}

          {testCases.length > 0 && status !== "error" && (
            <div>
              <ScoreSummary testCases={testCases} isSubmit={isSubmit} beStatus={beStatus} />
              {testCases.map((tc, i) => (
                <TestCaseRow key={tc.id ?? i} tc={tc} index={i} />
              ))}
            </div>
          )}

          {isSubmit && aiFeedback && <AIFeedbackPanel aiFeedback={aiFeedback} />}

          <div className="sticky bottom-0 h-5 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
        </div>
      )}
    </div>
  );
}