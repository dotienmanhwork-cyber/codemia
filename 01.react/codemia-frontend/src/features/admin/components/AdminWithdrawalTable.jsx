// src/features/admin/components/AdminWithdrawalTable.jsx
import { useState } from 'react'
import StatusBadge  from '../../../shared/components/dashboard-ui/StatusBadge'
import ConfirmModal from '../../../shared/components/dashboard-ui/ConfirmModal'
import FormModal    from '../../../shared/components/dashboard-ui/FormModal'
import Pagination   from '../../../shared/components/dashboard-ui/Pagination'

const TABS      = ['ALL', 'HOLD', 'PENDING', 'APPROVED', 'REJECTED']
const TAB_LABEL = {
  ALL      : 'Tất cả',
  HOLD     : 'Cần xử lý',
  PENDING  : 'Chờ duyệt',
  APPROVED : 'Đã duyệt',
  REJECTED  : 'Đã từ chối',
  CANCELLED : 'Đã hủy',
}
const STATUS_VARIANT = {
  PENDING  : 'amber',
  APPROVED : 'green',
  REJECTED : 'red',
  HOLD      : 'orange',
  CANCELLED : 'neutral',
}

// ── Withdrawal Type config ──────────────────────────────────────────────────
const WITHDRAWAL_TYPE_CONFIG = {
  TEACHER_MANUAL: {
    label  : 'GV tự tạo',
    icon   : 'ti-user',
    color  : 'var(--ink-2)',
    bg     : 'var(--border-faint)',
    border : 'var(--border)',
    title  : 'Giảng viên tự tạo lệnh rút tiền thủ công',
  },
  DOWNGRADE_AUTO: {
    label  : 'Hạ role',
    icon   : 'ti-arrow-down-circle',
    color  : 'var(--blue, #3b82f6)',
    bg     : 'var(--blue-bg, #eff6ff)',
    border : 'var(--blue-border, #bfdbfe)',
    title  : 'Lệnh gộp tự động khi giảng viên bị hạ role → Student',
  },
  COURSE_DELETED_HOLD: {
    label  : 'Xóa khóa học — giữ lệnh',
    icon   : 'ti-book-off',
    color  : 'var(--orange)',
    bg     : 'var(--orange-bg)',
    border : 'var(--orange)',
    title  : 'Lệnh chờ duyệt (PENDING) bị tạm giữ (HOLD) do Admin xóa khóa học',
  },
  COURSE_DELETED_CLAWBACK: {
    label  : 'Thu hồi thu nhập',
    icon   : 'ti-rotate-clockwise',
    color  : 'var(--red)',
    bg     : 'var(--red-bg)',
    border : 'var(--red)',
    title  : 'Thu hồi thu nhập từ giảng viên để bù hoàn tiền (refund) cho học viên khi khóa học bị xóa',
  },
  ACCOUNT_BLOCKED: {
    label  : 'Khóa tài khoản',
    icon   : 'ti-lock',
    color  : '#7c3aed',
    bg     : '#f5f3ff',
    border : '#c4b5fd',
    title  : 'Lệnh HOLD tự động khi tài khoản giảng viên bị khóa',
  },
}

const fmt     = (n) => Number(n ?? 0).toLocaleString('vi-VN') + ' ₫'
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('vi-VN') : '—'

const isSystemHold = (r) =>
  r.status === 'HOLD' && r.note != null &&
  (r.note.toLowerCase().includes('course') ||
   r.note.toLowerCase().includes('thu hồi') ||
   r.note.toLowerCase().includes('tạm giữ'))

const isNoBankHold = (r) =>
  r.status === 'HOLD' && !r.bankSnapshot && !isSystemHold(r)

function parseBankSnapshot(raw) {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

// Skeleton rows để tránh layout shift khi loading
function SkeletonRows({ rows = 10 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} style={{ borderBottom: '0.5px solid var(--border)' }}>
      {Array.from({ length: 9 }).map((_, j) => (
        <td key={j} style={{ padding: '10px 14px' }}>
          <div style={{
            height: 14, borderRadius: 4,
            background: 'var(--border-faint)',
            width: j === 0 ? '70%' : j === 8 ? '40%' : '60%',
            animation: 'wdPulse 1.4s ease-in-out infinite',
          }} />
        </td>
      ))}
    </tr>
  ))
}

