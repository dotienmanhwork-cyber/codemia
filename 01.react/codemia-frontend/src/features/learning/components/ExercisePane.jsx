// features/learning/components/ExercisePane.jsx
// Props: { exercise, lessonId, onComplete, onRewatch }
//
// exercise shape (from ExercisePage):
//   { id, tag, time, title, description, requirements[], starterCode, fileName, language }

import { useState, useEffect } from "react";
import CodeEditor from "./CodeEditor";
import TestResultPanel from "./TestResultPanel";
import { runCode, submitExercise } from "../api/learning.api";
import { explainError } from "../../ai/api/ai.api";

// ─── Custom scrollbar styles ─────────────────────────────────────────────────
const scrollbarCSS = `
  .exercise-scroll {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    transition: scrollbar-color 0.2s;
  }
  .exercise-scroll:hover {
    scrollbar-color: rgba(139, 92, 246, 0.4) transparent;
  }
  .exercise-scroll::-webkit-scrollbar { width: 4px; }
  .exercise-scroll::-webkit-scrollbar-track { background: transparent; }
  .exercise-scroll::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 99px;
    transition: background 0.2s;
  }
  .exercise-scroll:hover::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.4); }
  .exercise-scroll:hover::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.7); }
`;

function InjectScrollbarStyle() {
  return <style>{scrollbarCSS}</style>;
}

// ─── Language badge map ───────────────────────────────────────────────────────
const LANG_LABEL = {
  java: { label: "Java", color: "#f89820" },
  javascript: { label: "JavaScript", color: "#f0db4f" },
  typescript: { label: "TypeScript", color: "#3178c6" },
  python: { label: "Python", color: "#4584b6" },
  cpp: { label: "C++", color: "#659ad2" },
  c: { label: "C", color: "#555555" },
  go: { label: "Go", color: "#00ADD8" },
  rust: { label: "Rust", color: "#ce422b" },
};

