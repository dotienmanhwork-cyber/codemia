// src/features/teacher/components/CourseStatCards.jsx
import StatCard from '../../../shared/components/dashboard-ui/StatCard';

/**
 * @param {{ totalCourses, publishedCourses, draftCourses, totalStudents }} stats
 * @param {boolean} loading
 */
export default function CourseStatCards({ stats, loading }) {
  const fmt = (v) => (loading ? '…' : (v ?? 0));

  return (
    <div className="grid grid-cols-2 min-[480px]:grid-cols-[repeat(auto-fit,minmax(155px,1fr))] gap-[10px]">
      <StatCard
        label="Tổng khóa học"
        value={fmt(stats.totalCourses)}
        icon="book"
        iconColor="purple"
      />
      <StatCard
        label="Đã xuất bản"
        value={fmt(stats.publishedCourses)}
        icon="circle-check"
        iconColor="green"
      />
      <StatCard
        label="Bản nháp"
        value={fmt(stats.draftCourses)}
        icon="pencil"
        iconColor="amber"
      />
      <StatCard
        label="Tổng học viên"
        value={loading ? '…' : (stats.totalStudents ?? 0).toLocaleString('vi-VN')}
        icon="users"
        iconColor="blue"
      />
    </div>
  );
}