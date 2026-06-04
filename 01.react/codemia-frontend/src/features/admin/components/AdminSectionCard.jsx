// src/features/admin/components/AdminSectionCard.jsx

/**
 * AdminSectionCard — card wrapper với optional header (title + slot phải)
 *
 * Props:
 *   title       — string (optional)
 *   headerRight — ReactNode (optional)
 *   children    — ReactNode
 */
export default function AdminSectionCard({ title, headerRight, children }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {(title || headerRight) && (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
  );
}
