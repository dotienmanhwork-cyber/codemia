// src/shared/components/dashboard-ui/Pagination.jsx

/**
 * Pagination — phân trang đơn giản
 *
 * Props:
 *   page       — number (1-indexed, current page)
 *   totalPages — number
 *   onChange   — (page: number) => void
 */
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  // Build page numbers array với ellipsis
  function getPages() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
    return pages;
  }

  const btnBase = {
    minWidth: 30, height: 30,
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius-xs)',
    background: 'var(--surface)',
    fontSize: 12.5, fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.12s',
    padding: '0 6px',
  };

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        justifyContent: 'flex-end',
        padding: '12px 16px 4px',
      }}
    >
      {/* Prev */}
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        style={{
          ...btnBase,
          color: page === 1 ? 'var(--ink-3)' : 'var(--ink-2)',
          cursor: page === 1 ? 'not-allowed' : 'pointer',
          opacity: page === 1 ? 0.5 : 1,
        }}
        onMouseEnter={(e) => { if (page !== 1) e.currentTarget.style.background = 'var(--border-faint)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
      >
        <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
      </button>

      {/* Pages */}
      {getPages().map((p, idx) =>
        p === '…' ? (
          <span
            key={`ellipsis-${idx}`}
            style={{ fontSize: 12.5, color: 'var(--ink-3)', padding: '0 4px' }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              ...btnBase,
              background: p === page ? 'var(--ink)' : 'var(--surface)',
              color:      p === page ? '#fff'       : 'var(--ink-2)',
              border:     p === page ? 'none'        : '0.5px solid var(--border)',
              fontWeight: p === page ? 700 : 500,
            }}
            onMouseEnter={(e) => {
              if (p !== page) e.currentTarget.style.background = 'var(--border-faint)';
            }}
            onMouseLeave={(e) => {
              if (p !== page) e.currentTarget.style.background = 'var(--surface)';
            }}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        style={{
          ...btnBase,
          color: page === totalPages ? 'var(--ink-3)' : 'var(--ink-2)',
          cursor: page === totalPages ? 'not-allowed' : 'pointer',
          opacity: page === totalPages ? 0.5 : 1,
        }}
        onMouseEnter={(e) => { if (page !== totalPages) e.currentTarget.style.background = 'var(--border-faint)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
      >
        <i className="ti ti-chevron-right" style={{ fontSize: 14 }} />
      </button>
    </div>
  );
}
