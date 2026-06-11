// src/features/admin/components/AdminRefundTable.jsx
import { useState } from 'react'
import StatusBadge  from '../../../shared/components/dashboard-ui/StatusBadge'
import ConfirmModal from '../../../shared/components/dashboard-ui/ConfirmModal'
import FormModal    from '../../../shared/components/dashboard-ui/FormModal'
import Pagination   from '../../../shared/components/dashboard-ui/Pagination'

const TABS = ['ALL', 'WAITING_BANK_INFO', 'PENDING', 'COMPLETED', 'CANCELLED']

const TAB_LABEL = {
  ALL               : 'Tất cả',
  WAITING_BANK_INFO : 'Thiếu thông tin ngân hàng',
  PENDING           : 'Cần xử lý',
  COMPLETED         : 'Đã hoàn tiền',
  CANCELLED         : 'Đã huỷ',
}

const STATUS_VARIANT = {
  WAITING_BANK_INFO : 'orange',
  PENDING           : 'amber',
  COMPLETED         : 'green',
  CANCELLED         : 'neutral',
}

const REASON_LABEL = {
  DELETE_COURSE    : 'Khoá học bị xóa',
  DOWNGRADE_TEACHER: 'Giảng viên bị hạ cấp',
}

const fmt     = (n) => Number(n ?? 0).toLocaleString('vi-VN') + ' ₫'
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('vi-VN') : '—'

// Số cột thay đổi theo tab — dùng để skeleton đúng cols
const COLS_BY_STATUS = {
  ALL               : 8,
  WAITING_BANK_INFO : 6,
  PENDING           : 7,
  COMPLETED         : 8,
  CANCELLED         : 8,
}

function SkeletonRows({ cols = 6, rows = 10 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} style={{ borderBottom: '0.5px solid var(--border)' }}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} style={{ padding: '10px 14px' }}>
          <div style={{
            height: 14,
            borderRadius: 4,
            background: 'var(--border-faint)',
            width: j === 0 ? '70%' : j === cols - 1 ? '40%' : '60%',
            animation: 'pulse 1.4s ease-in-out infinite',
          }} />
        </td>
      ))}
    </tr>
  ))
}

