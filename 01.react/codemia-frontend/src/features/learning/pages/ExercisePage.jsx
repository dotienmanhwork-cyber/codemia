// features/learning/pages/ExercisePage.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ExercisePane from "../components/ExercisePane";
import QuizPane from "../components/QuizPane";
import {
  getLessonExercise,
  getLastSubmission,
} from "../api/learning.api";

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-900 animate-pulse">
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-6 gap-4 flex-shrink-0">
        <div className="h-4 w-24 bg-gray-700 rounded" />
        <div className="h-4 w-px bg-gray-700" />
        <div className="h-4 w-64 bg-gray-700 rounded" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-60 bg-gray-800 border-r border-gray-700" />
        <div className="flex-1 bg-gray-900" />
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-900/30 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-gray-300 text-sm">{message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
          style={{ background: "#8C06D8" }}
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}

// ─── Top Nav ──────────────────────────────────────────────────────────────────
function TopNav({ lessonTitle }) {
  const navigate = useNavigate();
  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0 z-10">
      <button
        onClick={() => navigate(-1)}
        className="mr-3 text-gray-400 hover:text-gray-700 transition-colors"
        title="Quay lại"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <span className="text-base font-bold text-gray-900 mr-3">Codemia</span>
      <span className="text-gray-300 mr-3">|</span>
      <span className="text-sm text-gray-600 truncate max-w-xs">{lessonTitle}</span>
      <div className="flex-1" />
      <button className="ml-6 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>
    </header>
  );
}

