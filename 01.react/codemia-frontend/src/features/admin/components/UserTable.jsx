// src/features/admin/components/UserTable.jsx
import { useState, useEffect } from 'react'
import StatusBadge   from '../../../shared/components/dashboard-ui/StatusBadge'
import Pagination    from '../../../shared/components/dashboard-ui/Pagination'
import AvatarSm      from './AdminAvatarSm'
import UserRowActions from './UserRowActions'

/* ── Responsive hook ── */
function useIsMobile(bp) {
  const [v, setV] = useState(() => window.innerWidth < bp)
  useEffect(() => {
    const h = () => setV(window.innerWidth < bp)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [bp])
  return v
}

/* ── Helpers ── */
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const ROLE_VARIANT   = { STUDENT: 'neutral', TEACHER: 'blue',   ADMIN: 'purple' }
const ROLE_LABEL     = { STUDENT: 'Học viên', TEACHER: 'Giáo viên', ADMIN: 'Quản trị viên' }
const STATUS_VARIANT = { ACTIVE: 'green', BLOCKED: 'red', PENDING_TEACHER: 'warn' }
const STATUS_LABEL   = { ACTIVE: 'Hoạt động', BLOCKED: 'Đã khóa',   PENDING_TEACHER: 'Chờ duyệt' }

/* ══════════════════════════════════════════════
   UserTable
   Props:
     users, loading, totalElements, totalPages,
     page, keyword,
     onKeywordChange, onPageChange,
     onLock, onUnlock, onDelete
══════════════════════════════════════════════ */
export default function UserTable({
  users,
  loading,
  totalElements,
  totalPages,
  page,
  keyword,
  onKeywordChange,
  onPageChange,
  onLock,
  onUnlock,
  onDelete,
}) {
  /*
   * < 640px : ẩn cột JOINED
   * < 480px : toolbar stack dọc
   */
  const hideJoined   = useIsMobile(640)
  const stackToolbar = useIsMobile(480)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex',
        flexDirection: stackToolbar ? 'column' : 'row',
        alignItems: stackToolbar ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: stackToolbar ? 10 : 0,
        padding: '12px 16px',
        borderBottom: '0.5px solid var(--border)',
      }}>
        <span style={{ fontSize: 13, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
          {loading ? '…' : `${totalElements} người dùng`}
        </span>

        <div style={{ position: 'relative', width: stackToolbar ? '100%' : 260 }}>
          <i className="ti ti-search" style={{
            position: 'absolute', left: 9, top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 14, color: 'var(--ink-3)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="Tìm kiếm theo họ tên, email, vai trò…"
            style={{
              width: '100%', height: 32,
              background: 'var(--border-faint)',
              border: '0.5px solid var(--border)',
              borderRadius: 7,
              padding: '0 12px 0 30px',
              fontSize: 12.5, color: 'var(--ink)',
              outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--purple)'
              e.target.style.boxShadow = '0 0 0 3px rgba(140,6,216,0.08)'
              e.target.style.background = 'var(--surface)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)'
              e.target.style.boxShadow = 'none'
              e.target.style.background = 'var(--border-faint)'
            }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="dt" style={{ minWidth: hideJoined ? 520 : 660 }}>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              {!hideJoined && <th>Ngày tham gia</th>}
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={hideJoined ? 5 : 6} style={{
                  textAlign: 'center', color: 'var(--ink-3)',
                  padding: '32px 16px', fontSize: 13,
                }}>
                  Đang tải...
                </td>
              </tr>
            )}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={hideJoined ? 5 : 6} style={{
                  textAlign: 'center', color: 'var(--ink-3)',
                  padding: '32px 16px', fontSize: 13,
                }}>
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            )}

            {!loading && users.map((u) => (
              <tr key={u.id}>
                {/* User */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AvatarSm name={u.fullName} email={u.email} avatarUrl={u.avatarUrl} />
                    <span style={{
                      fontWeight: 600, fontSize: 13,
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis', maxWidth: 160,
                    }}>
                      {u.fullName ?? '—'}
                    </span>
                  </div>
                </td>

                {/* Email */}
                <td style={{
                  color: 'var(--ink-3)', fontSize: 12.5,
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: 200,
                }}>
                  {u.email}
                </td>

                {/* Role */}
                <td>
                  <StatusBadge
                    label={ROLE_LABEL[u.role] ?? u.role}
                    variant={ROLE_VARIANT[u.role] ?? 'neutral'}
                  />
                </td>

                {/* Joined — hidden < 640px */}
                {!hideJoined && (
                  <td style={{ color: 'var(--ink-3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {fmtDate(u.createdAt)}
                  </td>
                )}

                {/* Status */}
                <td>
                  <StatusBadge
                    label={STATUS_LABEL[u.status] ?? u.status}
                    variant={STATUS_VARIANT[u.status] ?? 'neutral'}
                  />
                </td>

                {/* Actions */}
                <td>
                  <UserRowActions
                    user={u}
                    onLock={()   => onLock(u)}
                    onUnlock={()  => onUnlock(u)}
                    onDelete={()  => onDelete(u)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={onPageChange}
      />
    </div>
  )
}
