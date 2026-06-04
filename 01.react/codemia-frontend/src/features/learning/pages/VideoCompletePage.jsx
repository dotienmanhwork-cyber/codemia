// features/learning/pages/VideoCompletePage.jsx
// Rendered as an overlay on top of LearningPage when video finishes

export default function VideoCompletePage({ lessonTitle, onGoToExercise, onRewatch }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden relative"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {/* AI gradient top bar */}
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)" }}
        />
        <div className="p-8 flex flex-col items-center text-center">
          {/* Celebration icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: "#F3DAFF" }}>
            <svg className="w-8 h-8" style={{ color: "#8C06D8" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tuyệt vời!</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Bạn đã hoàn thành bài giảng{" "}
            <span className="font-semibold text-gray-700">"{lessonTitle}"</span>.
            
          </p>
          <button
            onClick={onGoToExercise}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 group"
            style={{ background: "#8C06D8" }}
          >
            Video đã xong! Chuyển sang bài mới ngay
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <button onClick={onRewatch} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2">
            Xem lại video
          </button>
        </div>
      </div>
    </div>
  );
}