// features/learning/pages/LearningPage.jsx
import ChatBox, { INITIAL_MESSAGES } from "../../ai/components/ChatBox";
import SummaryPanel from "../../ai/components/SummaryPanel";
import PlayerPane from "../components/PlayerPane";
import ExercisePane from "../components/ExercisePane";
import LessonSidebar from "../components/LessonSidebar";
import ProgressBar from "../components/ProgressBar";
import CompletionModal from "../components/CompletionModal";
import QuizPane from "../components/QuizPane";
import { useLessonProgress } from "../hooks/useLessonProgress";
import { useState, useEffect } from "react";

// ─── Spinner component ────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="animate-spin h-6 w-6 text-purple-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Main LearningPage ────────────────────────────────────────────────────────
export default function LearningPage() {
  const {
    courseSlug,
    course,
    chapters,
    currentLesson,
    currentExercise,
    activeLessonId,
    sidebarTab,
    setSidebarTab,
    sidebarOpen,
    setSidebarOpen,
    showCompletionModal,
    setShowCompletionModal,
    chatHistory,
    setChatHistory,
    loadingCourse,
    loadingLesson,
    courseError,
    lessonError,
    setLessonError,
    currentVideoTime,
    prevLesson,
    nextLesson,
    isExercise,
    isLessonLocked,
    handleLessonClick,
    handleComplete,
    handleContinue,
    handleViewCertificate,
    handleWriteReview,
    handleVideoTimeUpdate,
    handlePlayerReady,
    handleTimestampClick,
    setActiveLessonIdReal,
  } = useLessonProgress();

  // ── Quiz submitted state ───────────────────────────────────────────────────
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult]       = useState(null);
  useEffect(() => {
    setQuizSubmitted(false);
    setQuizResult(null);
  }, [activeLessonId]);

  // ── Render: Loading / Error ────────────────────────────────────────────────
  if (loadingCourse) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Spinner />
        <span className="ml-3 text-gray-500 text-sm">Đang tải khóa học...</span>
      </div>
    );
  }

  if (courseError && !course) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
        <p className="text-red-500 font-medium">{courseError}</p>
        <button
          className="px-4 py-2 rounded-lg text-white text-sm"
          style={{ background: "#8c06d8" }}
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="h-screen flex flex-col bg-white overflow-hidden"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* ── Top Nav ── */}
      <header
        className="flex items-center px-4 h-12 border-b bg-white flex-shrink-0 z-20 gap-3"
        style={{ borderColor: "#c5c6ca" }}
      >
        <button
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
          onClick={() => window.history.back()}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-sm font-bold text-gray-900 flex-shrink-0">Codemia</span>
        <span className="text-gray-300 flex-shrink-0">|</span>
        <span className="text-sm text-gray-500 truncate hidden sm:block">
          {course?.title ?? "Đang tải..."}
        </span>

        {isExercise && (
          <span
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "#f3daff", color: "#7c3aed" }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
            Bài tập
          </span>
        )}

        <div className="flex-1" />

        <div className="w-48 sm:w-56 flex-shrink-0">
          <ProgressBar progress={course?.progress ?? 0} />
        </div>

        <button
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg border text-gray-500 hover:bg-gray-50 transition-colors ml-1"
          style={{ borderColor: "#c5c6ca" }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Left: Main content area ── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">

          {loadingLesson ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner />
              <span className="ml-3 text-gray-400 text-sm">Đang tải bài học...</span>
            </div>
          ) : lessonError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-red-500 text-sm">{lessonError}</p>
              <button
                className="px-4 py-2 rounded-lg text-white text-sm"
                style={{ background: "#8c06d8" }}
                onClick={() => setActiveLessonIdReal((id) => id)}
              >
                Thử lại
              </button>
            </div>
          ) : currentLesson ? (
            <>
              {/* ── EXERCISE MODE ── */}
              {isExercise ? (
                currentExercise?.type?.toUpperCase() === "QUIZ" ? (
                  <QuizPane
                    exercise={currentExercise}
                    lessonId={activeLessonId}
                    onComplete={(result) => {
                      if (result?.passed) handleComplete();
                    }}
                    onSubmit={(result) => {
                      setQuizSubmitted(true);
                      setQuizResult(result);
                    }}
                    onRewatch={() => prevLesson && handleLessonClick(prevLesson.id)}
                  />
                ) : (
                  <ExercisePane
                    exercise={currentExercise}
                    lessonId={activeLessonId}
                    onComplete={(result) => {
                      if (result?.passed) handleComplete();
                    }}
                    onRewatch={() => prevLesson && handleLessonClick(prevLesson.id)}
                  />
                )
              ) : (
                /* ── VIDEO / TEXT MODE ── */
                <div className={`flex flex-col h-full bg-gray-50/30 ${currentLesson.type === "TEXT" ? "overflow-hidden" : "overflow-y-auto"}`}>
                  {currentLesson.type === "TEXT" ? (
                    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
                      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6 sm:p-10 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                        <h1 className="text-[26px] font-extrabold text-gray-900 mb-6 border-b border-gray-100 pb-4 leading-tight">
                          {currentLesson.title}
                        </h1>
                        <div 
                          className="codemia-prose text-gray-800 leading-relaxed text-[15.5px] break-words"
                          dangerouslySetInnerHTML={{ __html: currentLesson.content || '<p class="text-gray-400 italic">Bài học này chưa có nội dung văn bản.</p>' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <PlayerPane
                      lesson={currentLesson}
                      onComplete={handleComplete}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onReady={handlePlayerReady}
                    />
                  )}

                  {/* Lesson nav bar */}
                  <div
                    className="flex items-center justify-between px-4 sm:px-6 py-3 border-b flex-shrink-0 bg-white"
                    style={{ borderColor: "#e5e2e1" }}
                  >
                    <p className="text-sm font-semibold text-gray-800 truncate mr-4 hidden sm:block">
                      {currentLesson.title}
                    </p>
                    <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                      <button
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ borderColor: "#c5c6ca" }}
                        disabled={!prevLesson}
                        onClick={() => prevLesson && handleLessonClick(prevLesson.id)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">BÀI TRƯỚC</span>
                      </button>
                      <button
                        onClick={handleComplete}
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-white rounded-lg text-sm font-semibold transition-colors"
                        style={{ background: "#8c06d8" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#5624d0")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#8c06d8")}
                      >
                        BÀI TIẾP THEO
                      </button>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {currentLesson.type !== "TEXT" && (
                    <div className="px-4 sm:px-6 py-5 flex-1">
                      <SummaryPanel
                        lessonId={activeLessonId}
                        lessonTitle={currentLesson.title}
                        onTimestampClick={handleTimestampClick}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Chọn một bài học để bắt đầu
            </div>
          )}
        </main>

        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Right Sidebar ── */}
        <aside
          className={`
            flex-shrink-0 border-l bg-white flex flex-col overflow-hidden z-40
            transition-all duration-300
            fixed lg:relative inset-y-0 right-0
            w-[320px] sm:w-[360px]
            ${sidebarOpen ? "translate-x-0 shadow-2xl" : "translate-x-full lg:translate-x-0"}
            lg:shadow-none lg:flex
            mt-12 lg:mt-0
          `}
          style={{ borderColor: "#c5c6ca" }}
        >
          {/* Tabs */}
          <div className="flex border-b flex-shrink-0 relative" style={{ borderColor: "#c5c6ca" }}>
            <button
              className="lg:hidden absolute top-3 left-3 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {["content", "ai"].map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative flex items-center justify-center gap-1.5 ${
                  sidebarTab === tab ? "text-purple-700" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setSidebarTab(tab)}
              >
                {tab === "ai" && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                )}
                {tab === "content" ? "Nội dung" : "Trợ lý AI"}
                {sidebarTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: "#8c06d8" }} />
                )}
              </button>
            ))}
          </div>

          {sidebarTab === "content" && (
            <div className="flex-1 overflow-y-auto">
              <LessonSidebar
                chapters={chapters}
                activeLessonId={activeLessonId}
                onLessonClick={handleLessonClick}
                isLessonLocked={isLessonLocked}
              />
            </div>
          )}

          {sidebarTab === "ai" && (
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* ── Đang làm quiz (chưa nộp) → khóa ChatBox ── */}
              {isExercise && currentExercise?.type?.toUpperCase() === "QUIZ" && !quizSubmitted ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: "#f3daff" }}
                  >
                    🔒
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Trợ lý AI tạm khóa</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Hoàn thành bài quiz trước nhé!<br />
                    AI sẽ giải thích sau khi bạn nộp bài.
                  </p>
                </div>
              ) : (
                /* ── Video / Exercise code / Quiz đã nộp → ChatBox bình thường ── */
                <ChatBox
                  lessonContext={currentLesson?.title ?? ""}
                  lessonId={activeLessonId}
                  currentVideoTime={currentVideoTime}
                  isQuizMode={false}
                  messages={chatHistory[activeLessonId] ?? INITIAL_MESSAGES}
                  onMessagesChange={(updater) =>
                    setChatHistory((prev) => ({
                      ...prev,
                      [activeLessonId]: typeof updater === "function"
                        ? updater(prev[activeLessonId] ?? INITIAL_MESSAGES)
                        : updater,
                    }))
                  }
                />
              )}

            </div>
          )}
        </aside>
      </div>

      {/* ── Completion Modal ── */}
      {showCompletionModal && currentLesson && (
        <CompletionModal
          lessonTitle={currentLesson.title}
          nextLessonTitle={nextLesson?.title ?? ""}
          mode={isExercise ? "exercise" : currentLesson.type === "TEXT" ? "text" : "video"}
          onContinue={handleContinue}
          onRewatch={() => setShowCompletionModal(false)}
          onClose={() => setShowCompletionModal(false)}
          // Props mới cho bài cuối khóa
          onViewCertificate={handleViewCertificate}
          onWriteReview={handleWriteReview}
        />
      )}
    </div>
  );
}