// ─── Submit Success Modal (CODE only) ─────────────────────────────────────────
// Hiện sau khi ExercisePane nộp bài xong
// Xử lý 3 trường hợp: PASSED+nextLesson / PASSED+cuối khoá / SUBMITTED(canRetry)
function SubmitSuccessModal({ result, onClose, onNavigateNext }) {
  const isPassed = result?.passed ?? false;
  const hasNext = result?.hasNextLesson ?? false;
  const canRetry = result?.canRetry ?? false;
  const score = result?.score ?? null;
  const message = result?.message ?? null;
  const nextLessonTitle = result?.nextLessonTitle ?? null;
  const aiFeedback = result?.aiFeedback ?? null;
  const attemptNumber = result?.attemptNumber ?? null;

  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full space-y-5">
        {/* Icon + title */}
        <div className="text-center space-y-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
            isPassed ? "bg-green-100" : "bg-orange-100"
          }`}>
            {isPassed ? (
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isPassed ? "Nộp bài thành công! 🎉" : "Đã ghi nhận bài nộp"}
            </h2>
            {score != null && (
              <p className={`text-2xl font-black mt-1 ${isPassed ? "text-green-500" : "text-orange-500"}`}>
                {score} <span className="text-sm font-semibold text-gray-400">/ 100 điểm</span>
              </p>
            )}
            {attemptNumber && (
              <p className="text-xs text-gray-400 mt-1">Lần nộp thứ {attemptNumber}</p>
            )}
          </div>
        </div>

        {/* Message từ BE */}
        {message && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 text-center leading-relaxed">
            {message}
          </p>
        )}

        {/* AI Feedback collapsible */}
        {aiFeedback && (
          <div className="rounded-xl border border-purple-200 overflow-hidden">
            <button
              onClick={() => setFeedbackOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Nhận xét của AI
              </span>
              <svg
                className={`w-3.5 h-3.5 text-purple-500 transition-transform ${feedbackOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {feedbackOpen && (
              <div className="px-4 py-3 bg-purple-50/50">
                <p className="text-xs text-purple-800 leading-relaxed">{aiFeedback}</p>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          {/* PASSED + có bài tiếp → navigate */}
          {isPassed && hasNext && (
            <button
              onClick={onNavigateNext}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "#8C06D8" }}
            >
              Bài tiếp theo
              {nextLessonTitle && (
                <span className="text-xs font-normal opacity-80 truncate max-w-[140px]">— {nextLessonTitle}</span>
              )}
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          {/* PASSED + cuối khoá → về trang học */}
          {isPassed && !hasNext && (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "#8C06D8" }}
            >
              Hoàn thành khoá học 🏆
            </button>
          )}

          {/* SUBMITTED (canRetry) → đóng modal để nộp lại */}
          {!isPassed && canRetry && (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "#374151" }}
            >
              Xem kết quả & Nộp lại
            </button>
          )}

          {/* Về trang học — luôn có */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Về trang học
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ExercisePage ────────────────────────────────────────────────────────
export default function ExercisePage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [exercise, setExercise] = useState(null);
  const [loadingExercise, setLoadingExercise] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Submit result từ ExercisePane (CODE) — QuizPane tự xử lý navigation
  const [submitResult, setSubmitResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ── Load exercise ───────────────────────────────────────────────────────────
  const loadExercise = useCallback(async () => {
    if (!lessonId) {
      setLoadError("Không tìm thấy lessonId trong URL.");
      setLoadingExercise(false);
      return;
    }
    try {
      setLoadingExercise(true);
      setLoadError(null);

      const [exerciseRes, lastSubRes] = await Promise.allSettled([
        getLessonExercise(lessonId),
        getLastSubmission(lessonId).catch(() => null),
      ]);

      if (exerciseRes.status === "rejected") throw exerciseRes.reason;

      const data = exerciseRes.value?.result ?? exerciseRes.value;
      const lastSub = lastSubRes.status === "fulfilled"
        ? (lastSubRes.value?.result ?? lastSubRes.value)
        : null;

      setExercise({
        id: data.id,
        type: (data.type ?? "CODE").toUpperCase(),
        tag: data.type ?? "CODE",
        time: data.time ?? data.estimatedTime ?? "—",
        title: data.title,
        description: data.description ?? "",
        requirements: data.requirements ?? [],
        questions: data.questions ?? [],
        starterCode: lastSub?.code ?? data.starterCode ?? "",
        fileName: data.fileName ?? `Solution.${data.language ?? "java"}`,
        language: data.language ?? "java",
        maxScore: data.maxScore ?? data.max_score ?? 100,
        difficulty: data.difficulty ?? "EASY",
        codeType: data.codeType ?? "STANDARD",
        testCode: data.testCode ?? "",
        testCases: data.testCases ?? [],
      });
    } catch (err) {
      setLoadError(err?.response?.data?.message ?? "Không tải được bài tập. Vui lòng thử lại.");
    } finally {
      setLoadingExercise(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadExercise();
  }, [loadExercise]);

  // ── handleComplete — CODE only (QuizPane tự xử lý navigation) ──────────────
  const handleComplete = (result) => {
    // result là mapped object từ mapSubmitResult trong ExercisePane
    setSubmitResult(result);
    setShowModal(true);
  };

  // ── Modal actions ───────────────────────────────────────────────────────────
  const handleModalClose = () => {
    setShowModal(false);
    // Nếu passed thì không cần navigate — user chọn "Về trang học"
    // Nếu canRetry thì đóng modal để user xem kết quả trong TestResultPanel và nộp lại
    navigate(-1);
  };

  const handleNavigateNext = () => {
    setShowModal(false);
    if (submitResult?.nextLessonId) {
      navigate(`/learning/lesson/${submitResult.nextLessonId}`);
    } else {
      navigate(-1);
    }
  };

  const handleRewatch = () => {
    navigate(-1);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loadingExercise) return <LoadingSkeleton />;
  if (loadError) return <ErrorState message={loadError} onRetry={loadExercise} />;

  return (
    <>
      <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <TopNav lessonTitle={`Exercise: ${exercise.title}`} />

        <div className="flex-1 overflow-hidden">
          {exercise.type === "QUIZ" ? (
            // QuizPane tự quản lý navigation (ResultSummary có buttons riêng)
            // onComplete chỉ để ExercisePage track nếu cần — không show modal
            <QuizPane
              exercise={exercise}
              lessonId={lessonId}
              onComplete={() => {}} // QuizPane tự navigate
              onRewatch={handleRewatch}
            />
          ) : (
            <ExercisePane
              exercise={exercise}
              lessonId={lessonId}
              onComplete={handleComplete}
              onRewatch={handleRewatch}
            />
          )}
        </div>
      </div>

      {/* Modal chỉ cho CODE — QuizPane có ResultSummary inline */}
      {showModal && submitResult && exercise.type !== "QUIZ" && (
        <SubmitSuccessModal
          result={submitResult}
          onClose={handleModalClose}
          onNavigateNext={handleNavigateNext}
        />
      )}
    </>
  );
}