// src/shared/components/dashboard-ui/ConfirmModal.jsx
import { useEffect } from 'react';

/**
 * ConfirmModal — modal xác nhận hành động nguy hiểm (xóa, khóa, v.v.)
 *
 * Props:
 *   open          — boolean
 *   onClose       — () => void
 *   onConfirm     — () => void
 *   title         — string
 *   description   — string
 *   confirmLabel  — string (default: "Confirm")
 *   danger        — boolean (đổi màu nút thành đỏ)
 *   loading       — boolean
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const confirmBg = danger ? 'var(--red)' : 'var(--ink)';
  const confirmHoverBg = danger ? '#a80010' : '#2d2f31';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(24,26,28,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380, maxWidth: '100%',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '0.5px solid var(--border)',
          padding: '24px',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 40, height: 40,
            borderRadius: 10,
            background: danger ? 'var(--red-bg)' : 'var(--border-faint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
            color: danger ? 'var(--red)' : 'var(--ink-2)',
            marginBottom: 14,
          }}
        >
          <i className={`ti ti-${danger ? 'alert-triangle' : 'help-circle'}`} />
        </div>

        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
          {title}
        </div>

        {/* Description */}
        {description && (
          <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: 20 }}>
            {description}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
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
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: loading ? 'var(--ink-3)' : confirmBg,
              borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600, color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = confirmHoverBg;
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = confirmBg;
            }}
          >
            {loading && <i className="ti ti-loader-2" style={{ fontSize: 14 }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
