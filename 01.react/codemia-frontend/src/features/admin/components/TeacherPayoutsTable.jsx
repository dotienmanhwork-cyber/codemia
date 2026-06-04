// src/features/admin/components/TeacherPayoutsTable.jsx
import { useState } from 'react'
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge'
import Pagination from '../../../shared/components/dashboard-ui/Pagination'

const PAGE_SIZE = 5

/**
 * @param {{
 *   data: Array,
 *   loading: boolean,
 *   activeMonth: string,       // 'YYYY-MM'
 *   onMonthChange: (m: string) => void
 * }} props
 */
export default function TeacherPayoutsTable({ data = [], loading, activeMonth, onMonthChange }) {
  const [page, setPage] = useState(1)

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

  // "2025-05" → "Tháng 5 năm 2025"
  const longMonth = (str) => {
    const [y, m] = str.split('-')
    return new Date(y, m - 1).toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
  }

  // Build list of last 6 months for the month picker
  const monthOptions = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { val, label: longMonth(val) }
  })

  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const paged = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleMonthChange = (e) => {
    setPage(1)
    onMonthChange(e.target.value)
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 16px', borderBottom: '0.5px solid var(--border)',
        gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
          Chi trả giáo viên
        </span>

        {/* Month picker — thay StatusBadge tĩnh bằng select có thể đổi tháng */}
        <select
          value={activeMonth}
          onChange={handleMonthChange}
          style={{
            fontSize: 12, fontWeight: 600,
            color: 'var(--ink-2)',
            background: 'var(--surface-alt, #F3F4F6)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 8px', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {monthOptions.map((o) => (
            <option key={o.val} value={o.val}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Scrollable table wrapper */}
      <div style={{ overflowX: 'auto' }}>
        <table className="dt" style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th>Giáo viên</th>
              <th>Khóa học</th>
              <th>Học viên</th>
              <th>Doanh thu</th>
              <th>Chi trả (75%)</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <td key={j}>
                      <div style={{
                        height: 14, borderRadius: 4,
                        background: 'var(--border-faint)',
                        animation: 'pulse 1.4s ease-in-out infinite',
                        width: j === 1 ? '100px' : j === 6 ? '50px' : '40px',
                      }} />
                    </td>
                  ))}
                </tr>
              ))
              : paged.map((t) => (
                <tr key={t.teacherId}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{t.teacherName}</td>
                  <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>{t.totalCourses}</td>
                  <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>
                    {t.totalStudents.toLocaleString()}
                  </td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt(t.earned)}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(t.payout)}</td>
                  <td>
                    <StatusBadge
                      label={t.status === 'PAID' ? 'Đã chi trả' : 'Chờ xử lý'}
                      variant={t.status === 'PAID' ? 'green' : 'amber'}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </div>
  )
}