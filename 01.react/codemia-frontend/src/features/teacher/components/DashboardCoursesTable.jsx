// src/features/teacher/components/DashboardCoursesTable.jsx
import { Link } from 'react-router-dom'
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge'
import SectionCard from './TeacherSectionCard'
import { formatVND } from '../../../shared/utils/format'

const STATUS_MAP = {
  PUBLISHED: { label: 'Đã xuất bản', variant: 'green'   },
  DRAFT:     { label: 'Bản nháp',      variant: 'neutral'  },
  PENDING:   { label: 'Chờ duyệt',    variant: 'warn'     },
  REJECTED:  { label: 'Bị từ chối',   variant: 'red'      },
}

export default function DashboardCoursesTable({ courses = [], loading = false }) {
  return (
    <SectionCard
      style={{ borderTop: '3px solid var(--purple-light)' }}
      title="Khóa học của tôi"
      headerRight={
        <Link to="/teacher/courses" style={{
          fontSize: 12, color: 'var(--purple)',
          textDecoration: 'none', fontWeight: 500,
        }}>
          Xem tất cả →
        </Link>
      }
    >
      {/*
       * overflow-x: auto — bảng scroll ngang trên màn nhỏ
       * min-width: 480px — giữ bảng không bị bóp vỡ
       * Xem RESPONSIVE.md mục 5 (Tables).
       */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="dt" style={{ minWidth: 480 }}>
          <thead>
            <tr>
              <th>Khóa học</th>
              <th>Học viên</th>
              <th>Đánh giá</th>
              <th>Doanh thu</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '24px 0' }}>
                  Đang tải…
                </td>
              </tr>
            )}
            {!loading && courses.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '24px 0' }}>
                  Chưa có khóa học nào
                </td>
              </tr>
            )}
            {!loading && courses.map((c) => {
              const s = STATUS_MAP[c.status] ?? STATUS_MAP.DRAFT
              return (
                <tr key={c.id}>
                  <td>
                    <span style={{
                      fontWeight: 600, fontSize: 13,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      maxWidth: 220,
                    }}>
                      {c.title}
                    </span>
                  </td>
                  <td style={{ color: 'var(--ink-2)' }}>
                    {(c.totalStudents ?? 0).toLocaleString()}
                  </td>
                  <td style={{ color: 'var(--amber)' }}>
                    {c.rating ? `★ ${c.rating}` : '—'}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--green)', whiteSpace: 'nowrap' }}>
                    {formatVND(c.revenue ?? 0)}
                  </td>
                  <td>
                    <StatusBadge label={s.label} variant={s.variant} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}