// features/learning/components/QuizPane.jsx
// REDESIGN: Light theme · one-question-per-card · 2×2 option grid · slide animation

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitExercise } from "../api/learning.api";

// ─── CSS: slide animation + option hover lift ─────────────────────────────────
const quizCSS = `
  @keyframes qEnterRight {
    from { opacity: 0; transform: translateX(52px) scale(0.97); }
    to   { opacity: 1; transform: translateX(0)    scale(1);    }
  }
  @keyframes qEnterLeft {
    from { opacity: 0; transform: translateX(-52px) scale(0.97); }
    to   { opacity: 1; transform: translateX(0)     scale(1);    }
  }
  .q-enter-right { animation: qEnterRight 0.28s cubic-bezier(0.4,0,0.2,1) both; }
  .q-enter-left  { animation: qEnterLeft  0.28s cubic-bezier(0.4,0,0.2,1) both; }

  .quiz-opt {
    transition: transform 0.16s ease, box-shadow 0.16s ease,
                border-color 0.15s ease, background 0.15s ease;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
    user-select: none;
  }
  .quiz-opt:not([disabled]):hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(109,40,217,0.16);
  }
  .quiz-opt:not([disabled]):active { transform: translateY(-2px); }

  .quiz-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(139,92,246,0.25) transparent;
  }
  .quiz-scroll::-webkit-scrollbar { width: 4px; }
  .quiz-scroll::-webkit-scrollbar-thumb {
    background: rgba(139,92,246,0.25); border-radius: 99px;
  }
`;

