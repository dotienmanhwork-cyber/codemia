// src/features/teacher/components/DashboardProgressBar.jsx

/**
 * @param {{ value: number }} props  — value: 0–100
 */
export default function DashboardProgressBar({ value = 0 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: 'var(--border)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 99,
            background: value >= 80 ? 'var(--green)' : 'var(--purple)',
            width: `${value}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          color: 'var(--ink-3)',
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {value}%
      </span>
    </div>
  )
}
