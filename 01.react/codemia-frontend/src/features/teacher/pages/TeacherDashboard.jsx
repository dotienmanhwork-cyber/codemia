// src/features/teacher/pages/TeacherDashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard   from '../../../shared/components/dashboard-ui/StatCard'
import PageHeader from '../../../shared/components/dashboard-ui/PageHeader'

import { useTeacherDashboard } from '../hooks/useTeacherDashboard'

import { formatVND } from '../../../shared/utils/format'
import DashboardCoursesTable  from '../components/DashboardCoursesTable'
import DashboardStudentsTable from '../components/DashboardStudentsTable'
import DashboardRevenueFeed   from '../components/DashboardRevenueFeed'

/*
 * Breakpoints dùng trong file này — xem RESPONSIVE.md mục 6:
 *   480  → stat cards 2×2 (mobile-sm)
 *   1280 → revenue feed xuống dưới (desktop-lg)
 *
 * Breakpoint sidebar (1024px) được xử lý ở DashboardLayout,
 * không cần dùng lại ở đây.
 */
function useIsMobile(breakpoint) {
  const [val, setVal] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setVal(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return val
}

export default function TeacherDashboard() {
  const navigate = useNavigate()

  /* Breakpoints nội bộ trang — xem RESPONSIVE.md mục 5 */
  const isSmallCard = useIsMobile(480)   // stat cards → 2×2
  const isOneCol    = useIsMobile(1280)  // revenue feed xuống dưới

  /* Hook */
  const { stats, courses, students, revenue, loading } = useTeacherDashboard()

  const draftCount = stats?.draftCourses ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Header ── */}
      <PageHeader
        title="Bảng điều khiển Giảng viên"
        subtitle="Tổng quan về các khóa học, học viên và doanh thu của bạn."
        action={
          <button
            onClick={() => navigate('/teacher/courses')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 15px',
              background: 'var(--purple)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.12s',
              whiteSpace: 'nowrap',
              /* touch target đủ cao */
              minHeight: 36,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--purple-dim)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--purple)'}
          >
            <i className="ti ti-plus" style={{ fontSize: 14 }} />
            Tạo khóa học
          </button>
        }
      />

      {/* ── Stat Cards ──────────────────────────────────────────
       * < 480px  : 2×2 grid
       * ≥ 480px  : auto-fit 4 cột
       * Xem RESPONSIVE.md mục 5.
       * ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isSmallCard
          ? 'repeat(2, 1fr)'
          : 'repeat(auto-fit, minmax(155px, 1fr))',
        gap: 10,
      }}>
        <StatCard
          label="Tổng học viên"
          value={loading ? '…' : (stats?.totalStudents?.toLocaleString() ?? '—')}
          icon="users" iconColor="purple"
          badge={loading ? undefined : `↑ +${stats?.studentGrowth ?? 0}%`}
          badgeType="up"
        />
        <StatCard
          label="Khóa học"
          value={loading ? '…' : (stats?.totalCourses ?? '—')}
          icon="book" iconColor="blue"
          badge={!loading && draftCount > 0 ? `${draftCount} bản nháp` : undefined}
          badgeType="warn"
        />
        <StatCard
          label="Doanh thu tháng"
          value={loading ? '…' : (stats ? formatVND(stats?.monthlyRevenue ?? 0) : '—')}
          icon="trending-up" iconColor="green"
          badge={loading ? undefined : `↑ +${stats?.revenueGrowth ?? 0}%`}
          badgeType="up"
        />
        <StatCard
          label="Đánh giá trung bình"
          value={
            loading ? '…' : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {stats?.averageRating ?? '—'}
                <i className="ti ti-star-filled" style={{ fontSize: 20, color: 'var(--amber)' }} />
              </span>
            )
          }
          icon="star" iconColor="amber"
          badge={loading ? undefined : 'Xuất sắc'}
          badgeType="up"
        />
      </div>

      {/* ── Main Grid ───────────────────────────────────────────
       * ≥ 1280px : 2 cột — bảng (1fr) | revenue feed (260px)
       * < 1280px : 1 cột  — revenue feed xuống dưới bảng
       * Xem RESPONSIVE.md mục 5.
       * ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isOneCol ? '1fr' : '1fr 260px',
        gap: 10,
        alignItems: 'start',
      }}>

        {/* Bảng khóa học + học viên */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <DashboardCoursesTable  courses={courses}   loading={loading} />
          <DashboardStudentsTable students={students} loading={loading} />
        </div>

        {/* Revenue feed */}
        <DashboardRevenueFeed
          revenue={revenue}
          loading={loading}
          monthlyTotal={stats?.monthlyRevenue}
        />
      </div>

    </div>
  )
}