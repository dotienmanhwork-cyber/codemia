// src/features/teacher/pages/TeacherStudents.jsx
import PageHeader       from '../../../shared/components/dashboard-ui/PageHeader'
import StudentStatCards from '../components/StudentStatCards'
import StudentFilterBar from '../components/StudentFilterBar'
import StudentTable     from '../components/StudentTable'
import { useTeacherStudents } from '../hooks/useTeacherStudents'

/* ─────────────────────────────────────────
   TeacherStudents
───────────────────────────────────────── */
export default function TeacherStudents() {
  const {
    stats,
    students,
    courses,
    statusFilter,
    courseFilter,
    search,
    page,
    loadingStats,
    loadingList,
    handleStatus,
    handleCourse,
    handleSearch,
    setPage,
  } = useTeacherStudents()

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        title="Học viên"
        subtitle="Theo dõi tiến độ và hoạt động của tất cả học viên trong các khóa học của bạn."
      />

      {/* Stat cards */}
      <StudentStatCards stats={stats} loading={loadingStats} />

      {/* Table card */}
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        {/* Filter toolbar */}
        <StudentFilterBar
          statusFilter={statusFilter}
          courseFilter={courseFilter}
          courses={courses}
          search={search}
          onStatus={handleStatus}
          onCourse={handleCourse}
          onSearch={handleSearch}
        />

        {/* Bảng + pagination */}
        <StudentTable
          students={students}
          loading={loadingList}
          page={page}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}