/**
 * Props:
 *   data          — WithdrawalResponse[] (trang hiện tại)
 *   statusCounts  — { ALL, HOLD, PENDING, APPROVED, REJECTED } — từ hook, luôn chính xác
 *   loading       — boolean
 *   activeStatus  — string
 *   onStatusChange, onApprove, onReject, onRemind
 *   approving, rejecting, reminding — boolean
 *   page, totalPages, onPageChange
 */
export default function AdminWithdrawalTable({
  data          = [],
  statusCounts  = {},
  loading       = false,
  activeStatus  = 'ALL',
  onStatusChange,
  onApprove,
  onReject,
  onRemind,
  onCompleteHold,
  approving     = false,
  rejecting     = false,
  reminding     = false,
  completing    = false,
  page          = 1,
  totalPages    = 1,
  onPageChange,
}) {
  const [approveTarget,  setApproveTarget]  = useState(null)
  const [rejectTarget,   setRejectTarget]   = useState(null)
  const [rejectNote,     setRejectNote]     = useState('')
  const [completeTarget, setCompleteTarget] = useState(null)
  const [completeNote,   setCompleteNote]   = useState('')
  const [expandedHold,   setExpandedHold]   = useState(null)
  const [remindingId,    setRemindingId]    = useState(null)

  // Count từ statusCounts — không phụ thuộc vào data trang hiện tại
  const getCount = (tab) => statusCounts[tab] ?? 0
  const holdCount       = getCount('HOLD')
  const manualHoldCount = data.filter((r) => r.status === 'HOLD' && !isSystemHold(r)).length

  const handleApproveConfirm = async () => {
    await onApprove(approveTarget.id)
    setApproveTarget(null)
  }

  const handleRejectSubmit = async () => {
    await onReject(rejectTarget.id, rejectNote)
    setRejectTarget(null)
    setRejectNote('')
  }

  const handleCompleteSubmit = async () => {
    await onCompleteHold(completeTarget.id, completeNote)
    setCompleteTarget(null)
    setCompleteNote('')
  }

  const handleRemind = async (r) => {
    if (!onRemind) return
    setRemindingId(r.id)
    try { await onRemind(r.id) }
    finally { setRemindingId(null) }
  }

  return (
    <div style={{
      background   : 'var(--surface)',
      border       : '0.5px solid var(--border)',
      borderRadius : 'var(--radius)',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding        : '14px 18px',
        borderBottom   : '0.5px solid var(--border)',
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'space-between',
        gap            : 12,
        flexWrap       : 'wrap',
      }}>
        {/* Title — flex-shrink:1 để nhường chỗ cho tabs */}
        <div style={{ flexShrink: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
            Yêu cầu rút tiền
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Phê duyệt hoặc từ chối yêu cầu rút tiền của giáo viên
            {holdCount > 0 && (
              <span style={{
                marginLeft: 8, background: 'var(--orange-bg)', color: 'var(--orange)',
                borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700,
              }}>
                {holdCount} cần xử lý thủ công
              </span>
            )}
          </div>
        </div>

        {/* Tabs — flex-shrink:0 để không bao giờ bị squeeze, luôn render đủ 5 tab */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flexShrink: 0 }}>
          {TABS.map((tab) => {
            const active  = activeStatus === tab
            const count   = getCount(tab)
            const isHold  = tab === 'HOLD'
            // Màu orange cho HOLD khi không active và có count > 0
            const holdActive = isHold && !active
            return (
              <button
                key={tab}
                onClick={() => onStatusChange(tab)}
                style={{
                  padding      : '5px 12px',
                  border       : `1px solid ${
                    active
                      ? (isHold ? 'var(--orange)' : 'var(--ink)')
                      : holdActive ? 'var(--orange)'
                      : 'var(--border)'
                  }`,
                  background   : active
                    ? (isHold ? 'var(--orange)' : 'var(--ink)')
                    : holdActive ? 'var(--orange-bg)'
                    : 'var(--surface)',
                  color        : active ? '#fff' : holdActive ? 'var(--orange)' : 'var(--ink-3)',
                  borderRadius : 'var(--radius-sm)',
                  fontSize     : 12,
                  fontWeight   : 600,
                  fontFamily   : 'inherit',
                  cursor       : 'pointer',
                  display      : 'flex',
                  alignItems   : 'center',
                  gap          : 5,
                  transition   : 'background 0.15s, border-color 0.15s',
                }}
              >
                {isHold && <i className="ti ti-alert-circle" style={{ fontSize: 11 }} />}
                {TAB_LABEL[tab]}
                {/* Badge count — luôn render cho mọi tab để giữ layout nhất quán */}
                <span style={{
                  background   : active
                    ? 'rgba(255,255,255,0.25)'
                    : holdActive ? 'var(--orange-bg)'
                    : 'var(--border-faint)',
                  color        : active ? '#fff' : holdActive ? 'var(--orange)' : 'var(--ink-3)',
                  borderRadius : 99,
                  padding      : '0 6px',
                  fontSize     : 11,
                  fontWeight   : 700,
                  minWidth     : 18,
                  textAlign    : 'center',
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── HOLD banner ── */}
      {activeStatus !== 'HOLD' && holdCount > 0 && (
        <div style={{
          padding      : '9px 18px',
          background   : 'var(--orange-bg)',
          borderBottom : '0.5px solid var(--orange)',
          display      : 'flex',
          alignItems   : 'center',
          gap          : 8,
          fontSize     : 12.5,
        }}>
          <i className="ti ti-alert-circle" style={{ color: 'var(--orange)', fontSize: 14 }} />
          <span style={{ color: 'var(--ink-2)' }}>
            Có <strong style={{ color: 'var(--orange)' }}>{holdCount}</strong> yêu cầu trạng thái{' '}
            <strong>HOLD</strong> — cần xem và xử lý thủ công.
          </span>
          <button
            onClick={() => onStatusChange('HOLD')}
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

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto', borderRadius: '0 0 var(--radius) var(--radius)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--border-faint)' }}>
              {['Giáo viên', 'Email', 'Loại lệnh', 'Số tiền', 'Thông tin ngân hàng', 'Trạng thái', 'Ngày tạo', 'Xử lý bởi', ''].map((h) => (
                <th key={h} style={{
                  padding    : '9px 14px',
                  textAlign  : 'left',
                  fontSize   : 11.5,
                  fontWeight : 600,
                  color      : 'var(--ink-3)',
                  whiteSpace : 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={10} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={9} style={{
                  padding   : '36px 18px',
                  fontSize  : 13,
                  color     : 'var(--ink-3)',
                  textAlign : 'center',
                }}>
                  Không có yêu cầu nào.
                </td>
              </tr>
            ) : (
              data.map((r) => {
                const isHold      = r.status === 'HOLD'
                const snapshot = parseBankSnapshot(r.bankSnapshot ?? r.bankAccountInfo)

                const isExpanded  = expandedHold === r.id
                const isReminding = remindingId === r.id

                return (
                  <>
                    <tr
                      key={r.id}
                      style={{
                        borderBottom : '0.5px solid var(--border)',
                        background   : isHold ? 'var(--orange-bg)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                        {r.teacherName}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--ink-2)' }}>
                        {r.teacherEmail}
                      </td>
                      {/* Loại lệnh */}
                      <td style={{ padding: '10px 14px' }}>
                        <TypeBadge type={r.withdrawalType} />
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                        {fmt(r.amount)}
                      </td>

                      {/* Ngân hàng */}
                      <td style={{ padding: '10px 14px', maxWidth: 240 }}>
                        {isHold ? (
                          snapshot ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <i className="ti ti-building-bank" style={{ color: 'var(--orange)', fontSize: 13 }} />
                                <span style={{ fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase' }}>
                                  {snapshot.bankName ?? snapshot.bank ?? '—'}
                                </span>
                                <button
                                  onClick={() => setExpandedHold(isExpanded ? null : r.id)}
                                  style={{
                                    background: 'none', border: 'none',
                                    color: 'var(--orange)', cursor: 'pointer',
                                    fontSize: 11, fontWeight: 600, fontFamily: 'inherit', padding: '1px 5px',
                                  }}
                                >
                                  {isExpanded ? 'Ẩn' : 'Chi tiết'}
                                </button>
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--ink-2)', paddingLeft: 19 }}>
                                {snapshot.bankAccountNumber ?? snapshot.accountNumber ?? '—'}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--ink-3)', paddingLeft: 19 }}>
                                {snapshot.bankAccountName ?? snapshot.accountName ?? ''}
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                              <i className="ti ti-ban" style={{ color: 'var(--orange)', fontSize: 13 }} />
                              {isSystemHold(r) ? (
                                <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>
                                  {r.note ?? 'Hệ thống thu hồi tự động'}
                                </span>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                  <span style={{ color: 'var(--orange)', fontWeight: 600 }}>Chưa có thông tin ngân hàng</span>
                                  <button
                                    onClick={() => handleRemind(r)}
                                    disabled={isReminding || reminding}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 4,
                                      padding: '3px 8px',
                                      border: '0.5px solid var(--orange)',
                                      background: isReminding ? 'var(--orange)' : 'none',
                                      color: isReminding ? '#fff' : 'var(--orange)',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                                      cursor: isReminding ? 'default' : 'pointer',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <i
                                      className={isReminding ? 'ti ti-loader-2' : 'ti ti-bell-ringing'}
                                      style={{ fontSize: 11, animation: isReminding ? 'wdSpin 0.8s linear infinite' : 'none' }}
                                    />
                                    {isReminding ? 'Đang gửi...' : 'Nhắc giảng viên'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        ) : (
                          <BankInfoCell value={r.bankAccountInfo} />
                        )}
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge label={TAB_LABEL[r.status] ?? r.status} variant={STATUS_VARIANT[r.status] ?? 'neutral'} />
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                        {fmtDate(r.createdAt)}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--ink-3)', fontSize: 12 }}>
                        {r.processedBy || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {r.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => setApproveTarget(r)}
                              style={{
                                padding: '5px 11px', border: 'none',
                                background: 'var(--green-bg)', color: 'var(--green)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <i className="ti ti-check" style={{ fontSize: 12 }} />
                              Phê duyệt
                            </button>
                            <button
                              onClick={() => { setRejectTarget(r); setRejectNote('') }}
                              style={{
                                padding: '5px 11px', border: 'none',
                                background: 'var(--red-bg)', color: 'var(--red)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <i className="ti ti-x" style={{ fontSize: 12 }} />
                              Từ chối
                            </button>
                          </div>
                        )}
                        {isHold && !isSystemHold(r) && (
                          <span style={{
                            fontSize: 11.5, color: 'var(--orange)', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            <i className="ti ti-hand-stop" style={{ fontSize: 12 }} />
                            Cần xử lý thủ công
                          </span>
                        )}
                        {isHold && isSystemHold(r) && (
                          <span style={{
                            fontSize: 11.5, color: 'var(--ink-3)', fontStyle: 'italic',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            <i className="ti ti-robot" style={{ fontSize: 12 }} />
                            Tự động
                          </span>
                        )}
                        {/* Nút Hoàn tất cho mọi HOLD */}
                        {isHold && (
                          <button
                            onClick={() => { setCompleteTarget(r); setCompleteNote('') }}
                            style={{
                              marginTop: 5,
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px',
                              border: 'none',
                              background: 'var(--green-bg)',
                              color: 'var(--green)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <i className="ti ti-check-circle" style={{ fontSize: 12 }} />
                            Hoàn tất
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded snapshot */}
                    {isHold && isExpanded && snapshot && (
                      <tr key={`${r.id}-snap`} style={{ background: 'var(--orange-bg)', borderBottom: '0.5px solid var(--border)' }}>
                        <td colSpan={9} style={{ padding: '0 14px 12px 14px' }}>
                          <div style={{
                            background: 'var(--surface)', border: '0.5px solid var(--orange)',
                            borderRadius: 'var(--radius-sm)', padding: '12px 16px',
                            display: 'flex', flexWrap: 'wrap', gap: '10px 32px',
                          }}>
                            <SnapField label="Ngân hàng"     value={snapshot.bankName ?? snapshot.bank} />
                            <SnapField label="Số tài khoản"  value={snapshot.bankAccountNumber ?? snapshot.accountNumber} />
                            <SnapField label="Chủ tài khoản" value={snapshot.bankAccountName ?? snapshot.accountName} />
                            <SnapField label="Chi nhánh"     value={snapshot.branch} />
                            <div style={{ width: '100%', fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <i className="ti ti-alert-triangle" />
                              <span>Lưu ý: Đây là thông tin tài khoản ngân hàng snapshot. Nếu thông tin không chính xác hoặc cần thay đổi, vui lòng liên hệ teacher.</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      )}

      {/* ── Approve modal ── */}
      <ConfirmModal
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApproveConfirm}
        title="Xác nhận phê duyệt?"
        description={approveTarget
          ? `Phê duyệt yêu cầu rút ${fmt(approveTarget.amount)} của ${approveTarget.teacherName}?`
          : ''}
        confirmLabel="Phê duyệt"
        loading={approving}
      />

      {/* ── Reject modal ── */}
      <FormModal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectNote('') }}
        title="Từ chối yêu cầu"
        onSubmit={handleRejectSubmit}
        submitLabel="Từ chối"
        loading={rejecting}
        width={420}
      >
        {rejectTarget && (
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            Từ chối yêu cầu rút{' '}
            <strong style={{ color: 'var(--ink)' }}>{fmt(rejectTarget.amount)}</strong>{' '}
            của <strong style={{ color: 'var(--ink)' }}>{rejectTarget.teacherName}</strong>.
          </div>
        )}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
            Lý do từ chối (không bắt buộc)
          </label>
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Nhập lý do để giáo viên biết..."
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '9px 12px',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
              fontSize: 13, color: 'var(--ink)', background: 'var(--surface)',
              fontFamily: 'inherit', outline: 'none', resize: 'vertical',
            }}
          />
        </div>
      </FormModal>

      {/* ── Complete HOLD modal ── */}
      <FormModal
        open={!!completeTarget}
        onClose={() => { setCompleteTarget(null); setCompleteNote('') }}
        title="Đánh dấu hoàn tất"
        onSubmit={handleCompleteSubmit}
        submitLabel="Hoàn tất"
        loading={completing}
        width={440}
      >
        {completeTarget && (
          <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            Xác nhận đã xử lý thủ công và chuyển khoản{' '}
            <strong style={{ color: 'var(--ink)' }}>{fmt(completeTarget.amount)}</strong>{' '}
            cho <strong style={{ color: 'var(--ink)' }}>{completeTarget.teacherName}</strong>.
            <br />
            <span style={{ fontSize: 12 }}>
              Lệnh sẽ được chuyển sang trạng thái <strong>Đã duyệt</strong> và giảng viên sẽ nhận được thông báo.
            </span>
          </div>
        )}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
            Ghi chú của admin (không bắt buộc)
          </label>
          <textarea
            value={completeNote}
            onChange={(e) => setCompleteNote(e.target.value)}
            placeholder="VD: Đã chuyển khoản ngày 02/06/2026 qua MB Bank..."
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '9px 12px',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
              fontSize: 13, color: 'var(--ink)', background: 'var(--surface)',
              fontFamily: 'inherit', outline: 'none', resize: 'vertical',
            }}
          />
        </div>
      </FormModal>

      <style>{`
        @keyframes wdSpin    { to { transform: rotate(360deg); } }
        @keyframes wdPulse   { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  )
}

function BankInfoCell({ value }) {
  if (!value) return <span style={{ color: 'var(--ink-3)' }}>—</span>
  const info = parseBankSnapshot(value)
  if (!info) return <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>—</span>
  const { bankName, bankAccountNumber, accountNumber, bankAccountName, accountName } = info
  return (
    <div style={{ fontSize: 12, lineHeight: 1.5 }}>
      <div style={{ fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase' }}>{bankName ?? '—'}</div>
      <div style={{ color: 'var(--ink-2)' }}>{bankAccountNumber ?? accountNumber ?? '—'}</div>
      <div style={{ color: 'var(--ink-3)' }}>{bankAccountName ?? accountName ?? ''}</div>
    </div>
  )
}

function SnapField({ label, value }) {
  if (!value) return null
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{value}</div>
    </div>
  )
}

/**
 * Badge hiển thị loại lệnh rút tiền.
 * type: WithdrawalType string từ backend (TEACHER_MANUAL | DOWNGRADE_AUTO | ...)
 */
function TypeBadge({ type }) {
  const cfg = WITHDRAWAL_TYPE_CONFIG[type] ?? WITHDRAWAL_TYPE_CONFIG.TEACHER_MANUAL
  return (
    <span
      title={cfg.title}
      style={{
        display      : 'inline-flex',
        alignItems   : 'center',
        gap          : 4,
        padding      : '2px 8px',
        background   : cfg.bg,
        color        : cfg.color,
        border       : `0.5px solid ${cfg.border}`,
        borderRadius : 99,
        fontSize     : 11,
        fontWeight   : 600,
        whiteSpace   : 'nowrap',
        cursor       : 'default',
      }}
    >
      <i className={`ti ${cfg.icon}`} style={{ fontSize: 11 }} />
      {cfg.label}
    </span>
  )
}