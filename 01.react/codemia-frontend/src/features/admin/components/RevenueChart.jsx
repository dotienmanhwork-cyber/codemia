// src/features/admin/components/RevenueChart.jsx

/**
 * Mini bar chart + current month summary
 * @param {{ data: Array, loading: boolean }} props
 * data item: { month: 'YYYY-MM', revenue: number, ... }
 */
export default function RevenueChart({ data = [], loading }) {
  if (loading || data.length < 2) {
    return (
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)', padding: 16,
        height: 220,
        background: 'var(--border-faint)',
        animation: 'pulse 1.4s ease-in-out infinite',
      }} />
    )
  }

  const max = Math.max(...data.map((d) => d.revenue))
  const latest = data[data.length - 1]
  const prev = data[data.length - 2]
  const growth = (((latest.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)

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

  // "2025-05" → "Th5"
  const shortMonth = (str) => {
    const [y, m] = str.split('-')
    return new Date(y, m - 1).toLocaleString('vi-VN', { month: 'short' })
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 16,
    }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
        Xu hướng doanh thu
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
        6 tháng gần đây
      </div>

      {/* Bars */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 6,
        height: 80, padding: '0 4px',
      }}>
        {data.map((d) => {
          const isLatest = d.month === latest.month
          return (
            <div
              key={d.month}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <div style={{
                width: '100%',
                borderRadius: '4px 4px 0 0',
                background: 'var(--purple)',
                height: `${(d.revenue / max) * 72}px`,
                opacity: isLatest ? 1 : 0.35,
                transition: 'height 0.35s ease',
              }} />
              <span style={{ fontSize: 9.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                {shortMonth(d.month)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 14, paddingTop: 12,
        borderTop: '0.5px solid var(--border-faint)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Tháng hiện tại</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          {fmt(latest.revenue)}
        </div>
        <div style={{ fontSize: 11.5, color: growth >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600, marginTop: 2 }}>
          {growth >= 0 ? '↑ +' : '↓ '}{Math.abs(growth)}% so với tháng trước
        </div>
      </div>
    </div>
  )
}