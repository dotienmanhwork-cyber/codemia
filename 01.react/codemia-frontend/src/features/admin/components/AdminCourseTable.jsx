// src/features/admin/components/AdminCourseTable.jsx
import StatusBadge from '@/shared/components/dashboard-ui/StatusBadge'
import Pagination  from '@/shared/components/dashboard-ui/Pagination'

/* ── Helpers ── */
const STATUS_VARIANT = {
  PUBLISHED: 'green',
  UNLISTED:  'neutral',
  PENDING:   'amber',
  DRAFT:     'neutral',
  REJECTED:  'rejected',
  SUSPENDED: 'red',
}

const STATUS_LABEL = {
  PUBLISHED: 'Đã xuất bản',
  UNLISTED:  'Đang ẩn',
  PENDING:   'Chờ duyệt',
  DRAFT:     'Bản nháp',
  REJECTED:  'Đã từ chối',
  SUSPENDED: 'Đã khóa',
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function fmtPrice(val) {
  if (val == null || Number(val) === 0) return 'Miễn phí'
  return `${Number(val).toLocaleString('vi-VN')} ₫`
}

/* ── ActBtn — local action button ── */
const ActBtn = ({ children, variant = 'ghost', onClick }) => {
  const s = {
    dark:  { background: 'var(--ink)',     color: '#fff',          border: 'none'                        },
    ghost: { background: 'var(--surface)', color: 'var(--ink-2)',  border: '0.5px solid var(--border)'   },
    red:   { background: 'var(--red-bg)',  color: 'var(--red)',    border: '0.5px solid var(--red-bg)'   },
    green: { background: 'var(--green-bg)',color: 'var(--green)',  border: '0.5px solid var(--green-bg)' },
  }
  const h = { dark: '#2d2f31', ghost: 'var(--border-faint)', red: '#ffc8c4', green: '#d5ecc4' }
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11, fontWeight: 600, padding: '4px 10px',
        borderRadius: 'var(--radius-xs)', cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.12s',
        ...s[variant],
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = h[variant]}
      onMouseLeave={(e) => e.currentTarget.style.background = s[variant].background}
    >
      {children}
    </button>
  )
}

/* ══════════════════════════════════════════════
   AdminCourseTable
   Props:
     courses       — AdminCourseResponse[]
     loading       — boolean
     totalElements — number
     totalPages    — number
     page          — number (1-based)
     onPageChange  — (page: number) => void
     onRowClick    — (course) => void
     onApprove     — (course) => void
     onReject      — (course) => void
     onRepublish   — (course) => void
     onDelete      — (course) => void
 ══════════════════════════════════════════════ */
export default function AdminCourseTable({
  courses,
  loading,
  totalElements,
  totalPages,
  page,
  onPageChange,
  onRowClick,
  onApprove,
  onReject,
  onRepublish,
  onSuspend,
  onRestore,
  onDelete,
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    }}>
      {/* Total count row */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '0.5px solid var(--border)',
        fontSize: 13, color: 'var(--ink-3)',
      }}>
        {loading ? '…' : `${totalElements} khóa học`}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="dt" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th>Khóa học</th>
              <th>Giảng viên</th>
              <th>Giá</th>
              <th>Học viên</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{
                  textAlign: 'center', color: 'var(--ink-3)',
                  padding: '32px 16px', fontSize: 13,
                }}>
                  Đang tải…
                </td>
              </tr>
            )}

            {!loading && courses.length === 0 && (
              <tr>
                <td colSpan={7} style={{
                  textAlign: 'center', color: 'var(--ink-3)',
                  padding: '32px 16px', fontSize: 13,
                }}>
                  Không tìm thấy khóa học nào
                </td>
              </tr>
            )}

            {!loading && courses.map((c) => (
              <tr
                key={c.id}
                onClick={() => onRowClick(c)}
                style={{ cursor: 'pointer' }}
              >
                {/* Title */}
                <td>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>
                    {c.title}
                  </span>
                </td>

                {/* Teacher */}
                <td style={{ color: 'var(--ink-2)', fontSize: 13 }}>
                  {c.teacherName ?? '—'}
                </td>

                {/* Price */}
                <td style={{
                  fontSize: 13, fontWeight: 600,
                  color: Number(c.price) === 0 ? 'var(--green)' : 'var(--ink-2)',
                  whiteSpace: 'nowrap',
                }}>
                  {fmtPrice(c.price)}
                </td>

                {/* Students */}
                <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>
                  {c.totalStudents.toLocaleString()}
                </td>

                {/* Created */}
                <td style={{ color: 'var(--ink-3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {fmtDate(c.createdAt)}
                </td>

                {/* Status */}
                <td>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <StatusBadge
                      label={STATUS_LABEL[c.status] ?? c.status}
                      variant={STATUS_VARIANT[c.status] ?? 'neutral'}
                    />
                    {c.status === 'PENDING' && c.submissionType && (
                      <StatusBadge
                        label={c.submissionType === 'NEW' ? 'Mới' : 'Cập nhật'}
                        variant={c.submissionType === 'NEW' ? 'blue' : 'purple'}
                      />
                    )}
                  </div>
                </td>

                {/* Actions — stopPropagation để không trigger row click */}
                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {c.status === 'PENDING' && (
                      <>
                        <ActBtn variant="green" onClick={() => onApprove(c)}>
                          Phê duyệt
                        </ActBtn>
                        <ActBtn variant="red" onClick={() => onReject(c)}>
                          Từ chối
                        </ActBtn>
                      </>
                    )}
                    {(c.status === 'PUBLISHED' || c.status === 'UNLISTED') && (
                      <ActBtn variant="red" onClick={() => onSuspend(c)}>
                        Khóa
                      </ActBtn>
                    )}
                    {c.status === 'SUSPENDED' && (
                      <ActBtn variant="green" onClick={() => onRestore(c)}>
                        Mở khóa
                      </ActBtn>
                    )}
                    <ActBtn variant="red" onClick={() => onDelete(c)}>
                      Xóa
                    </ActBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </div>
  )
}