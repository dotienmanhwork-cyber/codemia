// src/features/admin/components/MonthlyBreakdownTable.jsx

/**
 * @param {{ data: Array, loading: boolean }} props
 * data item: { month: 'YYYY-MM', revenue, payouts, net, transactions }
 */
export default function MonthlyBreakdownTable({ data = [], loading }) {
  const fmt = (n) => {
    if (!n) return '0 ₫'
    if (n >= 1_000_000_000) {
      const v = n / 1_000_000_000
      return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} tỷ ₫`
    }
    if (n >= 1_000_000) {
      const v = n / 1_000_000
      return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} tr ₫`
    }
    if (n >= 1_000) {
      const v = n / 1_000
      return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} k ₫`
    }
    return `${n} ₫`
  }

  // "2025-05" → "Tháng 5 năm 2025"
  const longMonth = (str) => {
    const [y, m] = str.split('-')
    return new Date(y, m - 1).toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
  }

  const rows = loading ? [] : [...data].reverse()

  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 16px', borderBottom: '0.5px solid var(--border)',
      }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
          Phân tích theo tháng
        </span>
      </div>

      {/* Scrollable table wrapper — responsive rule from RESPONSIVE.md */}
      <div style={{ overflowX: 'auto' }}>
        <table className="dt" style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th>Tháng</th>
              <th>Doanh thu</th>
              <th>Thanh toán</th>
              <th>Thực thu</th>
              <th>Giao dịch</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <td key={j}>
                      <div style={{
                        height: 14, borderRadius: 4,
                        background: 'var(--border-faint)',
                        animation: 'pulse 1.4s ease-in-out infinite',
                        width: j === 1 ? '80px' : '50px',
                      }} />
                    </td>
                  ))}
                </tr>
              ))
              : rows.map((m) => (
                <tr key={m.month}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{longMonth(m.month)}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt(m.revenue)}</td>
                  <td style={{ color: 'var(--ink-2)' }}>{fmt(m.payouts)}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(m.net)}</td>
                  <td style={{ color: 'var(--ink-3)', fontSize: 12 }}>
                    {m.transactions.toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
