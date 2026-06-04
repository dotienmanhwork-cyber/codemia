// src/features/admin/components/AdminFinanceStatCards.jsx
import StatCard from '@/shared/components/dashboard-ui/StatCard'

/** VNĐ compact — dùng chung với DashboardStatCards */
function formatRevenue(amount) {
  if (!amount) return '0 ₫'
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ ₫`
  if (amount >= 1_000_000)     return `${(amount / 1_000_000).toFixed(1)} tr ₫`
  if (amount >= 1_000)         return `${(amount / 1_000).toFixed(1)} k ₫`
  return `${amount.toLocaleString('vi-VN')} ₫`
}

/**
 * @param {{ stats: import('../api/admin.api').FinanceStats, loading: boolean }} props
 */
export default function AdminFinanceStatCards({ stats, loading }) {
  const growth = stats?.revenueGrowth ?? 0
  const growthLabel = growth >= 0 ? `↑ +${growth}%` : `↓ ${growth}%`

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
        gap: 10,
      }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            height: 100, borderRadius: 'var(--radius)',
            background: 'var(--border-faint)',
            animation: 'pulse 1.4s ease-in-out infinite',
          }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
      gap: 10,
    }}>
      <StatCard
        label="Doanh thu tháng"
        value={formatRevenue(stats?.monthlyRevenue)}
        icon="trending-up"
        iconColor="purple"
        badge={growthLabel}
        badgeType={growth >= 0 ? 'up' : 'down'}
      />
      <StatCard
        label="Chi trả giáo viên"
        value={formatRevenue(stats?.totalPayouts)}
        icon="credit-card"
        iconColor="blue"
        badge="Tháng này"
        badgeType="neutral"
      />
      <StatCard
        label="Lợi nhuận ròng"
        value={formatRevenue(stats?.platformNet)}
        icon="coin"
        iconColor="green"
        badge="Sau khi chi trả"
        badgeType="neutral"
      />
      <StatCard
        label="Giao dịch"
        value={stats?.totalTransactions?.toLocaleString() ?? '—'}
        icon="receipt"
        iconColor="dark"
        badge="Tháng này"
        badgeType="neutral"
      />
    </div>
  )
}