// src/features/teacher/components/DashboardStudentsTable.jsx
import { Link } from 'react-router-dom'
import SectionCard          from './TeacherSectionCard'
import AvatarSm             from './TeacherAvatarSm'
import DashboardProgressBar from './DashboardProgressBar'

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60)  return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs} giờ trước`
  return `${Math.floor(hrs / 24)} ngày trước`
}

export default function DashboardStudentsTable({ students = [], loading = false }) {
  return (
    <SectionCard
      style={{ borderTop: '3px solid var(--purple-light)' }}
      title="Học viên gần đây"
      headerRight={
        <Link to="/teacher/students" style={{
          fontSize: 12, color: 'var(--purple)',
          textDecoration: 'none', fontWeight: 500,
        }}>
          Xem tất cả →
        </Link>
      }
    >
      {/*
       * overflow-x: auto — scroll ngang trên màn nhỏ
       * min-width: 400px — Xem RESPONSIVE.md mục 5 (Tables).
       */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="dt" style={{ minWidth: 400 }}>
          <thead>
            <tr>
              <th>Học viên</th>
              <th>Khóa học</th>
              <th>Tiến độ</th>
              <th>Hoạt động gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '24px 0' }}>
                  Đang tải…
                </td>
              </tr>
            )}
            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '24px 0' }}>
                  Chưa có học viên nào
                </td>
              </tr>
            )}
            {!loading && students.map((s, i) => (
              <tr key={s.userId ?? i}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AvatarSm name={s.name} avatar={s.avatar} />
                    <span style={{
                      fontWeight: 600, fontSize: 13,
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis', maxWidth: 120,
                    }}>
                      {s.name}
                    </span>
                  </div>
                </td>
                <td style={{
                  color: 'var(--ink-2)', fontSize: 12,
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: 140,
                }}>
                  {s.courseName}
                </td>
                <td style={{ minWidth: 120 }}>
                  <DashboardProgressBar value={s.progress ?? 0} />
                </td>
                <td style={{ color: 'var(--ink-3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {timeAgo(s.lastActiveAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}