export default function AdminRefundTable({
  data          = [],
  loading       = false,
  activeStatus  = 'PENDING',
  onStatusChange,
  onComplete,
  onCancel,
  onRemind,
  completing    = false,
  cancelling    = false,
  reminding     = false,
  page          = 1,
  totalPages    = 1,
  onPageChange,
  totalByStatus = {},
}) {
  const [completeTarget, setCompleteTarget] = useState(null)
  const [completeNote,   setCompleteNote]   = useState('')
  const [cancelTarget,   setCancelTarget]   = useState(null)

  const filtered      = data
  const waitingCount  = totalByStatus['WAITING_BANK_INFO'] ?? 0
  const pendingCount  = totalByStatus['PENDING'] ?? 0

  const handleCompleteSubmit = async () => {
    await onComplete(completeTarget.id, completeNote)
    setCompleteTarget(null)
    setCompleteNote('')
  }

  const handleCancelConfirm = async () => {
    await onCancel(cancelTarget.id)
    setCancelTarget(null)
  }

  // Header columns theo tab hiện tại
  const headers = (() => {
    if (activeStatus === 'WAITING_BANK_INFO') return ['Học viên', 'Khoá học', 'Số tiền', 'Lý do', 'Ngày tạo', '']
    if (activeStatus === 'PENDING')           return ['Học viên', 'Khoá học', 'Số tiền', 'Thông tin ngân hàng', 'Lý do', 'Ngày tạo', '']
    if (activeStatus === 'ALL')               return ['Học viên', 'Khoá học', 'Số tiền', 'Thông tin ngân hàng', 'Lý do', 'Trạng thái', 'Ngày tạo', 'Thao tác']
    return ['Học viên', 'Khoá học', 'Số tiền', 'Thông tin ngân hàng', 'Lý do', 'Xử lý bởi', 'Ngày xử lý', 'Ghi chú']
  })()

  return (
    <div style={{
      background   : 'var(--surface)',
      border       : '0.5px solid var(--border)',
      borderRadius : 'var(--radius)',
      overflow     : 'hidden',
    }}>

      {/* ── Header + tabs ── */}
      <div style={{
        padding        : '14px 18px',
        borderBottom   : '0.5px solid var(--border)',
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'space-between',
        gap            : 12,
        flexWrap       : 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
            Yêu cầu hoàn tiền
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Quản lý hoàn tiền cho học viên
            {pendingCount > 0 && (
              <span style={{
                marginLeft   : 8,
                background   : 'var(--amber-bg)',
                color        : 'var(--amber)',
                borderRadius : 99,
                padding      : '1px 7px',
                fontSize     : 11,
                fontWeight   : 700,
              }}>
                {pendingCount} chờ chuyển khoản
              </span>
            )}
            {waitingCount > 0 && (
              <span style={{
                marginLeft   : 8,
                background   : 'var(--orange-bg)',
                color        : 'var(--orange)',
                borderRadius : 99,
                padding      : '1px 7px',
                fontSize     : 11,
                fontWeight   : 700,
              }}>
                {waitingCount} chưa có thông tin ngân hàng
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {TABS.map((tab) => {
            const active = activeStatus === tab
            const count  = totalByStatus[tab] ?? 0
            const urgent = (tab === 'PENDING' && pendingCount > 0) || (tab === 'WAITING_BANK_INFO' && waitingCount > 0)
            return (
              <button
                key={tab}
                onClick={() => onStatusChange(tab)}
                style={{
                  padding    : '5px 12px',
                  border     : `0.5px solid ${active ? 'var(--ink)' : 'var(--border)'}`,
                  background : active ? 'var(--ink)' : 'var(--surface)',
                  color      : active ? '#fff' : urgent ? 'var(--amber)' : 'var(--ink-3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize   : 12,
                  fontWeight : 600,
                  fontFamily : 'inherit',
                  cursor     : 'pointer',
                  display    : 'flex',
                  alignItems : 'center',
                  gap        : 5,
                  transition : 'all 0.15s',
                }}
              >
                {tab === 'WAITING_BANK_INFO' && <i className="ti ti-clock" style={{ fontSize: 11 }} />}
                {tab === 'PENDING'           && <i className="ti ti-credit-card" style={{ fontSize: 11 }} />}
                {TAB_LABEL[tab]}
                {count > 0 && (
                  <span style={{
                    background   : active ? 'rgba(255,255,255,0.2)' : 'var(--border-faint)',
                    color        : active ? '#fff' : urgent ? 'var(--amber)' : 'var(--ink-3)',
                    borderRadius : 99,
                    padding      : '0 5px',
                    fontSize     : 11,
                    fontWeight   : 700,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── WAITING_BANK_INFO banner khi đang xem tab khác ── */}
      {activeStatus !== 'WAITING_BANK_INFO' && waitingCount > 0 && (
        <div style={{
          padding      : '9px 18px',
          background   : 'var(--orange-bg)',
          borderBottom : '0.5px solid var(--orange)',
          display      : 'flex',
          alignItems   : 'center',
          gap          : 8,
          fontSize     : 12.5,
        }}>
          <i className="ti ti-info-circle" style={{ color: 'var(--orange)', fontSize: 14 }} />
          <span style={{ color: 'var(--ink-2)' }}>
            Có <strong style={{ color: 'var(--orange)' }}>{waitingCount}</strong> học viên chưa cập nhật thông tin ngân hàng.
          </span>
          <button
            onClick={() => onStatusChange('WAITING_BANK_INFO')}
            style={{
              marginLeft   : 'auto',
              padding      : '3px 10px',
              border       : '0.5px solid var(--orange)',
              background   : 'none',
              color        : 'var(--orange)',
              borderRadius : 'var(--radius-sm)',
              fontSize     : 12,
              fontWeight   : 600,
              fontFamily   : 'inherit',
              cursor       : 'pointer',
            }}
          >
            Xem ngay
          </button>
        </div>
      )}

      {/* ── Table — luôn render để tránh layout shift ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--border-faint)' }}>
              {headers.map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={COLS_BY_STATUS[activeStatus] ?? 6} rows={10} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={headers.length} style={{ padding: '36px 18px', fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>
                  Không có yêu cầu nào.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom : '0.5px solid var(--border)',
                    background   : i % 2 === 0 ? 'var(--surface)' : 'var(--surface-alt, var(--surface))',
                  }}
                >
                  {/* Học viên */}
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.studentName || '—'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{r.studentEmail || ''}</div>
                  </td>

                  {/* Khoá học */}
                  <td style={tdStyle}>
                    <span style={{
                      color       : 'var(--ink-2)',
                      maxWidth    : 180,
                      overflow    : 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace  : 'nowrap',
                      display     : 'block',
                    }}>
                      {r.courseTitle || <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>Đã xóa</span>}
                    </span>
                  </td>

                  {/* Số tiền */}
                  <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                    {fmt(r.amount)}
                  </td>

                  {/* Thông tin ngân hàng — chỉ hiện ở PENDING / COMPLETED / CANCELLED */}
                  {activeStatus !== 'WAITING_BANK_INFO' && (
                    <td style={tdStyle}>
                      {r.bankAccountNumber ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 12.5 }}>
                            {r.bankName}
                          </div>
                          <div style={{ color: 'var(--ink-2)', fontSize: 12 }}>
                            {r.bankAccountNumber}
                          </div>
                          <div style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>
                            {r.bankAccountName}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--ink-3)', fontStyle: 'italic', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  )}

                  {/* Lý do */}
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontSize     : 11.5,
                      fontWeight   : 600,
                      color        : r.reason === 'DELETE_COURSE' ? 'var(--red)' : 'var(--amber)',
                      background   : r.reason === 'DELETE_COURSE' ? 'var(--red-bg)' : 'var(--amber-bg)',
                      borderRadius : 99,
                      padding      : '2px 8px',
                    }}>
                      {REASON_LABEL[r.reason] ?? r.reason}
                    </span>
                  </td>

                   {/* Trạng thái — chỉ hiện ở ALL */}
                  {activeStatus === 'ALL' && (
                    <td style={tdStyle}>
                      <StatusBadge
                        label={TAB_LABEL[r.status] ?? r.status}
                        variant={STATUS_VARIANT[r.status] ?? 'neutral'}
                      />
                    </td>
                  )}

                  {/* Ngày tạo — WAITING_BANK_INFO + PENDING + ALL */}
                  {(activeStatus === 'WAITING_BANK_INFO' || activeStatus === 'PENDING' || activeStatus === 'ALL') && (
                    <td style={{ ...tdStyle, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                      {fmtDate(r.createdAt)}
                    </td>
                  )}

                  {/* Resolved info — COMPLETED + CANCELLED */}
                  {(activeStatus === 'COMPLETED' || activeStatus === 'CANCELLED') && (
                    <>
                      <td style={{ ...tdStyle, color: 'var(--ink-3)', fontSize: 12 }}>
                        {r.resolvedByAdminName || r.resolvedBy || '—'}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                        {fmtDate(r.resolvedAt)}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--ink-3)', fontSize: 12, maxWidth: 200 }}>
                        {r.adminNote || '—'}
                      </td>
                    </>
                  )}

                  {/* Actions — WAITING_BANK_INFO + PENDING + ALL */}
                  {(activeStatus === 'WAITING_BANK_INFO' || activeStatus === 'PENDING' || activeStatus === 'ALL') && (
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {r.status === 'PENDING' && (
                          <button
                            onClick={() => { setCompleteTarget(r); setCompleteNote('') }}
                            style={btnStyle('var(--green-bg)', 'var(--green)')}
                          >
                            <i className="ti ti-check" style={{ fontSize: 12 }} />
                            Đã hoàn tiền
                          </button>
                        )}
                        {r.status === 'WAITING_BANK_INFO' && (
                          <button
                            onClick={() => onRemind(r.id)}
                            disabled={reminding}
                            style={btnStyle('var(--border-faint)', 'var(--ink-2)')}
                          >
                            <i className="ti ti-bell" style={{ fontSize: 12 }} />
                            Nhắc lại
                          </button>
                        )}
                        {(r.status === 'PENDING' || r.status === 'WAITING_BANK_INFO') && (
                          <button
                            onClick={() => setCancelTarget(r)}
                            style={btnStyle('var(--red-bg)', 'var(--red)')}
                          >
                            <i className="ti ti-x" style={{ fontSize: 12 }} />
                            Hủy
                          </button>
                        )}
                        {r.status !== 'PENDING' && r.status !== 'WAITING_BANK_INFO' && (
                          <span style={{ color: 'var(--ink-3)', fontStyle: 'italic', fontSize: 12 }}>—</span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      )}

      {/* ── Mark Completed modal ── */}
      <FormModal
        open={!!completeTarget}
        onClose={() => { setCompleteTarget(null); setCompleteNote('') }}
        title="Xác nhận đã chuyển khoản"
        onSubmit={handleCompleteSubmit}
        submitLabel="Hoàn thành"
        loading={completing}
        width={440}
      >
        {completeTarget && (
          <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            Xác nhận đã chuyển khoản{' '}
            <strong style={{ color: 'var(--ink)' }}>{fmt(completeTarget.amount)}</strong>{' '}
            cho <strong style={{ color: 'var(--ink)' }}>{completeTarget.studentName}</strong>?
            {completeTarget.bankAccountNumber && (
              <div style={{
                marginTop    : 10,
                padding      : '10px 14px',
                background   : 'var(--border-faint)',
                borderRadius : 'var(--radius-sm)',
                fontSize     : 12.5,
                display      : 'flex',
                flexWrap     : 'wrap',
                gap          : '6px 24px',
              }}>
                <SnapshotField label="Ngân hàng"     value={completeTarget.bankName} />
                <SnapshotField label="Số tài khoản"  value={completeTarget.bankAccountNumber} />
                <SnapshotField label="Chủ tài khoản" value={completeTarget.bankAccountName} />
              </div>
            )}
          </div>
        )}
        <div>
          <label style={{
            fontSize     : 12,
            fontWeight   : 600,
            color: 'var(--ink-2)',
            display      : 'block',
            marginBottom : 6,
          }}>
            Ghi chú (không bắt buộc)
          </label>
          <textarea
            value={completeNote}
            onChange={(e) => setCompleteNote(e.target.value)}
            placeholder="VD: Đã chuyển khoản lúc 14:30 ngày 20/06..."
            rows={3}
            style={{
              width        : '100%',
              boxSizing    : 'border-box',
              padding      : '9px 12px',
              border       : '0.5px solid var(--border)',
              borderRadius : 'var(--radius-sm)',
              fontSize     : 13,
              color        : 'var(--ink)',
              background   : 'var(--surface)',
              fontFamily   : 'inherit',
              outline      : 'none',
              resize       : 'vertical',
            }}
          />
        </div>
      </FormModal>

      {/* ── Cancel confirm ── */}
      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title="Hủy yêu cầu hoàn tiền?"
        description={
          cancelTarget
            ? `Hủy yêu cầu hoàn ${fmt(cancelTarget.amount)} cho ${cancelTarget.studentName}? Hành động này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Hủy hoàn tiền"
        loading={cancelling}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────

const thStyle = {
  padding     : '9px 14px',
  textAlign   : 'left',
  fontSize    : 11.5,
  fontWeight  : 600,
  color       : 'var(--ink-3)',
  whiteSpace  : 'nowrap',
}

const tdStyle = {
  padding     : '10px 14px',
  verticalAlign: 'middle',
}

const btnStyle = (bg, color) => ({
  padding      : '5px 11px',
  border       : 'none',
  background   : bg,
  color        : color,
  borderRadius : 'var(--radius-sm)',
  fontSize     : 12,
  fontWeight   : 600,
  fontFamily   : 'inherit',
  cursor       : 'pointer',
  display      : 'flex',
  alignItems   : 'center',
  gap          : 4,
})

function SnapshotField({ label, value }) {
  if (!value) return null
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
        {value}
      </div>
    </div>
  )
}