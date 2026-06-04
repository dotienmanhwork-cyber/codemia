// features/learning/components/ProgressBar.jsx

export default function ProgressBar({ progress = 0 }) {
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex items-center gap-2">
      {/* Percentage — trước bar như trong design */}
      <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: "#8c06d8" }}>
        {pct}%
      </span>

      {/* Track */}
      <div className="relative flex-1 h-2 rounded-full overflow-hidden min-w-[80px]"
        style={{ background: "#e5e2e1" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #8c06d8, #a739f3)",
          }}
        />
      </div>

      {/* Trophy icon */}
      <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#8c06d8" }}
        fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    </div>
  );
}