// src/features/teacher/components/TeacherFinanceStatCards.jsx
import StatCard from '@/shared/components/dashboard-ui/StatCard'

/** Format VND: 1_000_000 → '1.000.000 đ' */
function fmtVND(n) {
  return Number(n).toLocaleString('vi-VN') + ' đ'
}

export default function TeacherFinanceStatCards({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 min-[480px]:grid-cols-[repeat(auto-fit,minmax(155px,1fr))] gap-[10px]">
        <StatCard label="Tổng doanh thu" value="—" icon="wallet"      iconColor="purple" />
        <StatCard label="Tháng này"    value="—" icon="trending-up" iconColor="green"  />
        <StatCard label="Tháng trước"    value="—" icon="calendar"    iconColor="blue"   />
        <StatCard label="TB / khóa học"  value="—" icon="chart-bar"   iconColor="amber"  />
      </div>
    )
  }

  const { totalRevenue, thisMonthRevenue, lastMonthRevenue, averagePerCourse, revenueGrowth } = stats

  const growthBadgeType  = revenueGrowth >= 0 ? 'up' : 'down'
  const growthBadgeLabel = `${revenueGrowth >= 0 ? '↑ +' : '↓ '}${Math.abs(revenueGrowth)}%`

  return (
    <div className="grid grid-cols-2 min-[480px]:grid-cols-[repeat(auto-fit,minmax(155px,1fr))] gap-[10px]">
      <StatCard
        label="Tổng doanh thu"
        value={fmtVND(totalRevenue)}
        icon="wallet"
        iconColor="purple"
      />
      <StatCard
        label="Tháng này"
        value={fmtVND(thisMonthRevenue)}
        icon="trending-up"
        iconColor="green"
        badge={growthBadgeLabel}
        badgeType={growthBadgeType}
      />
      <StatCard
        label="Tháng trước"
        value={fmtVND(lastMonthRevenue)}
        icon="calendar"
        iconColor="blue"
      />
      <StatCard
        label="TB / khóa học"
        value={fmtVND(averagePerCourse)}
        icon="chart-bar"
        iconColor="amber"
      />
    </div>
  )
}
