// src/features/admin/components/RoleDecisionHistory.jsx
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge'
import AvatarSm    from './AdminAvatarSm'

function toTitle(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/* ══════════════════════════════════════════════
   RoleDecisionHistory
   Props: done — array of { name, email, avatar,
          currentRole, requestedRole, decision }
══════════════════════════════════════════════ */
export default function RoleDecisionHistory({ done }) {
  if (!done.length) return null

  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '13px 16px',
        borderBottom: '0.5px solid var(--border)',
        fontSize: 13.5, fontWeight: 600, color: 'var(--ink)',
      }}>
        Quyết định gần đây
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="dt" style={{ minWidth: 360 }}>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Yêu cầu</th>
              <th>Quyết định</th>
            </tr>
          </thead>
          <tbody>
            {done.map((d, idx) => (
              <tr key={idx}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AvatarSm name={d.name} email={d.email} avatarUrl={d.avatar} size={27} />
                    <span style={{
                      fontWeight: 600, fontSize: 13,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap', maxWidth: 160,
                    }}>
                      {d.name ?? d.email}
                    </span>
                  </div>
                </td>
                <td>
                  <StatusBadge
                    label={`${toTitle(d.currentRole)} → ${toTitle(d.requestedRole)}`}
                    variant="green"
                  />
                </td>
                <td>
                  <StatusBadge
                    label={d.decision === 'approve' ? 'Đã phê duyệt' : 'Đã từ chối'}
                    variant={d.decision === 'approve' ? 'green' : 'red'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
