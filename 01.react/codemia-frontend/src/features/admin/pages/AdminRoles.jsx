// src/features/admin/pages/AdminRoles.jsx
import { useState, useEffect } from 'react'
import PageHeader          from '../../../shared/components/dashboard-ui/PageHeader'
import StatusBadge         from '../../../shared/components/dashboard-ui/StatusBadge'
import ConfirmModal        from '../../../shared/components/dashboard-ui/ConfirmModal'
import FormModal           from '../../../shared/components/dashboard-ui/FormModal'
import RoleRequestCard     from '../components/RoleRequestCard'
import RoleDecisionHistory from '../components/RoleDecisionHistory'
import {
  getRoleRequests,
  approveRoleRequest,
  declineRoleRequest,
} from '../api/admin.api'

function toTitle(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export default function AdminRoles() {
  const [requests,      setRequests]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [approveTarget, setApproveTarget] = useState(null)
  const [declineTarget, setDeclineTarget] = useState(null)
  const [declineReason, setDeclineReason] = useState('')
  const [done,          setDone]          = useState([])

  useEffect(() => {
    getRoleRequests()
      .then((res) => setRequests(res.result ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleApprove() {
    if (!approveTarget) return
    setActionLoading(approveTarget.userId)
    try {
      await approveRoleRequest(approveTarget.userId)
      setRequests((prev) => prev.filter((r) => r.userId !== approveTarget.userId))
      setDone((prev) => [{ ...approveTarget, decision: 'approve' }, ...prev])
      setApproveTarget(null)
    } catch (err) {
      console.error('Approve failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDecline() {
    if (!declineTarget) return
    setActionLoading(declineTarget.userId)
    try {
      await declineRoleRequest(declineTarget.userId, declineReason.trim() || null)
      setRequests((prev) => prev.filter((r) => r.userId !== declineTarget.userId))
      setDone((prev) => [{ ...declineTarget, decision: 'decline', declineReason }, ...prev])
      setDeclineTarget(null)
      setDeclineReason('')
    } catch (err) {
      console.error('Decline failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const isDeclineLoading = declineTarget && actionLoading === declineTarget.userId

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <PageHeader title="Duyệt giảng viên" subtitle="Xem xét và phê duyệt các đơn đăng ký trở thành giảng viên." />
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '16px 20px', minHeight: 120, opacity: 0.5,
          }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        title="Duyệt giảng viên"
        subtitle="Xem xét và phê duyệt các đơn đăng ký trở thành giảng viên."
        action={requests.length > 0 && <StatusBadge label={`${requests.length} chờ xử lý`} variant="amber" />}
      />

      {requests.length === 0 && done.length === 0 && (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '48px 24px',
          textAlign: 'center', color: 'var(--ink-3)', fontSize: 13,
        }}>
          Không có yêu cầu phê duyệt giảng viên nào đang chờ.
        </div>
      )}

      {requests.map((req) => (
        <RoleRequestCard
          key={req.userId}
          req={req}
          isActioning={actionLoading === req.userId}
          onApprove={setApproveTarget}
          onDecline={(r) => { setDeclineTarget(r); setDeclineReason('') }}
        />
      ))}

      <RoleDecisionHistory done={done} />

      {approveTarget && (
        <ConfirmModal
          open
          onClose={() => setApproveTarget(null)}
          onConfirm={handleApprove}
          title={`Phê duyệt ${approveTarget.name ?? approveTarget.email}?`}
          description={`${approveTarget.name ?? approveTarget.email} sẽ được nâng cấp từ ${toTitle(approveTarget.currentRole)} lên ${toTitle(approveTarget.requestedRole)}.`}
          confirmLabel="Phê duyệt"
          danger={false}
        />
      )}

      {declineTarget && (
        <FormModal
          open
          onClose={() => { setDeclineTarget(null); setDeclineReason('') }}
          onSubmit={handleDecline}
          title={`Từ chối ${declineTarget.name ?? declineTarget.email}?`}
          submitLabel="Từ chối"
          loading={!!isDeclineLoading}
          width={420}
        >
          <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            Yêu cầu của {declineTarget.name ?? declineTarget.email} sẽ bị từ chối.
            Họ sẽ tiếp tục là <strong>{toTitle(declineTarget.currentRole)}</strong>.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
              Lý do từ chối{' '}
              <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(tùy chọn)</span>
            </label>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Nhập lý do để người dùng biết cần cải thiện gì..."
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                fontSize: 13, color: 'var(--ink)', background: 'var(--bg)',
                fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--ink-3)')}
              onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        </FormModal>
      )}
    </div>
  )
}