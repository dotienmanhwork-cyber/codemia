// src/features/admin/pages/AdminUserDetail.jsx
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '../../../shared/components/dashboard-ui/PageHeader'
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge'
import ConfirmModal from '../../../shared/components/dashboard-ui/ConfirmModal'
import AvatarSm from '../components/AdminAvatarSm'
import {
  getUserDetail,
  updateUserRole,
  getDowngradeImpact,
  downgradeUserRole,
} from '../api/admin.api'

// ── Constants ─────────────────────────────────────────────
const ALLOWED_ROLES = ['STUDENT', 'TEACHER']
const ROLE_VARIANT = { STUDENT: 'neutral', TEACHER: 'blue', ADMIN: 'purple' }
const ROLE_LABEL = { STUDENT: 'Học viên', TEACHER: 'Giảng viên', ADMIN: 'Quản trị viên' }
const STATUS_VARIANT = { ACTIVE: 'green', BLOCKED: 'red' }
const STATUS_LABEL = { ACTIVE: 'Hoạt động', BLOCKED: 'Đã khóa' }

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}
function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  })
}
const fmt = (n) => Number(n ?? 0).toLocaleString('vi-VN') + ' ₫'

// ── Skeleton row ──────────────────────────────────────────
function SkeletonCard({ height = 120 }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)', minHeight: height, opacity: 0.5,
    }} />
  )
}

// ── Card wrapper ─────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Section header inside a card ──────────────────────────
function CardHeader({ title, subtitle }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{subtitle}</div>
      )}
    </div>
  )
}

