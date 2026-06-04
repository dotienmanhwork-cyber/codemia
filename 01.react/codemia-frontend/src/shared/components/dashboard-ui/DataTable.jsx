// src/shared/components/dashboard-ui/DataTable.jsx
/**
 * DataTable — wrapper section card với table bên trong
 *
 * Props:
 *   title        — string (tiêu đề của section card)
 *   headerRight  — ReactNode (nút "View all", badge, v.v.)
 *   columns      — Array<{ key: string, label: string, width?: string | number }>
 *   data         — Array<object> (mỗi item map với column.key)
 *   renderCell   — (key: string, value: any, row: object) => ReactNode
 *                  optional — nếu không truyền sẽ render text thuần
 *   emptyText    — string (hiển thị khi data rỗng)
 */
export default function DataTable({
  title,
  headerRight,
  columns = [],
  data = [],
  renderCell,
  emptyText = 'No data.',
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      {(title || headerRight) && (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 16px',
            borderBottom: '0.5px solid var(--border)',
          }}
        >
          {title && (
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
              {title}
            </span>
          )}
          {headerRight}
        </div>
      )}

      {/* Table */}
      <table className="dt" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width ?? 'auto' }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '24px 16px' }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={row.id ?? idx}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {renderCell
                      ? renderCell(col.key, row[col.key], row)
                      : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
