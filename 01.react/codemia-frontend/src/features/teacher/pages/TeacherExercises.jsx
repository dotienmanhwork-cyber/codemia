// src/features/teacher/pages/TeacherExercises.jsx
import PageHeader        from '../../../shared/components/dashboard-ui/PageHeader'
import ExerciseStatCards from '../components/ExerciseStatCards'
import ExerciseFilterBar from '../components/ExerciseFilterBar'
import ExerciseTable     from '../components/ExerciseTable'
import { useTeacherExercises } from '../hooks/useTeacherExercises'

export default function TeacherExercises() {
  const {
    stats,
    exercises,
    loading,
    filter,
    search,
    page,
    handleFilter,
    handleSearch,
    setPage,
  } = useTeacherExercises()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header — không có nút tạo vì tạo exercise nằm trong Course Edit */}
      <PageHeader
        title="Bài tập"
        description="Tổng quan về các bài trắc nghiệm và lập trình trong các khóa học của bạn."
      />

      {/* Stat cards — responsive theo RESPONSIVE.md: auto-fit minmax(155px) */}
      <ExerciseStatCards stats={stats} loading={loading} />

      {/* Table card */}
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        <ExerciseFilterBar
          filter={filter}
          search={search}
          onFilter={handleFilter}
          onSearch={handleSearch}
        />

        <ExerciseTable
          exercises={exercises}
          loading={loading}
          page={page}
          onPageChange={setPage}
        />
      </div>

      {/* Info note — giải thích tại sao không có nút tạo */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '10px 14px',
        background: 'var(--blue-bg)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 12, color: 'var(--blue)', lineHeight: 1.6,
      }}>
        <i className="ti ti-info-circle" style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }} />
        <span>
          Để tạo hoặc chỉnh sửa bài tập, hãy truy cập{' '}
          <strong>Khóa học → Chỉnh sửa khóa học → Tab Bài tập</strong>.
          Trang này chỉ hiển thị tổng quan và số liệu thống kê.
        </span>
      </div>
    </div>
  )
}