// ── Downgrade Impact Modal ────────────────────────────────
// Hiển thị trước khi confirm hạ role TEACHER → STUDENT.
// Cho admin nhìn thấy số courses bị ảnh hưởng và nhập lý do.
function DowngradeImpactModal({ open, onClose, onConfirm, user, impact, loading }) {
  const [note, setNote] = useState('')

  // Reset note mỗi lần mở
  useEffect(() => { if (open) setNote('') }, [open])

  if (!open) return null

  const hasImpact = impact && (
    (impact.publishedCourses ?? 0) > 0 ||
    (impact.pendingCourses ?? 0) > 0 ||
    (impact.draftCourses ?? 0) > 0 ||
    (impact.pendingWithdrawals ?? 0) > 0 ||
    (impact.remainingBalance ?? 0) > 0 ||
    (impact.totalFrozenBalance ?? 0) > 0
  )

  return (
    /* Overlay */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        width: '100%', maxWidth: 460,
        display: 'flex', flexDirection: 'column', gap: 0,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="ti ti-arrow-down-circle" style={{ color: 'var(--red)', fontSize: 15 }} />
              Hạ vai trò xuống Học viên
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
              {user?.fullName ?? user?.email} — hành động này không thể hoàn tác tự động.
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-3)', fontSize: 18, lineHeight: 1, padding: 2,
            }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Impact summary */}
          {impact ? (
            hasImpact ? (
              <div style={{
                background: 'var(--red-bg)',
                border: '0.5px solid var(--red)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 2 }}>
                  Tác động khi hạ vai trò
                </div>
                {impact.publishedCourses > 0 && (
                  <ImpactRow icon="ti-book" label="Khoá học đang xuất bản" value={`${impact.publishedCourses} khoá`} />
                )}
                {impact.pendingCourses > 0 && (
                  <ImpactRow icon="ti-clock" label="Khoá học chờ duyệt → sẽ về Bản nháp" value={`${impact.pendingCourses} khoá`} />
                )}
                {impact.draftCourses > 0 && (
                  <ImpactRow icon="ti-file" label="Khoá học nháp" value={`${impact.draftCourses} khoá`} />
                )}

                {impact.pendingWithdrawals > 0 && (
                  <ImpactRow
                    icon="ti-cash"
                    label="Yêu cầu rút tiền đang chờ"
                    value={`${impact.pendingWithdrawals} yêu cầu`}
                  />
                )}
                {(impact.remainingBalance ?? 0) > 0 && (
                  <ImpactRow
                    icon="ti-wallet"
                    label="Số dư còn lại — sẽ tạo lệnh rút thủ công"
                    value={fmt(impact.remainingBalance)}
                  />
                )}
                {(impact.totalFrozenBalance ?? 0) > 0 && (
                  <ImpactRow
                    icon="ti-lock"
                    label="Số dư đang bị giữ (HOLD) — không tạo lệnh rút mới"
                    value={fmt(impact.totalFrozenBalance)}
                  />
                )}
                {(impact.pendingWithdrawals > 0 || (impact.remainingBalance ?? 0) > 0 || (impact.totalFrozenBalance ?? 0) > 0) && (
                  <div style={{ fontSize: 11.5, color: 'var(--red)', marginTop: 2 }}>
                    <i className="ti ti-alert-circle" style={{ marginRight: 4 }} />
                    Yêu cầu rút tiền không có thông tin ngân hàng sẽ chuyển sang trạng thái <strong>TẠM GIỮ (HOLD)</strong> — quản trị viên cần xử lý thủ công.
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: 'var(--green-bg)',
                border: '0.5px solid var(--green)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: 12.5, color: 'var(--green)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <i className="ti ti-circle-check" style={{ fontSize: 15 }} />
                Không có tác động nào — người dùng này chưa có khoá học hoặc giao dịch đang chờ.
              </div>
            )
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Đang tải tác động...</div>
          )}

          {/* Note input */}
          <div>
            <label style={{
              fontSize: 12, fontWeight: 600, color: 'var(--ink-2)',
              display: 'block', marginBottom: 6,
            }}>
              Lý do hạ vai trò <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập lý do để ghi vào nhật ký thay đổi..."
              rows={3}
              disabled={loading}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 12px',
                border: `0.5px solid ${note.trim() ? 'var(--border)' : 'var(--red)'}`,
                borderRadius: 'var(--radius-sm)',
                fontSize: 13, color: 'var(--ink)',
                background: 'var(--surface)',
                fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                opacity: loading ? 0.6 : 1,
              }}
            />
            {!note.trim() && (
              <div style={{ fontSize: 11.5, color: 'var(--red)', marginTop: 4 }}>
                Lý do là bắt buộc để ghi nhật ký thay đổi.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '0.5px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 16px', border: '0.5px solid var(--border)',
              background: 'var(--surface)', color: 'var(--ink-2)',
              borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={loading || !note.trim() || !impact}
            style={{
              padding: '8px 18px', border: 'none',
              background: loading || !note.trim() || !impact ? 'var(--border)' : 'var(--red)',
              color: loading || !note.trim() || !impact ? 'var(--ink-3)' : '#fff',
              borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit',
              cursor: loading || !note.trim() || !impact ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.12s',
            }}
          >
            {loading && <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite', fontSize: 14 }} />}
            Xác nhận hạ vai trò
          </button>
        </div>
      </div>
    </div>
  )
}

function ImpactRow({ icon, label, value, extra }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
      <i className={`ti ${icon}`} style={{ color: 'var(--red)', fontSize: 13, width: 14 }} />
      <span style={{ color: 'var(--ink-2)', flex: 1 }}>{label}</span>
      <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{value}</span>
      {extra && <span style={{ color: 'var(--ink-3)' }}>{extra}</span>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  AdminUserDetail
// ══════════════════════════════════════════════════════════
export default function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [roleLogs, setRoleLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // role change state — upgrade flow (STUDENT → TEACHER)
  const [selectedRole, setSelectedRole] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)

  // downgrade flow (TEACHER → STUDENT)
  const [downgradeOpen, setDowngradeOpen] = useState(false)
  const [impactData, setImpactData] = useState(null)
  const [impactLoading, setImpactLoading] = useState(false)
  const [downgradeLoading, setDowngradeLoading] = useState(false)

  // ── Fetch ───────────────────────────────────────────────
  function loadDetail() {
    return getUserDetail(id)
      .then((res) => {
        const { user: u, roleLogs: logs } = res.result
        setUser(u)
        setRoleLogs(logs ?? [])
        setSelectedRole(u?.role ?? null)
      })
      .catch((err) => {
        console.error('getUserDetail error:', err)
        setNotFound(true)
      })
  }

  useEffect(() => {
    setLoading(true)
    loadDetail().finally(() => setLoading(false))
  }, [id])

  // ── Save Changes: phân nhánh upgrade vs downgrade ────────
  function handleSaveClick() {
    if (!selectedRole || selectedRole === user.role) return

    if (user.role === 'TEACHER' && selectedRole === 'STUDENT') {
      // Downgrade flow: fetch impact trước, rồi mở modal
      openDowngradeModal()
    } else {
      // Upgrade flow (STUDENT → TEACHER): confirm đơn giản
      setConfirmOpen(true)
    }
  }

  // ── Upgrade (STUDENT → TEACHER) ─────────────────────────
  async function handleRoleChange() {
    if (!selectedRole || selectedRole === user.role) return
    setRoleLoading(true)
    try {
      await updateUserRole(id, selectedRole)
      setUser((prev) => ({ ...prev, role: selectedRole }))
      loadDetail()
      setConfirmOpen(false)
    } catch (err) {
      console.error('Role change failed:', err)
    } finally {
      setRoleLoading(false)
    }
  }

  // ── Downgrade (TEACHER → STUDENT) ───────────────────────
  async function openDowngradeModal() {
    setImpactData(null)
    setDowngradeOpen(true)
    setImpactLoading(true)
    try {
      const res = await getDowngradeImpact(id)
      setImpactData(res.result)
    } catch (err) {
      console.error('getDowngradeImpact error:', err)
      // Vẫn cho mở modal, hiển thị lỗi khi impact null
    } finally {
      setImpactLoading(false)
    }
  }

  async function handleDowngradeConfirm(note) {
    setDowngradeLoading(true)
    try {
      await downgradeUserRole(id, note)
      // Optimistic update ngay lập tức
      setUser((prev) => ({ ...prev, role: 'STUDENT' }))
      setSelectedRole('STUDENT')
      setDowngradeOpen(false)
      setImpactData(null)
      // Delay refresh 1s để backend commit xong — tránh loadDetail()
      // overwrite optimistic state bằng stale data (role cũ)
      setTimeout(() => loadDetail(), 1000)
    } catch (err) {
      console.error('Downgrade failed:', err)
      toast.error('Hạ role thất bại. Vui lòng thử lại.')
    } finally {
      setDowngradeLoading(false)
    }
  }

  // ── Derived ─────────────────────────────────────────────
  const isAdmin = user?.role === 'ADMIN'
  const hasRoleChange = selectedRole && user && selectedRole !== user.role
  const isDowngrade = user?.role === 'TEACHER' && selectedRole === 'STUDENT'

  // ── Loading skeleton ────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <PageHeader title="Chi tiết người dùng" subtitle="Đang tải…" />
        <SkeletonCard height={100} />
        <SkeletonCard height={140} />
        <SkeletonCard height={200} />
      </div>
    )
  }

  if (notFound || !user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <PageHeader
          title="Không tìm thấy người dùng"
          subtitle="Người dùng này có thể đã bị xóa."
          action={<BackButton onClick={() => navigate('/admin/users')} />}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Page header ── */}
      <PageHeader
        title="Chi tiết người dùng"
        subtitle="Xem và quản lý tài khoản người dùng."
        action={<BackButton onClick={() => navigate('/admin/users')} />}
      />

      {/* ── User info card ── */}
      <Card style={{ padding: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 16, flexWrap: 'wrap',
        }}>
          <AvatarSm name={user.fullName} email={user.email} avatarUrl={user.avatarUrl} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              {user.fullName ?? '—'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>
              {user.email}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
              Đã tham gia {fmtDate(user.createdAt)}
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge
              label={ROLE_LABEL[user.role] ?? user.role}
              variant={ROLE_VARIANT[user.role] ?? 'neutral'}
            />
            <StatusBadge
              label={STATUS_LABEL[user.status] ?? user.status}
              variant={STATUS_VARIANT[user.status] ?? 'neutral'}
            />
          </div>
        </div>
      </Card>

      {/* ── Role management card ── */}
      <Card>
        <CardHeader
          title="Quản lý vai trò"
          subtitle="Thay đổi vai trò cho người dùng này. Chỉ cho phép chuyển đổi Học viên ↔ Giảng viên."
        />

        <div style={{ padding: 20 }}>
          {isAdmin ? (
            /* Admin role — read-only */
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, color: 'var(--ink-3)',
              padding: '12px 14px',
              background: 'var(--border-faint)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <i className="ti ti-shield" style={{ fontSize: 15, color: 'var(--purple)' }} />
              Không thể thay đổi vai trò Quản trị viên từ bảng này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Role radio group */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {ALLOWED_ROLES.map((role) => {
                  const active = selectedRole === role
                  return (
                    <label
                      key={role}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 16px',
                        border: `0.5px solid ${active ? 'var(--purple)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        background: active ? 'var(--purple-light)' : 'var(--bg)',
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="radio"
                        name="roleSelect"
                        value={role}
                        checked={active}
                        onChange={() => setSelectedRole(role)}
                        style={{ accentColor: 'var(--purple)', cursor: 'pointer' }}
                      />
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: active ? 'var(--purple-dim)' : 'var(--ink-2)',
                      }}>
                        {ROLE_LABEL[role]}
                      </span>
                    </label>
                  )
                })}
              </div>

              {/* Save button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  disabled={!hasRoleChange}
                  onClick={handleSaveClick}
                  style={{
                    padding: '8px 18px',
                    background: hasRoleChange
                      ? isDowngrade ? 'var(--red)' : 'var(--ink)'
                      : 'var(--border)',
                    color: hasRoleChange ? '#fff' : 'var(--ink-3)',
                    border: 'none', borderRadius: 'var(--radius-sm)',
                    fontSize: 13, fontWeight: 600,
                    cursor: hasRoleChange ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                    transition: 'all 0.12s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    if (hasRoleChange) e.currentTarget.style.opacity = '0.85'
                  }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  {isDowngrade && <i className="ti ti-arrow-down-circle" style={{ fontSize: 13 }} />}
                  {isDowngrade ? 'Hạ vai trò' : 'Lưu thay đổi'}
                </button>

                {hasRoleChange && (
                  <span style={{ fontSize: 12, color: isDowngrade ? 'var(--red)' : 'var(--ink-3)' }}>
                    <i className="ti ti-arrow-right" style={{ marginRight: 4 }} />
                    {ROLE_LABEL[user.role]} → {ROLE_LABEL[selectedRole]}
                    {isDowngrade && (
                      <span style={{ marginLeft: 6, fontWeight: 600 }}>
                        — Xem tác động trước khi xác nhận
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Audit log card ── */}
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader
          title="Lịch sử thay đổi vai trò"
          subtitle="Tất cả các thay đổi vai trò của tài khoản này."
        />

        {roleLogs.length === 0 ? (
          <div style={{
            padding: '32px 24px', textAlign: 'center',
            color: 'var(--ink-3)', fontSize: 13,
          }}>
            Chưa ghi nhận lịch sử thay đổi vai trò nào.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="dt">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Người thực hiện</th>
                  <th>Vai trò cũ</th>
                  <th>Vai trò mới</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {roleLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                      {fmtDateTime(log.changedAt)}
                    </td>
                    <td style={{ fontSize: 13 }}>{log.changedByEmail}</td>
                    <td>
                      <StatusBadge
                        label={ROLE_LABEL[log.fromRole] ?? log.fromRole}
                        variant={ROLE_VARIANT[log.fromRole] ?? 'neutral'}
                      />
                    </td>
                    <td>
                      <StatusBadge
                        label={ROLE_LABEL[log.toRole] ?? log.toRole}
                        variant={ROLE_VARIANT[log.toRole] ?? 'neutral'}
                      />
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      {log.note ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Upgrade confirm modal (STUDENT → TEACHER) ── */}
      {confirmOpen && (
        <ConfirmModal
          open
          onClose={() => !roleLoading && setConfirmOpen(false)}
          onConfirm={handleRoleChange}
          title={`Thay đổi vai trò thành ${ROLE_LABEL[selectedRole]}?`}
          description={`Vai trò của ${user.fullName ?? user.email} sẽ được thay đổi từ ${ROLE_LABEL[user.role]} sang ${ROLE_LABEL[selectedRole]}.`}
          confirmLabel="Lưu thay đổi"
          danger={false}
          loading={roleLoading}
        />
      )}

      {/* ── Downgrade impact modal (TEACHER → STUDENT) ── */}
      <DowngradeImpactModal
        open={downgradeOpen}
        onClose={() => { if (!downgradeLoading) { setDowngradeOpen(false); setImpactData(null) } }}
        onConfirm={handleDowngradeConfirm}
        user={user}
        impact={impactLoading ? null : impactData}
        loading={downgradeLoading}
      />
    </div>
  )
}

// ── Back button ───────────────────────────────────────────
function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 15px',
        background: 'var(--surface)',
        color: 'var(--ink-2)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-faint)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
    >
      <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
      Quay lại danh sách
    </button>
  )
}