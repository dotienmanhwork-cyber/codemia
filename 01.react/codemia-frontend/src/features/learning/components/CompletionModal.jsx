// features/learning/components/CompletionModal.jsx
// Overlay modal shown after a lesson/exercise is completed

export default function CompletionModal({
  lessonTitle = "",
  nextLessonTitle = "",
  onContinue,
  onRewatch,
  onClose,
  onViewCertificate,  // () => void — navigate tới trang certificate
  onWriteReview,      // () => void — navigate tới trang course detail để review
  mode = "video",     // "video" | "exercise" | "text"
}) {
  const isLastLesson = !nextLessonTitle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden relative"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors z-10"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* AI gradient top bar */}
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)" }}
        />

        <div className="p-8 flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "#F3DAFF" }}
          >
            {mode === "exercise" || isLastLesson ? (
              <svg className="w-8 h-8" style={{ color: "#8C06D8" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" style={{ color: "#8C06D8" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isLastLesson ? "Hoàn thành khóa học!" : mode === "exercise" ? "Xuất sắc!" : "Tuyệt vời!"}
          </h2>

          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {isLastLesson ? (
              <>Bạn đã hoàn thành toàn bộ khóa học. Chúc mừng thành tích của bạn!</>
            ) : mode === "exercise" ? (
              <>
                Bạn đã hoàn thành bài tập{" "}
                <span className="font-semibold text-gray-700">"{lessonTitle}"</span>.
                Tiếp tục bài học tiếp theo nhé!
              </>
            ) : mode === "text" ? (
              <>
                Bạn đã hoàn thành bài đọc{" "}
                <span className="font-semibold text-gray-700">"{lessonTitle}"</span>.
              </>
            ) : (
              <>
                Bạn đã hoàn thành bài giảng{" "}
                <span className="font-semibold text-gray-700">"{lessonTitle}"</span>.
              </>
            )}
          </p>

          {/* ── LAST LESSON: Certificate + Review actions ── */}
          {isLastLesson ? (
            <div className="w-full flex flex-col gap-2.5">
              {/* Primary: Xem chứng chỉ */}
              <button
                onClick={onViewCertificate}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ background: "#8C06D8" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Xem chứng chỉ
              </button>

              {/* Secondary: Viết đánh giá */}
              <button
                onClick={onWriteReview}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-purple-50 border"
                style={{ color: "#8C06D8", borderColor: "#E9D5FF" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                Viết đánh giá
              </button>

              {/* Tertiary: Đóng */}
              <button
                onClick={onClose}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Đóng
              </button>
            </div>
          ) : (
            /* ── NOT LAST LESSON: Next lesson flow ── */
            <>
              {/* Next lesson preview */}
              <div className="w-full bg-gray-50 rounded-xl px-4 py-3 mb-4 text-left border border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">Tiếp theo</p>
                <p className="text-sm font-medium text-gray-800 truncate">{nextLessonTitle}</p>
              </div>

              <button
                onClick={onContinue}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 group"
                style={{ background: "#8C06D8" }}
              >
                {mode === "exercise" ? "Bài tiếp theo" : "Chuyển sang bài mới"}
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>

              {onRewatch && (
                <button
                  onClick={onRewatch}
                  className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
                >
                  {mode === "exercise" 
                    ? "Xem lại bài tập" 
                    : mode === "text" 
                      ? "Xem lại bài học" 
                      : "Xem lại video"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}