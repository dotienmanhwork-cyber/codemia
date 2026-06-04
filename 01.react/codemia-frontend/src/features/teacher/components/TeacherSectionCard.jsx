// src/features/teacher/components/TeacherSectionCard.jsx

export default function TeacherSectionCard({ title, headerRight, children, style }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {(title || headerRight) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '13px 16px',
            borderBottom: '0.5px solid var(--border)',
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
            {title}
          </span>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  )
}
