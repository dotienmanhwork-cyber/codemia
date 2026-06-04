// src/features/admin/components/RoleRequestsWidget.jsx
import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import StatusBadge  from '../../../shared/components/dashboard-ui/StatusBadge';
import FormModal    from '../../../shared/components/dashboard-ui/FormModal';
import SectionCard  from './AdminSectionCard';
import AvatarSm     from './AdminAvatarSm';
import {
  getDashboardRoleRequests,
  approveRoleRequest,
  declineRoleRequest,
} from '../api/admin.api';

/* ── Helpers ── */

/** ISO datetime → relative string: "2h ago", "1d ago", … */
function relativeTime(iso) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(mins  / 60);
  const days  = Math.floor(hours / 24);
  if (mins  < 1)  return 'vừa xong';
  if (mins  < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days  === 1) return '1 ngày trước';
  return `${days} ngày trước`;
}

/** "STUDENT" → "Student" */
function toTitle(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/* ── ActBtn (admin-specific, không đủ generic cho shared) ── */
const BASE = {
  dark:  { background: 'var(--ink)',     color: '#fff',          border: 'none' },
  ghost: { background: 'var(--surface)', color: 'var(--ink-2)',  border: '0.5px solid var(--border)' },
};
const HOVER = {
  dark:  { background: '#2d2f31' },
  ghost: { background: 'var(--border-faint)' },
};

function ActBtn({ children, variant = 'dark', onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 11, fontWeight: 600,
        padding: '4px 10px',
        minHeight: 28, // touch-target ≥ 28px (table context)
        borderRadius: 'var(--radius-xs)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.12s',
        opacity: disabled ? 0.5 : 1,
        ...BASE[variant],
      }}
      onMouseEnter={(e) => { if (!disabled) Object.assign(e.currentTarget.style, HOVER[variant]); }}
      onMouseLeave={(e) => { if (!disabled) Object.assign(e.currentTarget.style, BASE[variant]); }}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════
   RoleRequestsWidget
══════════════════════════════════════════ */
export default function RoleRequestsWidget() {
  const navigate = useNavigate();

  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // userId đang xử lý
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    getDashboardRoleRequests(5)
      .then((res) => setRequests(res.result ?? []))  // FIX: lấy res.result thay vì toàn bộ response
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Approve ── */
  async function handleApprove(userId) {
    setActionLoading(userId);
    try {
      await approveRoleRequest(userId);
      setRequests((prev) => prev.filter((r) => r.userId !== userId));
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionLoading(null);
    }
  }

  /* ── Decline (confirm qua modal) ── */
  async function handleDeclineConfirm() {
    if (!declineTarget) return;
    setActionLoading(declineTarget.userId);
    try {
      await declineRoleRequest(declineTarget.userId, declineReason.trim() || null);
      setRequests((prev) => prev.filter((r) => r.userId !== declineTarget.userId));
      setDeclineTarget(null);
      setDeclineReason('');
    } catch (err) {
      console.error('Decline failed:', err);
    } finally {
      setActionLoading(null);
    }
  }

  const isDeclineLoading =
    declineTarget && actionLoading === declineTarget.userId;

  return (
    <>
      <SectionCard
        title="Phê duyệt giảng viên"
        headerRight={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge label={`${requests.length} chờ xử lý`} variant="amber" />
            <button
              onClick={() => navigate('/admin/roles')}
              style={{
                fontSize: 12, fontWeight: 600,
                color: 'var(--ink-2)', background: 'none',
                border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', padding: 0,
                textDecoration: 'underline', textUnderlineOffset: 2,
              }}
            >
              Xem tất cả →
            </button>
          </div>
        }
      >
        {/* RESPONSIVE: overflow-x + min-width per RESPONSIVE.md §5 */}
        <div style={{ overflowX: 'auto' }}>
          <table className="dt" style={{ minWidth: 420 }}>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Yêu cầu</th>
                <th>Thời gian</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading row */}
              {loading && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '24px 16px' }}>
                    Đang tải…
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {!loading && requests.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '24px 16px' }}>
                    Không có yêu cầu chờ xử lý
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {requests.map((r) => {
                const isActioning = actionLoading === r.userId;
                return (
                  <tr key={r.userId}>
                    {/* User cell */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AvatarSm name={r.name} email={r.email} avatarUrl={r.avatar} />
                        <span style={{
                          fontWeight: 600, fontSize: 13,
                          // RESPONSIVE: cắt text dài
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', maxWidth: 140,
                        }}>
                          {r.name ?? r.email}
                        </span>
                      </div>
                    </td>

                    {/* Request badge */}
                    <td>
                      <StatusBadge
                        label={`${toTitle(r.fromRole)} → ${toTitle(r.toRole)}`}
                        variant="green"
                      />
                    </td>

                    {/* Relative time */}
                    <td style={{ color: 'var(--ink-3)', fontSize: 12 }}>
                      {relativeTime(r.requestedAt)}
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <ActBtn
                          variant="dark"
                          disabled={isActioning}
                          onClick={() => handleApprove(r.userId)}
                        >
                          {isActioning ? '…' : 'Phê duyệt'}
                        </ActBtn>
                        <ActBtn
                          variant="ghost"
                          disabled={isActioning}
                          onClick={() => { setDeclineTarget(r); setDeclineReason(''); }}
                        >
                          Từ chối
                        </ActBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Decline confirmation modal */}
      {declineTarget && (
        <FormModal
          open
          onClose={() => { setDeclineTarget(null); setDeclineReason(''); }}
          onSubmit={handleDeclineConfirm}
          title={`Từ chối ${declineTarget.name ?? declineTarget.email}?`}
          submitLabel="Từ chối"
          loading={!!isDeclineLoading}
          width={420}
        >
          <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            Yêu cầu nâng cấp của {declineTarget.name ?? declineTarget.email} sẽ bị từ chối.
            Họ sẽ tiếp tục là vai trò{' '}
            <strong>{toTitle(declineTarget.fromRole)}</strong>.
          </div>

          {/* Reason textarea — FE only, API decline không nhận body */}
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
                width: '100%', boxSizing: 'border-box',
                padding: '8px 10px',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13, color: 'var(--ink)',
                background: 'var(--bg)',
                fontFamily: 'inherit', lineHeight: 1.6,
                resize: 'vertical', outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--ink-3)')}
              onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        </FormModal>
      )}
    </>
  );
}