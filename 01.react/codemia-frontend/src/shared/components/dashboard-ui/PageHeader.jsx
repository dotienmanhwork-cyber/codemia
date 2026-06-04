// src/shared/components/dashboard-ui/PageHeader.jsx
/**
 * PageHeader — tiêu đề trang với title, subtitle, và action button tùy chọn
 *
 * Props:
 *   title      — string
 *   subtitle   — string (optional)
 *   action     — ReactNode (optional) — button hoặc bất kỳ element nào ở góc phải
 */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 21, fontWeight: 700,
              color: 'var(--ink)', letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 13, color: 'var(--ink-3)',
                marginTop: 3, margin: '3px 0 0',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div style={{ flexShrink: 0 }}>
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
