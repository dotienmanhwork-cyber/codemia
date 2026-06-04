// src/features/teacher/components/StudentTable.jsx
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge'
import Pagination  from '../../../shared/components/dashboard-ui/Pagination'

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const PAGE_SIZE = 8

const STATUS_CONFIG = {
  ACTIVE:      { label: 'Đang học',      variant: 'green'   },
  COMPLETED:   { label: 'Đã hoàn thành', variant: 'blue'    },
  INACTIVE:    { label: 'Ngừng học',     variant: 'amber'   },
  NOT_STARTED: { label: 'Chưa bắt đầu', variant: 'neutral' },
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

/** Lấy 2 chữ cái đầu từ họ tên */
function getInitials(name = '') {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Chọn màu avatar xác định theo tên (không random mỗi render) */
function getAvatarColors(name = '') {
  const idx =
    [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[idx]
}

/** Format ISO datetime → relative time */
function formatRelativeTime(isoStr) {
  if (!isoStr) return '—'
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60_000)
  const hrs  = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1)  return 'Vừa xong'
  if (hrs  < 1)  return `${mins} phút trước`
  if (days < 1)  return `${hrs} giờ trước`
  if (days < 30) return `${days} ngày trước`
  return new Date(isoStr).toLocaleDateString('vi-VN')
}

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */

/**
 * Avatar tròn: ưu tiên URL từ API, fallback initials + màu từ tên.
 * API field: avatar (string | null)
 */
const Avatar = ({ name, avatarUrl }) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: 30, height: 30, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
        }}
      />
    )
  }
  const { bg, color } = getAvatarColors(name)
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  )
}

/**
 * Progress bar ngang với màu theo mức độ.
 * 100% → blue | ≥70% → green | ≥30% → purple | <30% → amber
 */
const ProgressBar = ({ value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
    <div style={{
      flex: 1, height: 4, background: 'var(--border)',
      borderRadius: 99, overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', borderRadius: 99,
        width: `${value}%`,
        background:
          value === 100 ? 'var(--blue)'   :
          value >= 70   ? 'var(--green)'  :
          value >= 30   ? 'var(--purple)' : 'var(--amber)',
        transition: 'width 0.3s ease',
      }} />
    </div>
    <span style={{ fontSize: 11, color: 'var(--ink-3)', minWidth: 30, textAlign: 'right' }}>
      {value}%
    </span>
  </div>
)

/* ─────────────────────────────────────────
   StudentTable
───────────────────────────────────────── */

/**
 * Bảng danh sách học viên.
 * `students` đã được filter theo status từ hook — chỉ cần paginate ở đây.
 *
 * @param {Array}    students      - list đã filter (từ useTeacherStudents)
 * @param {boolean}  loading
 * @param {number}   page          - trang hiện tại (1-indexed)
 * @param {Function} onPageChange
 */
export default function StudentTable({ students, loading, page, onPageChange }) {
  const totalPages = Math.ceil(students.length / PAGE_SIZE)
  const safePage   = Math.min(page, Math.max(totalPages, 1))
  const paged      = students.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="dt min-w-[400px]">
          <thead>
            <tr>
              <th>Học viên</th>
              <th>Khóa học</th>
              <th>Tiến độ</th>
              <th>Lượt nộp bài</th>
              <th>Hoạt động gần nhất</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {/* Loading state */}
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '32px 16px' }}>
                  Đang tải…
                </td>
              </tr>
            )}

            {/* Empty state */}
            {!loading && paged.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '32px 16px' }}>
                  Không tìm thấy học viên nào
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading && paged.map((s) => {
              const statusCfg = STATUS_CONFIG[s.status] ?? { label: s.status, variant: 'neutral' }
              return (
                <tr key={`${s.userId}-${s.courseId}`}>
                  {/* Học viên: avatar + tên + email */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Avatar name={s.name} avatarUrl={s.avatar} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{
                          fontWeight: 600, fontSize: 13, color: 'var(--ink)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {s.name}
                        </div>
                        <div style={{
                          fontSize: 11, color: 'var(--ink-3)', marginTop: 1,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {s.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Khóa học */}
                  <td style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    {s.courseName}
                  </td>

                  {/* Tiến độ */}
                  <td>
                    <ProgressBar value={s.progress} />
                  </td>

                  {/* Bài tập nộp — API field: exercisesSubmitted */}
                  <td style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                    {s.exercisesSubmitted}
                  </td>

                  {/* Lần cuối HĐ — API field: lastActiveAt (ISO) → relative time */}
                  <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {formatRelativeTime(s.lastActiveAt)}
                  </td>

                  {/* Trạng thái */}
                  <td>
                    <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: số học viên đang hiển thị (sau filter) + pagination */}
      <div className="flex items-center justify-between p-[8px_16px_4px] max-[767px]:p-[8px_12px_4px] max-[767px]:flex-wrap max-[767px]:gap-1.5">
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          {students.length} học viên
        </span>
        <Pagination page={safePage} totalPages={totalPages} onChange={onPageChange} />
      </div>
    </>
  )
}