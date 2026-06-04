// src/shared/components/dashboard-ui/FormModal.jsx
import { useEffect } from 'react';

/**
 * FormModal — modal cho form thêm/sửa
 *
 * Props:
 *   open        — boolean
 *   onClose     — () => void
 *   title       — string
 *   onSubmit    — () => void
 *   submitLabel — string (default: "Lưu")
 *   cancelLabel — string (default: "Hủy")
 *   loading     — boolean
 *   children    — form fields
 *   width       — number (default: 480)
 */
export default function FormModal({
  open,
  onClose,
  title,
  onSubmit,
  submitLabel = 'Lưu',
  cancelLabel = 'Hủy',
  loading = false,
  children,
  width = 480,
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(24,26,28,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      {/* Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: '100%',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '0.5px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
            {title}
          </span>
          <button
            onClick={onClose}
            aria-label="Đóng"
            style={{
              width: 28, height: 28,
              border: 'none', background: 'transparent',
              borderRadius: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-3)', fontSize: 18,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--border-faint)';
              e.currentTarget.style.color = 'var(--ink)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--ink-3)';
            }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            padding: '14px 20px',
            borderTop: '0.5px solid var(--border)',
            flexShrink: 0,
          }}
        >
          {/* Cancel */}
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '0.5px solid var(--border)',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600, color: 'var(--ink-2)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-faint)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
          >
            {cancelLabel}
          </button>

          {/* Submit */}
          <button
            onClick={onSubmit}
            disabled={loading}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: loading ? 'var(--ink-3)' : 'var(--ink)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600, color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#2d2f31';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = 'var(--ink)';
            }}
          >
            {loading && <i className="ti ti-loader-2" style={{ fontSize: 14 }} />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}