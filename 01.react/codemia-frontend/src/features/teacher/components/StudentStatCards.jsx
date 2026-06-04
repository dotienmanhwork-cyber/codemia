// src/features/teacher/components/StudentStatCards.jsx
import StatCard from '../../../shared/components/dashboard-ui/StatCard'

/**
 * 4 stat cards cho trang Học viên.
 * @param {{ totalStudents, activeStudents, completedStudents, averageProgress }} stats
 * @param {boolean} loading
 */
export default function StudentStatCards({ stats, loading }) {
  const val = (key) => (loading || !stats ? '—' : (stats[key] ?? '—'))

  return (
    <div className="grid grid-cols-2 min-[480px]:grid-cols-[repeat(auto-fit,minmax(155px,1fr))] gap-[10px]">
      <StatCard
        label="Tổng học viên"
        value={val('totalStudents')}
        icon="users"
        iconColor="purple"
      />
      <StatCard
        label="Đang học"
        value={val('activeStudents')}
        icon="activity"
        iconColor="green"
      />
      <StatCard
        label="Đã hoàn thành"
        value={val('completedStudents')}
        icon="circle-check"
        iconColor="blue"
      />
      <StatCard
        label="Tiến độ trung bình"
        value={loading || !stats ? '—' : `${stats.averageProgress ?? 0}%`}
        icon="chart-bar"
        iconColor="amber"
      />
    </div>
  )
}