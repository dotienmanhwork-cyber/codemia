// src/features/teacher/components/RejectedReasonModal.jsx

/**
 * Modal hiển thị lý do từ chối của Admin.
 * @param {{ id, title, rejectedReason } | null} course
 * @param {Function} onClose
 */
export default function RejectedReasonModal({ course, onClose }) {
  if (!course) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(24,26,28,0.4)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480, maxWidth: '100%',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '0.5px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-info-circle" style={{ fontSize: 16, color: 'var(--red)' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Lý do từ chối</span>
          </div>
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
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-faint)'; e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-3)'; }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Course title */}
        <div style={{ padding: '14px 20px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>Khóa học</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{course.title}</p>
        </div>

        {/* Reason box */}
        <div style={{ padding: '14px 20px 20px' }}>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>Phản hồi từ Admin</p>
          <div style={{
            background: 'var(--red-bg)',
            border: '0.5px solid #f7c1c1',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            fontSize: 13,
            color: 'var(--red)',
            lineHeight: 1.65,
          }}>
            {course.rejectedReason || '(Không có lý do cụ thể)'}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          padding: '12px 20px',
          borderTop: '0.5px solid var(--border)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '0.5px solid var(--border)',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600, color: 'var(--ink-2)',
              cursor: 'pointer', fontFamily: 'inherit',
              minHeight: 36,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-faint)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