function LanguageBadge({ language }) {
  const lang = language?.toLowerCase();
  const meta = LANG_LABEL[lang] ?? { label: language ?? "Code", color: "#9ca3af" };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded"
      style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}44` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

// ─── Map run/test response → internal shape cho TestResultPanel ───────────────
function mapRunResult(data) {
  const testCases = (data.testCases ?? data.tests ?? []).map((tc, i) => {
    let tcStatus;
    if (typeof tc.passed === "boolean") {
      tcStatus = tc.passed ? "passed" : "failed";
    } else {
      tcStatus = tc.status === "pass" ? "passed"
        : tc.status === "fail" ? "failed"
          : tc.status ?? "failed";
    }
    return {
      id: tc.id ?? tc.index ?? i,
      label: tc.label ?? tc.name ?? tc.description ?? `Test ${i + 1}`,
      status: tcStatus,
      time: tc.time ?? tc.duration ?? null,
      message: tc.message ?? null,
      expected: tc.expected ?? null,
      got: tc.actual ?? tc.got ?? null,
    };
  });

  const allPassed = testCases.length > 0 && testCases.every((tc) => tc.status === "passed");
  const status = data.status ?? (allPassed ? "passed" : "failed");

  const error = data.error
    ? {
      type: data.error.type ?? "Error",
      location: data.error.location ?? null,
      message: data.error.message ?? "Unknown error",
      lineNum: data.error.lineNum ?? data.error.line ?? null,
      code: data.error.code ?? null,
    }
    : null;

  const result = allPassed
    ? {
      time: data.summary?.time ?? null,
      memory: data.summary?.memory ?? null,
      count: testCases.length,
      message: data.summary?.message ?? `Tất cả ${testCases.length} test cases đều passed.`,
    }
    : null;

  return { status, testCases, error, result };
}

// ─── Map Piston /run response → internal shape cho TestResultPanel ────────────
function mapPistonRunResult(data) {
  if (Array.isArray(data?.testCases) && data.testCases.length > 0) {
    return mapRunResult(data);
  }

  const hasError = data?.hasError ?? false;
  const hasIssues = (data?.issues?.length ?? 0) > 0;
  const status = hasError || hasIssues ? "failed" : "passed";

  const errorMsg = data?.errorMessage ?? data?.errorExplanation ?? null;
  const errorType = data?.errorType ?? "Run Error";

  const issueCases = (data?.issues ?? []).map((issue, i) => ({
    id: i,
    label: `Vấn đề ${i + 1}`,
    status: "failed",
    time: null,
    message: typeof issue === "string"
      ? issue
      : (issue.message ?? issue.detail ?? issue.description ?? null),
    expected: typeof issue === "object" ? (issue.expected ?? null) : null,
    got: typeof issue === "object" ? (issue.actual ?? issue.got ?? null) : null,
  }));

  const errorRow = hasError && errorMsg
    ? [{
      id: "ai-error",
      label: errorType,
      status: "failed",
      time: null,
      message: errorMsg,
      expected: null,
      got: null,
    }]
    : [];

  const summaryRows = !hasError && !hasIssues
    ? [{
      id: "ai-ok",
      label: "Kết quả AI review",
      status: "passed",
      time: null,
      message: data?.message ?? "Code chạy thành công, không phát hiện vấn đề.",
      expected: null,
      got: null,
    }]
    : [...errorRow, ...issueCases];

  return { status, testCases: summaryRows, error: null, result: null };
}

// ─── Map submit response → internal shape ────────────────────────────────────
function mapSubmitResult(data) {
  const testCases = (data.requirementResults ?? []).map((r, i) => ({
    id: i,
    label: r.requirement ?? `Yêu cầu ${i + 1}`,
    status: r.passed ? "passed" : "failed",
    message: r.note ?? null,
    expected: null,
    got: null,
    time: null,
  }));

  const beStatus = data.status ?? (data.passed ? "PASSED" : "SUBMITTED");
  const panelStatus = beStatus === "PASSED" ? "passed" : "failed";

  return {
    status: panelStatus,
    testCases,
    error: null,
    result: null,
    score: data.score ?? null,
    aiFeedback: data.aiFeedback ?? null,
    passed: data.passed ?? false,
    canRetry: data.canRetry ?? !data.passed,
    message: data.message ?? null,
    lessonCompleted: data.lessonCompleted ?? false,
    hasNextLesson: data.hasNextLesson ?? false,
    nextLessonId: data.nextLessonId ?? null,
    nextLessonTitle: data.nextLessonTitle ?? null,
    attemptNumber: data.attemptNumber ?? null,
    beStatus,
  };
}

// ─── Description panel ────────────────────────────────────────────────────────
function ExerciseDescription({ exercise }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-gray-900 border-b border-gray-700 flex-shrink-0">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/50">
          {exercise.tag}
        </span>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {exercise.time}
        </span>
        {exercise.language && <LanguageBadge language={exercise.language} />}
        <h2 className="text-sm font-semibold text-gray-100 flex-1 truncate">{exercise.title}</h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1 flex-shrink-0"
        >
          {expanded ? "Thu gọn" : "Xem đề bài"}
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? "400px" : "0px", opacity: expanded ? 1 : 0 }}
      >
        <div className="px-4 pb-4 space-y-3 border-t border-gray-700/60">
          <p className="text-xs text-gray-400 leading-relaxed pt-3">{exercise.description}</p>
          {exercise.requirements?.length > 0 && (
            <ul className="space-y-1.5">
              {exercise.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                  <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  {req}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI Explain sidebar ───────────────────────────────────────────────────────
function AIExplainPanel({ error, testCases, code, language, onClose }) {
  const [aiText, setAiText]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Gộp tất cả lỗi thành 1 chuỗi gửi cho AI
  const errorMessage = (() => {
    const parts = [];
    if (error?.message) parts.push(`${error.type ?? "Error"}: ${error.message}`);
    testCases
      .filter((tc) => tc.status === "failed")
      .forEach((tc) => {
        let msg = tc.label ?? "";
        if (tc.message) msg += ` — ${tc.message}`;
        if (tc.expected != null) msg += ` (expected: ${tc.expected}, got: ${tc.got})`;
        parts.push(msg);
      });
    return parts.join("\n") || "Không rõ lỗi";
  })();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAiText(null);
    setFetchError(null);

    explainError({ code, language: language ?? "java", errorMessage })
      .then((res) => {
        if (cancelled) return;
        const text = res?.data?.result ?? res?.result ?? res?.data ?? res;
        setAiText(typeof text === "string" ? text : JSON.stringify(text));
      })
      .catch(() => {
        if (!cancelled) setFetchError("AI tạm thời không khả dụng. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []); // chỉ gọi 1 lần khi mở panel

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 border-l border-gray-700 bg-gray-900/95 backdrop-blur-sm flex flex-col min-h-0 overflow-hidden shadow-2xl z-20">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6366F1, #A855F7)" }}
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-200 flex-1">AI Giải thích lỗi</span>
        <button onClick={onClose} className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 exercise-scroll">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">AI đang phân tích lỗi...</p>
          </div>
        )}

        {/* Lỗi gọi API */}
        {!loading && fetchError && (
          <p className="text-xs text-red-400 text-center py-6">{fetchError}</p>
        )}

        {/* Giải thích từ AI */}
        {!loading && aiText && (
          <div className="rounded-lg p-3 border bg-purple-900/20 border-purple-800/40">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-bold uppercase text-purple-400">Giải thích</span>
            </div>
            <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">{aiText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ExercisePane ────────────────────────────────────────────────────────
export default function ExercisePane({ exercise, lessonId, onComplete, onRewatch }) {
  const [code, setCode] = useState(exercise?.starterCode ?? "");

  // Test run state
  const [testStatus, setTestStatus] = useState(null);
  const [testCases, setTestCases]   = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError]   = useState(null);
  const [runLoading, setRunLoading] = useState(false);

  // Submit state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isSubmitResult, setIsSubmitResult] = useState(false);

  // Extra submit meta (score, aiFeedback, canRetry...) cho TestResultPanel
  const [submitMeta, setSubmitMeta] = useState(null);

  // Chỉ cho phép nộp bài sau khi đã chạy thử ít nhất 1 lần
  const [hasRunOnce, setHasRunOnce] = useState(false);

  // AI panel
  const [showAIPanel, setShowAIPanel] = useState(false);

  // ── Run tests ───────────────────────────────────────────────────────────────
  const handleRunTests = async () => {
    if (runLoading) return;
    setRunLoading(true);
    setTestStatus("running");
    setTestCases([]);
    setTestResult(null);
    setTestError(null);
    setIsSubmitResult(false);
    setSubmitMeta(null);
    setShowAIPanel(false);

    try {
      const res = await runCode(exercise.id, {
        code,
        language: exercise.language ?? "java",
        codeType: exercise.codeType ?? "STANDARD",
      });
      const raw    = res?.result ?? res?.data ?? res;
      const mapped = mapPistonRunResult(raw);
      setTestStatus(mapped.status);
      setTestCases(mapped.testCases);
      setTestResult(mapped.result);
      setTestError(mapped.error);
      setHasRunOnce(true);
      setRunLoading(false);
    } catch (err) {
      const is403 = err?.response?.status === 403;
      setTestStatus("error");
      setTestError({
        type: is403 ? "Tính năng tạm tắt" : "Server Error",
        location: null,
        message: is403
          ? (err?.response?.data?.message ?? "Tính năng này đang tạm thời bị tắt.")
          : (err?.response?.data?.message ?? "Không thể kết nối tới server. Vui lòng thử lại."),
        lineNum: null,
        code: null,
      });
      setHasRunOnce(true);
      setRunLoading(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitLoading) return;
    setSubmitLoading(true);
    setIsSubmitResult(true);
    setTestStatus("running");
    setTestCases([]);
    setTestResult(null);
    setTestError(null);
    setSubmitMeta(null);
    setShowAIPanel(false);

    try {
      const res = await submitExercise(lessonId, {
        code,
        language: exercise.language ?? "java",
      });
      const raw    = res?.result ?? res?.data?.result ?? res?.data ?? res;
      const mapped = mapSubmitResult(raw);
      setTestStatus(mapped.status);
      setTestCases(mapped.testCases);
      setTestError(null);
      setTestResult(null);
      setSubmitMeta({
        score: mapped.score,
        aiFeedback: mapped.aiFeedback,
        beStatus: mapped.beStatus,
      });
      setSubmitLoading(false);
      onComplete?.(mapped);
    } catch (err) {
      const is403 = err?.response?.status === 403;
      setTestStatus("error");
      setTestError({
        type: is403 ? "Tính năng tạm tắt" : "Submit Error",
        location: null,
        message: is403
          ? (err?.response?.data?.message ?? "Tính năng này đang tạm thời bị tắt.")
          : (err?.response?.data?.message ?? "Nộp bài thất bại. Vui lòng thử lại."),
        lineNum: null,
        code: null,
      });
      setSubmitLoading(false);
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setCode(exercise?.starterCode ?? "");
    setTestStatus(null);
    setTestCases([]);
    setTestResult(null);
    setTestError(null);
    setIsSubmitResult(false);
    setSubmitMeta(null);
    setHasRunOnce(false);
    setShowAIPanel(false);
  };

  // ── Guard ───────────────────────────────────────────────────────────────────
  if (!exercise) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-gray-900 items-center justify-center">
        <InjectScrollbarStyle />
        <svg className="animate-spin h-6 w-6 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="mt-3 text-sm text-gray-400">Đang tải đề bài...</span>
      </div>
    );
  }

  const highlightLine = testStatus === "error" ? testError?.lineNum ?? null : null;
  const canSubmit     = hasRunOnce && !runLoading && !submitLoading;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-gray-900">
      <InjectScrollbarStyle />

      <ExerciseDescription exercise={exercise} />

      {/* Editor + AI panel (overlay) */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeEditor
              code={code}
              onChange={setCode}
              fileName={exercise?.fileName}
              language={exercise?.language}
              highlightLine={highlightLine}
              onReset={handleReset}
              scrollbarClassName="exercise-scroll"
            />
          </div>

          <TestResultPanel
            status={runLoading || submitLoading ? "running" : testStatus}
            result={testResult}
            error={testError}
            testCases={testCases}
            isSubmit={isSubmitResult}
            score={submitMeta?.score ?? null}
            aiFeedback={submitMeta?.aiFeedback ?? null}
            beStatus={submitMeta?.beStatus ?? null}
            onAskAI={() => setShowAIPanel(true)}
            onRerun={handleRunTests}
          />
        </div>

        {showAIPanel && (
          <AIExplainPanel
            error={testError}
            testCases={testCases}
            code={code}
            language={exercise?.language}
            onClose={() => setShowAIPanel(false)}
          />
        )}
      </div>

      {/* ── Action bar ── */}
      {/* FIX: visual hierarchy — Xem lại video (ghost) < Chạy thử nghiệm (secondary filled) < NỘP BÀI (primary) */}
      <div className="flex-shrink-0 h-12 bg-gray-800 border-t border-gray-700 flex items-center px-4 gap-2.5">
        {/* Lowest priority: ghost */}
        <button
          onClick={onRewatch}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-colors flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Xem lại video
        </button>

        <div className="flex-1" />

        {/* Medium priority: secondary filled (gray-700 bg) — nổi bật hơn outline cũ */}
        <button
          onClick={handleRunTests}
          disabled={runLoading || submitLoading}
          title="Kiểm tra code với một số test cases mẫu"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-gray-200 bg-gray-700 hover:bg-gray-600 border border-gray-600/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {runLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          )}
          Chạy thử nghiệm
        </button>

        {/* Nộp bài */}
        <div
          className="relative group"
          title={!hasRunOnce ? "Chạy thử nghiệm trước khi nộp bài" : "Nộp bài và chấm điểm chính thức"}
        >
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#8C06D8" }}
          >
            {submitLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                NỘP BÀI
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </>
            )}
          </button>

          {!hasRunOnce && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
              Hãy <span className="text-purple-300 font-semibold">Chạy thử nghiệm</span> trước để kiểm tra code của bạn.
              <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-700" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}