// src/features/teacher/components/DashboardRevenueFeed.jsx
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge'
import SectionCard from './TeacherSectionCard'
import { formatVND } from '../../../shared/utils/format'

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d   = new Date(dateStr)
  const now = new Date()

  const sameDay =
    d.getDate()     === now.getDate()  &&
    d.getMonth()    === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  if (sameDay) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    d.getDate()     === yesterday.getDate()  &&
    d.getMonth()    === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()

  if (isYesterday) return 'Hôm qua'

  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export default function DashboardRevenueFeed({ revenue = [], loading = false, monthlyTotal }) {
  return (
    <SectionCard
      title="Doanh thu gần đây"
      headerRight={null}
    >
      {loading && (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
          Đang tải…
        </div>
      )}

      {!loading && revenue.length === 0 && (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
          Chưa có giao dịch nào
        </div>
      )}

      {!loading && revenue.map((r, i) => (
        <div key={r.orderId ?? i} style={{
          padding: '10px 16px',
          borderBottom: '0.5px solid var(--border-faint)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 3,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
              +{formatVND(r.amount)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap', marginLeft: 8 }}>
              {formatTime(r.createdAt)}
            </span>
          </div>
          <div style={{
            fontSize: 12, color: 'var(--ink-2)', marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {r.courseName}
          </div>
          <StatusBadge
            label={r.type === 'ENROLLMENT' ? 'Đăng ký' : r.type === 'REFUND' ? 'Hoàn tiền' : r.type}
            variant="blue"
          />
        </div>
      ))}

      {/* Monthly total footer */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--border-faint)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>Tháng này</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
          {monthlyTotal != null ? formatVND(monthlyTotal) : '—'}
        </span>
      </div>
    </SectionCard>
  )
}