// ─── Progress pills (dots that expand for current) ────────────────────────────
function ProgressPills({ questions, currentIdx, answers }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {questions.map((q, i) => {
        const isAnswered = !!answers[q.orderIndex ?? i];
        const isCurrent  = i === currentIdx;
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width:      isCurrent ? "24px" : "10px",
              height:     "10px",
              background: isCurrent ? "#7C3AED"
                        : isAnswered ? "#A78BFA"
                        : "#E5E7EB",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Single question card ─────────────────────────────────────────────────────
// result shape: { correctAnswer, note, revealCorrect, isCorrectAnswer (bool per question) }
// revealCorrect = true  → student passed OR no more retries → highlight green answer
// revealCorrect = false → student failed but can retry   → only show explanation as hint
function QuestionCard({ question, index, total, selected, onSelect, result }) {
  const options = [
    { key: "A", text: question.optionA },
    { key: "B", text: question.optionB },
    { key: "C", text: question.optionC },
    { key: "D", text: question.optionD },
  ].filter((o) => o.text);

  const correctKey    = result?.correctAnswer;
  const revealCorrect = result?.revealCorrect ?? true;

  return (
    <div className="w-full">
      {/* Question block */}
      <div className="relative mb-7">
        {/* Decorative index */}
        <span
          className="absolute -top-3 -left-1 leading-none font-black select-none pointer-events-none"
          style={{ fontSize: "80px", color: "rgba(109,40,217,0.06)" }}
        >
          {index + 1}
        </span>

        <div className="relative">
          <span className="inline-block text-xs font-bold text-violet-500 uppercase tracking-widest mb-2">
            Câu {index + 1} / {total}
          </span>
          <p className="text-[15px] font-semibold text-gray-800 leading-relaxed">
            {question.questionText}
          </p>
        </div>
      </div>

      {/* 2×2 Options grid */}
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ key, text }) => {
          const isSelected = selected === key;
          // Tô xanh khi: (reveal mode + đây là đáp án đúng)
          // HOẶC: student chọn đúng → luôn highlight (không cần ẩn, biết mình đúng thì retry vẫn ok)
          const isCorrect  = result && (
            (revealCorrect && key === correctKey) ||
            (result.isCorrectAnswer && isSelected)
          );
          const isWrong    = result && isSelected && key !== correctKey;

          // Style logic
          let border    = "#E2E8F0";
          let bg        = "#F8FAFC";
          let badgeBg   = "linear-gradient(135deg,#E5E7EB,#D1D5DB)";
          let badgeText = "#6B7280";
          let textColor = "#374151";
          let shadow    = "none";

          if (!result && isSelected) {
            border    = "#7C3AED";
            bg        = "#F5F3FF";
            badgeBg   = "linear-gradient(135deg,#7C3AED,#6D28D9)";
            badgeText = "#FFFFFF";
            textColor = "#4C1D95";
            shadow    = "0 0 0 4px rgba(124,58,237,0.12)";
          }
          if (isCorrect) {
            border    = "#34D399";
            bg        = "#F0FDF9";
            badgeBg   = "linear-gradient(135deg,#10B981,#059669)";
            badgeText = "#FFFFFF";
            textColor = "#065F46";
            shadow    = "0 0 0 4px rgba(52,211,153,0.15)";
          }
          if (isWrong) {
            border    = "#F87171";
            bg        = "#FFF5F5";
            badgeBg   = "linear-gradient(135deg,#EF4444,#DC2626)";
            badgeText = "#FFFFFF";
            textColor = "#7F1D1D";
            shadow    = "0 0 0 4px rgba(248,113,113,0.15)";
          }

          return (
            <button
              key={key}
              disabled={!!result}
              onClick={() => !result && onSelect(key)}
              className="quiz-opt relative flex flex-col items-start gap-3 p-4 rounded-2xl border-2 text-left"
              style={{
                borderColor: border,
                background:  bg,
                boxShadow:   shadow,
              }}
            >
              {/* Letter badge */}
              <span
                className="w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center flex-shrink-0"
                style={{ background: badgeBg, color: badgeText }}
              >
                {key}
              </span>

              <span
                className="text-sm font-medium leading-snug"
                style={{ color: textColor }}
              >
                {text}
              </span>

              {/* Result icon (corner) — only show ✓ when reveal, always show ✗ for wrong */}
              {isCorrect && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              {isWrong && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Feedback area ── */}
      {result && (
        <>
          {/* Sai → generic message, không tiết lộ gì */}
          {!result.isCorrectAnswer && (
            <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-base flex-shrink-0 mt-0.5">🤔</span>
              <p className="text-sm text-amber-800 leading-relaxed">
                Câu trả lời chưa đúng. Hãy xem lại video và thử lại nhé!
              </p>
            </div>
          )}

          {/* Đúng + có giải thích → hiện explanation */}
          {result.isCorrectAnswer && result.note && (
            <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-base flex-shrink-0 mt-0.5">💡</span>
              <p className="text-sm text-blue-700 leading-relaxed">
                <span className="font-semibold">Giải thích: </span>{result.note}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Result summary shown after submit ───────────────────────────────────────
function ResultSummary({ submitResult, onRetry, onNextLesson, onContinue }) {
  const { score, passed, aiFeedback, canRetry, hasNextLesson, nextLessonTitle } = submitResult;
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Score card */}
      <div
        className="rounded-2xl p-6 text-center mb-5"
        style={{
          background: passed ? "linear-gradient(135deg,#F0FDF9,#DCFCE7)" : "linear-gradient(135deg,#FFF7ED,#FFEDD5)",
          border: `2px solid ${passed ? "#6EE7B7" : "#FED7AA"}`,
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl"
          style={{ background: passed ? "#D1FAE5" : "#FFE4CA" }}
        >
          {passed ? "🎉" : "💪"}
        </div>
        <p
          className="text-3xl font-black mb-1"
          style={{ color: passed ? "#065F46" : "#92400E" }}
        >
          {score}<span className="text-lg font-semibold opacity-60">/100</span>
        </p>
        <p className="text-sm font-semibold" style={{ color: passed ? "#059669" : "#D97706" }}>
          {passed
            ? "Xuất sắc! Đã hoàn thành bài quiz"
            : canRetry
              ? "Cố lên! Xem gợi ý và thử lại nhé"
              : "Xem lại đáp án bên dưới để hiểu rõ hơn"}
        </p>
      </div>

      {/* AI Feedback accordion */}
      {aiFeedback && (
        <div className="mb-5 rounded-xl border border-violet-200 overflow-hidden">
          <button
            onClick={() => setFeedbackOpen(v => !v)}
            className="w-full flex items-center gap-2.5 px-4 py-3 bg-violet-50 hover:bg-violet-100 transition-colors"
          >
            <span className="text-base">✨</span>
            <span className="text-sm font-semibold text-violet-700 flex-1 text-left">Nhận xét của AI</span>
            <svg className={`w-4 h-4 text-violet-400 transition-transform ${feedbackOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {feedbackOpen && (
            <div className="px-4 py-3 bg-white">
              <p className="text-sm text-gray-600 leading-relaxed">{aiFeedback}</p>
            </div>
          )}
        </div>
      )}

      {/* CTA buttons */}
      <div className="flex gap-3 mb-8">
        {canRetry && !passed && (
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-white border-2 border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Làm lại
          </button>
        )}
        {/* BUG FIX: chỉ unlock bài tiếp theo khi passed, hoặc hết lượt retry */}
        {(passed || !canRetry) && (
          hasNextLesson ? (
            <button
              onClick={onNextLesson}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 shadow-lg shadow-violet-200"
              style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}
            >
              {nextLessonTitle ? `Tiếp: ${nextLessonTitle.slice(0, 20)}…` : "Bài tiếp theo"}
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onContinue}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 shadow-lg shadow-violet-200"
              style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}
            >
              Hoàn thành
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )
        )}
      </div>

      {/* Review all answers header */}
      <div className="mb-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-4">
          Xem lại bài làm
        </p>
      </div>
    </div>
  );
}

// ─── Main QuizPane ────────────────────────────────────────────────────────────
export default function QuizPane({ exercise, lessonId, onComplete, onSubmit, onRewatch }) {
  const navigate = useNavigate();

  const [answers, setAnswers]               = useState({});
  const [currentIdx, setCurrentIdx]         = useState(0);
  const [slideDir, setSlideDir]             = useState("right");
  const [animKey, setAnimKey]               = useState(0);
  const [submitLoading, setSubmitLoading]   = useState(false);
  const [submitError, setSubmitError]       = useState(null);
  const [submitResult, setSubmitResult]     = useState(null);
  const [currentAttempt, setCurrentAttempt] = useState(1);

  const questions     = exercise?.questions ?? [];
  const answeredCount = questions.filter((q, i) => !!answers[q.orderIndex ?? i]).length;
  const allAnswered   = answeredCount === questions.length && questions.length > 0;
  const isLast        = currentIdx === questions.length - 1;

  // Map requirementResults by sequential index
  // + enrich với correctAnswer, explanation của teacher, và revealCorrect flag
  const resultByIndex = {};
  if (submitResult?.requirementResults) {
    // revealCorrect = true khi: student đã pass HOẶC hết lượt retry
    // → ẩn đáp án đúng khi còn lượt retry để retry có ý nghĩa
    const revealCorrect = submitResult.passed || !submitResult.canRetry;

    submitResult.requirementResults.forEach((r, i) => {
      const teacherQ  = (exercise?.teacherQuestions ?? exercise?.questions)?.[i];
      const q         = questions[i];
      const correctAns = r.correctAnswer ?? teacherQ?.correctAnswer;
      const studentAns = answers[q?.orderIndex ?? i];

      resultByIndex[i] = {
        ...r,
        correctAnswer: correctAns,
        // Tự tính isCorrectAnswer thay vì phụ thuộc backend có trả về không
        isCorrectAnswer: r.isCorrectAnswer ?? (studentAns === correctAns),
        note: teacherQ?.explanation || r.note,
        revealCorrect,
      };
    });
  }

  const goTo = (newIdx, dir) => {
    setSlideDir(dir);
    setAnimKey(k => k + 1);
    setCurrentIdx(newIdx);
  };

  const handleSelect = (key) => {
    const q   = questions[currentIdx];
    const idx = q.orderIndex ?? currentIdx;
    setAnswers(prev => ({ ...prev, [idx]: key }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) goTo(currentIdx + 1, "right");
  };
  const handlePrev = () => {
    if (currentIdx > 0) goTo(currentIdx - 1, "left");
  };

  const handleSubmit = async () => {
    if (!allAnswered || submitLoading) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const res = await submitExercise(lessonId, { answers });
      const raw = res?.result ?? res?.data?.result ?? res?.data ?? res;
      const mapped = {
        score:           raw.score           ?? 0,
        passed:          raw.passed          ?? false,
        aiFeedback:      raw.aiFeedback      ?? null,
        message:         raw.message         ?? null,
        canRetry:        raw.canRetry        ?? !raw.passed,
        hasNextLesson:   raw.hasNextLesson   ?? false,
        nextLessonId:    raw.nextLessonId    ?? null,
        nextLessonTitle: raw.nextLessonTitle ?? null,
        attemptNumber:   raw.attemptNumber   ?? currentAttempt,
        requirementResults: raw.requirementResults ?? [],
        status: raw.status ?? (raw.passed ? "PASSED" : "SUBMITTED"),
      };
      setSubmitResult(mapped);
      setCurrentAttempt(mapped.attemptNumber + 1);
      onSubmit?.(mapped);
      // Chỉ trigger onComplete (mở CompletionModal) khi student đã pass
      if (mapped.passed) onComplete?.(mapped);
    } catch (err) {
      setSubmitError(err?.response?.data?.message ?? "Nộp bài thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitResult(null);
    setSubmitError(null);
    goTo(0, "right");
  };

  const handleNextLesson = () => {
    if (submitResult?.nextLessonId) navigate(`/learning/lesson/${submitResult.nextLessonId}`);
    else navigate(-1);
  };

  if (!exercise) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ background: "#F4F5FB" }}>
        <style>{quizCSS}</style>
        <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm text-gray-400">Đang tải đề bài...</span>
      </div>
    );
  }

  const q              = questions[currentIdx];
  const selectedAnswer = q ? answers[q.orderIndex ?? currentIdx] : null;
  const qResult        = submitResult ? (resultByIndex[currentIdx] ?? {}) : null;

  return (
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #F4F5FB 0%, #F0F0FF 100%)" }}
    >
      <style>{quizCSS}</style>

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 bg-white/85 backdrop-blur-md border-b border-gray-200/80 px-4 pt-3 pb-3 space-y-2.5">
        {/* Row 1: rewatch + meta */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRewatch}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            Xem lại video
          </button>
          <div className="flex-1" />
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
            {exercise.tag ?? "QUIZ"}
          </span>
          {exercise.time && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {exercise.time}
            </span>
          )}
        </div>

        {/* Row 2: thin progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%`,
              background: "linear-gradient(90deg, #7C3AED, #06B6D4)",
            }}
          />
        </div>

        {/* Row 3: progress pills */}
        {questions.length > 1 && (
          <ProgressPills
            questions={questions}
            currentIdx={currentIdx}
            answers={answers}
          />
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto quiz-scroll">
        {submitResult ? (
          /* ── Result mode: summary + all answers ── */
          <div className="px-4 pt-6">
            <div className="max-w-lg mx-auto">
              <ResultSummary
                submitResult={submitResult}
                onRetry={handleRetry}
                onNextLesson={handleNextLesson}
                onContinue={() => navigate(-1)}
              />
              {/* All questions review */}
              <div className="space-y-6 pb-8">
                {questions.map((question, i) => (
                  <QuestionCard
                    key={i}
                    question={question}
                    index={i}
                    total={questions.length}
                    selected={answers[question.orderIndex ?? i]}
                    onSelect={() => {}}
                    result={resultByIndex[i] ?? {}}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">Bài tập chưa có câu hỏi.</p>
          </div>
        ) : (
          /* ── One-at-a-time card ── */
          <div className="flex justify-center px-4 pt-8 pb-4">
            <div
              key={animKey}
              className={slideDir === "right" ? "q-enter-right" : "q-enter-left"}
              style={{ width: "100%", maxWidth: "560px" }}
            >
              <QuestionCard
                question={q}
                index={currentIdx}
                total={questions.length}
                selected={selectedAnswer}
                onSelect={handleSelect}
                result={qResult}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation bar ── */}
      {!submitResult && (
        <div className="flex-shrink-0 bg-white/85 backdrop-blur-md border-t border-gray-200/80 px-4 py-3 flex items-center gap-3">
          {/* Back */}
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border-2 border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Trước
          </button>

          <div className="flex-1 text-center">
            {submitError && <p className="text-xs text-red-500 font-medium">⚠ {submitError}</p>}
          </div>

          {/* Next or Submit */}
          {isLast ? (
            <div className="relative group">
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || submitLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg,#7C3AED,#6D28D9)",
                  boxShadow: allAnswered ? "0 8px 24px rgba(109,40,217,0.35)" : "none",
                }}
              >
                {submitLoading ? (
                  <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                ) : "NỘP BÀI ✨"}
              </button>
              {!allAnswered && (
                <div className="absolute bottom-full right-0 mb-2 w-52 bg-gray-800 text-white text-xs rounded-xl px-3 py-2 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  Còn <span className="text-violet-300 font-bold">{questions.length - answeredCount} câu</span> chưa trả lời.
                  <div className="absolute top-full right-5 border-4 border-transparent border-t-gray-800" />
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleNext}
              disabled={!selectedAnswer}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background: selectedAnswer ? "linear-gradient(135deg,#7C3AED,#6D28D9)" : "#D1D5DB",
                boxShadow: selectedAnswer ? "0 6px 20px rgba(109,40,217,0.3)" : "none",
                color: selectedAnswer ? "white" : "#9CA3AF",
              }}
            >
              Tiếp theo
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}