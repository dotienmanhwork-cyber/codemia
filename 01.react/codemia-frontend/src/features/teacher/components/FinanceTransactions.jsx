// src/features/teacher/components/FinanceTransactions.jsx
import StatusBadge  from '../../../shared/components/dashboard-ui/StatusBadge'
import SearchBar    from '../../../shared/components/dashboard-ui/SearchBar'
import Pagination   from '../../../shared/components/dashboard-ui/Pagination'
import { formatVND } from '../../../shared/utils/format'

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const TX_TYPE_LABELS = {
  ENROLLMENT: 'Đăng ký',
  REFUND:     'Hoàn tiền',
}

const AVATAR_PALETTE = [
  { bg: '#F3DAFF', color: '#6d00ab' },
  { bg: '#E6F1FB', color: '#185FA5' },
  { bg: '#EAF3DE', color: '#1E7E34' },
  { bg: '#FAEEDA', color: '#854F0B' },
  { bg: '#ffdad6', color: '#93000a' },
]

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function getInitials(name = '') {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getAvatarColors(name = '') {
  const idx = [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[idx]
}

/**
 * ISO datetime → { date, time }
 * 'May 15, 2025' / '10:30 AM'
 */
function formatDateTime(isoStr) {
  if (!isoStr) return { date: '—', time: '—' }
  const d = new Date(isoStr)
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return { date, time }
}

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */
const Avatar = ({ name, avatarUrl }) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  const { bg, color } = getAvatarColors(name)
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700, flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  )
}

/* ─────────────────────────────────────────
   FinanceTransactions
───────────────────────────────────────── */

/**
 * Bảng lịch sử giao dịch với server-side pagination.
 *
 * API: GET /api/teacher/finance/transactions?page={page-1}&size={size}&keyword={keyword}
 * Response: { transactions, total, page, size }
 *
 * @param {Array}    transactions  - mảng giao dịch trang hiện tại
 * @param {number}   total         - tổng số giao dịch (dùng tính totalPages)
 * @param {number}   size          - page size
 * @param {boolean}  loading
 * @param {number}   page          - trang hiện tại (1-indexed)
 * @param {string}   search        - giá trị search box
 * @param {Function} onPageChange  - (page: number) => void
 * @param {Function} onSearch      - (keyword: string) => void
 */
export default function FinanceTransactions({
  transactions,
  total,
  size,
  loading,
  page,
  search,
  onPageChange,
  onSearch,
}) {
  const totalPages = Math.ceil(total / size)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-[12px_16px] max-[767px]:p-[10px_12px] max-[479px]:p-[8px_10px] gap-3 max-[767px]:gap-2 border-b border-b-[0.5px] border-[var(--border)] flex-wrap">
        {/* Title + Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
            Lịch sử giao dịch
          </span>
          
        </div>

        {/* Search — API chỉ hỗ trợ keyword, không có course filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <SearchBar
            value={search}
            onChange={onSearch}
            placeholder="Tìm học viên, khóa học…"
            width={210}
          />
        </div>
      </div>

      {/* Table — min-width: 520px theo RESPONSIVE.md */}
      <div className="overflow-x-auto">
        <table className="dt min-w-[520px]">
          <thead>
            <tr>
              <th>Học viên</th>
              <th>Khóa học</th>
              <th>Loại</th>
              <th>Số tiền</th>
              <th>Ngày</th>
              <th>Giờ</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '32px 16px' }}>
                  Đang tải…
                </td>
              </tr>
            )}

            {!loading && transactions.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '32px 16px' }}>
                  Không tìm thấy giao dịch nào
                </td>
              </tr>
            )}

            {!loading && transactions.map((t) => {
              const { date, time } = formatDateTime(t.createdAt)
              return (
                <tr key={t.orderId}>
                  {/* Học viên: avatar + tên */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={t.studentName} avatarUrl={t.studentAvatar} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{
                          fontWeight: 600, fontSize: 13, color: 'var(--ink)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {t.studentName}
                        </div>
                        <div style={{
                          fontSize: 11, color: 'var(--ink-3)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {t.studentEmail}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Khóa học */}
                  <td style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t.courseName}</td>

                  {/* Loại — API field: type (e.g. "Enrollment") */}
                  <td>
                    <StatusBadge label={TX_TYPE_LABELS[t.type?.toUpperCase()] ?? t.type} variant="blue" />
                  </td>

                  {/* Số tiền */}
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--green)' }}>
                      +{formatVND(t.amount)}
                    </span>
                  </td>

                  {/* Ngày */}
                  <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{date}</td>

                  {/* Giờ */}
                  <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>{time}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: tổng số + pagination */}
      <div className="flex items-center justify-between p-[8px_16px_4px] max-[767px]:p-[8px_12px_4px] max-[767px]:flex-wrap max-[767px]:gap-1.5">
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          {total} giao dịch
        </span>
        <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      </div>
    </div>
  )
}