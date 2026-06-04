// src/features/teacher/components/WithdrawalSection.jsx
import { useState } from 'react'
import FormModal  from '../../../shared/components/dashboard-ui/FormModal'
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge'

const fmt     = (n) => Number(n ?? 0).toLocaleString('vi-VN') + ' ₫'
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('vi-VN') : '—'

const STATUS_VARIANT = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'red', HOLD: 'neutral', CANCELLED: 'neutral', cancelled: 'neutral' }
const STATUS_LABEL   = { PENDING: 'Chờ xử lý', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', HOLD: 'Tạm giữ', CANCELLED: 'Đã hủy', cancelled: 'Đã hủy' }

const BALANCE_METRICS = (b) => [
  { label: 'Tổng thu nhập',  value: fmt(b?.totalEarned),      icon: 'coin',          color: 'var(--green)',      bg: 'var(--green-bg)',    textColor: 'var(--ink)' },
  { label: 'Đã rút',         value: fmt(b?.totalWithdrawn),   icon: 'arrow-bar-up',  color: 'var(--amber)',      bg: 'var(--amber-bg)',    textColor: 'var(--ink)' },
  { label: 'Khả dụng',       value: fmt(b?.availableBalance), icon: 'wallet',        color: 'var(--purple-dim)', bg: 'var(--purple-light)', textColor: 'var(--purple-dim)' },
]

const parseBankInfo = (raw) => {
  if (!raw) return null
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw
    return `${obj.bankName} — ${obj.bankAccountNumber} — ${obj.bankAccountName}`
  } catch {
    return raw   // fallback: hiển thị thô nếu không parse được
  }
}

/**
 * WithdrawalSection — hiển thị balance + lịch sử rút tiền của teacher
 *
 * Props:
 *   balance             — { totalEarned, totalWithdrawn, availableBalance, bankAccountInfo }
 *   withdrawals         — WithdrawalResponse[]
 *   loadingBalance      — boolean
 *   loadingWithdrawals  — boolean
 *   onRequestWithdrawal — (amount: number) => Promise<void>
 *   requesting          — boolean
 *   onSaveBankInfo      — (data: { bankName, bankAccountNumber, bankAccountName }) => Promise<void>
 *   savingBankInfo      — boolean
 */
export default function WithdrawalSection({
  balance,
  withdrawals,
  loadingBalance,
  loadingWithdrawals,
  onRequestWithdrawal,
  requesting,
  onSaveBankInfo,
  savingBankInfo,
}) {
  const [open,   setOpen]   = useState(false)
  const [amount, setAmount] = useState('')
  const [err,    setErr]    = useState('')

  // Bank info modal — hiện khi chưa có STK
  const [bankOpen,          setBankOpen]          = useState(false)
  const [bankName,          setBankName]          = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName,   setBankAccountName]   = useState('')
  const [bankErr,           setBankErr]           = useState('')

  const hasPending   = withdrawals.some((w) => w.status === 'PENDING')
  const hasBankInfo  = Boolean(balance?.bankAccountInfo)

  const handleClose = () => { setOpen(false); setAmount(''); setErr('') }

  // Khi bấm "Rút tiền" — kiểm tra bank info trước
  const handleOpenWithdrawal = () => {
    if (!hasBankInfo) {
      setBankOpen(true)   // hard block → yêu cầu nhập STK
    } else {
      setOpen(true)
    }
  }

  const handleCloseBankModal = () => {
    setBankOpen(false)
    setBankName(''); setBankAccountNumber(''); setBankAccountName(''); setBankErr('')
  }

  const handleSubmitBankInfo = async () => {
    if (!bankName.trim())          { setBankErr('Vui lòng nhập tên ngân hàng.');     return }
    if (!bankAccountNumber.trim()) { setBankErr('Vui lòng nhập số tài khoản.');      return }
    if (!bankAccountName.trim())   { setBankErr('Vui lòng nhập tên chủ tài khoản.'); return }
    setBankErr('')
    try {
      await onSaveBankInfo({ bankName: bankName.trim(), bankAccountNumber: bankAccountNumber.trim(), bankAccountName: bankAccountName.trim() })
      handleCloseBankModal()
      setOpen(true)   // mở ngay withdrawal modal sau khi lưu xong
    } catch {
      setBankErr('Đã xảy ra lỗi. Vui lòng thử lại.')
    }
  }

  const handleSubmit = async () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) {
      setErr('Vui lòng nhập số tiền hợp lệ.')
      return
    }
    if (val < 50000) {
      setErr('Số tiền rút tối thiểu phải từ 50.000 ₫.')
      return
    }
    const avail = parseFloat(balance?.availableBalance ?? 0)
    if (val > avail) {
      setErr('Số tiền vượt quá số dư khả dụng.')
      return
    }
    setErr('')
    try {
      await onRequestWithdrawal(val)
      handleClose()
    } catch {
      setErr('Đã xảy ra lỗi. Vui lòng thử lại.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Balance card ── */}
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '18px 20px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
          marginBottom: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
              Số dư & Rút tiền
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              Thu nhập từ khóa học và số tiền khả dụng để rút
            </div>
          </div>

          <button
            onClick={handleOpenWithdrawal}
            disabled={hasPending || loadingBalance}
            title={hasPending ? 'Đang có yêu cầu chờ xử lý' : undefined}
            style={{
              padding: '8px 15px', border: 'none',
              background: hasPending || loadingBalance ? 'var(--border-faint)' : 'var(--ink)',
              color:      hasPending || loadingBalance ? 'var(--ink-3)'        : '#fff',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              cursor: hasPending || loadingBalance ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              minHeight: 38,
            }}
          >
            <i className="ti ti-arrow-bar-up" style={{ fontSize: 14 }} />
            Rút tiền
            {hasPending && (
              <StatusBadge label="Đang chờ" variant="amber" />
            )}
          </button>
        </div>

        {/* Metrics */}
        {loadingBalance ? (
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Đang tải...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {BALANCE_METRICS(balance).map(({ label, value, icon, color, bg, textColor }) => (
              <div key={label} style={{
                background: bg, borderRadius: 'var(--radius-sm)', padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <i className={`ti ti-${icon}`} style={{ fontSize: 13, color }} />
                  <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{label}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: textColor, letterSpacing: '-0.02em' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bank info */}
        {balance?.bankAccountInfo && (
          <div style={{
            marginTop: 12, fontSize: 12, color: 'var(--ink-3)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <i className="ti ti-building-bank" style={{ fontSize: 13 }} />
            {parseBankInfo(balance.bankAccountInfo)}
          </div>
        )}
      </div>

      {/* ── History table ── */}
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '13px 18px',
          borderBottom: '0.5px solid var(--border)',
          fontSize: 13, fontWeight: 700, color: 'var(--ink)',
        }}>
          Lịch sử rút tiền
        </div>

        {loadingWithdrawals ? (
          <div style={{ padding: '22px 18px', fontSize: 13, color: 'var(--ink-3)' }}>Đang tải...</div>
        ) : withdrawals.length === 0 ? (
          <div style={{ padding: '32px 18px', fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>
            Chưa có yêu cầu rút tiền nào.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--border-faint)' }}>
                  {['Ngày tạo', 'Số tiền', 'Trạng thái', 'Lý do từ chối', 'Xử lý lúc'].map((h) => (
                    <th key={h} style={{
                      padding: '9px 16px', textAlign: 'left',
                      fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w, i) => (
                  <tr key={w.id} style={{
                    borderBottom: i < withdrawals.length - 1 ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <td style={{ padding: '10px 16px', color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                      {fmtDate(w.createdAt)}
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                      {fmt(w.amount)}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <StatusBadge
                        label={STATUS_LABEL[w.status] ?? w.status}
                        variant={STATUS_VARIANT[w.status] ?? 'neutral'}
                      />
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <NoteCell note={w.note} />
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                      {fmtDate(w.processedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Request modal ── */}
      <FormModal
        open={open}
        onClose={handleClose}
        title="Yêu cầu rút tiền"
        onSubmit={handleSubmit}
        submitLabel="Gửi yêu cầu"
        loading={requesting}
        width={420}
      >
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          Số dư khả dụng:{' '}
          <strong style={{ color: 'var(--ink)' }}>{fmt(balance?.availableBalance)}</strong>
        </div>

        <div>
          <label style={{
            fontSize: 12, fontWeight: 600, color: 'var(--ink-2)',
            display: 'block', marginBottom: 6,
          }}>
            Số tiền muốn rút (VNĐ) <span style={{ fontWeight: 400, color: 'var(--ink-3)', fontSize: 11 }}>(Tối thiểu 50.000 ₫)</span>
          </label>
          <input
            type="number"
            min="50000"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErr('') }}
            placeholder="Nhập số tiền..."
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px',
              border: `0.5px solid ${err ? 'var(--red)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: 13, color: 'var(--ink)',
              background: 'var(--surface)',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
          {err && (
            <div style={{ fontSize: 11.5, color: 'var(--red)', marginTop: 5 }}>{err}</div>
          )}
        </div>

        {balance?.bankAccountInfo && (
          <div style={{
            background: 'var(--border-faint)', borderRadius: 'var(--radius-sm)',
            padding: '10px 12px', fontSize: 12, color: 'var(--ink-3)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <i className="ti ti-building-bank" style={{ fontSize: 13 }} />
            Tiền sẽ được chuyển đến: {parseBankInfo(balance.bankAccountInfo)}
          </div>
        )}
      </FormModal>

      {/* ── Bank info modal — hard block khi chưa có STK ── */}
      <FormModal
        open={bankOpen}
        onClose={handleCloseBankModal}
        title="Thêm tài khoản ngân hàng"
        onSubmit={handleSubmitBankInfo}
        submitLabel="Lưu & tiếp tục"
        loading={savingBankInfo}
        width={440}
      >
        {/* Notice */}
        <div style={{
          background: 'var(--amber-bg)', borderRadius: 'var(--radius-sm)',
          padding: '10px 12px', fontSize: 12, color: 'var(--ink-2)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <i className="ti ti-info-circle" style={{ fontSize: 14, color: 'var(--amber)', marginTop: 1, flexShrink: 0 }} />
          <span>
            Bạn cần thêm tài khoản ngân hàng trước khi rút tiền.
            Thông tin này sẽ được lưu vào hồ sơ của bạn.
          </span>
        </div>

        {/* Bank name */}
        <BankField
          label="Ngân hàng"
          placeholder="VD: Vietcombank, Techcombank..."
          value={bankName}
          onChange={(v) => { setBankName(v); setBankErr('') }}
          hasErr={!!bankErr}
        />

        {/* Account number */}
        <BankField
          label="Số tài khoản"
          placeholder="Nhập số tài khoản..."
          value={bankAccountNumber}
          onChange={(v) => { setBankAccountNumber(v); setBankErr('') }}
          hasErr={!!bankErr}
        />

        {/* Account holder */}
        <BankField
          label="Tên chủ tài khoản"
          placeholder="VD: NGUYEN VAN A"
          value={bankAccountName}
          onChange={(v) => { setBankAccountName(v.toUpperCase()); setBankErr('') }}
          hasErr={!!bankErr}
          hint="Nhập in hoa, đúng với tên trên thẻ ngân hàng"
        />

        {bankErr && (
          <div style={{ fontSize: 11.5, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 13 }} />
            {bankErr}
          </div>
        )}
      </FormModal>
    </div>
  )
}

/* ── Reusable field inside bank modal ── */
function BankField({ label, placeholder, value, onChange, hasErr, hint }) {
  return (
    <div>
      <label style={{
        fontSize: 12, fontWeight: 600, color: 'var(--ink-2)',
        display: 'block', marginBottom: 6,
      }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '9px 12px',
          border: `0.5px solid ${hasErr && !value.trim() ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          fontSize: 13, color: 'var(--ink)',
          background: 'var(--surface)',
          fontFamily: 'inherit', outline: 'none',
        }}
      />
      {hint && (
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{hint}</div>
      )}
    </div>
  )
}

/* ── Expandable NoteCell for long notes ── */
function NoteCell({ note }) {
  const [expanded, setExpanded] = useState(false)

  if (!note) return <span style={{ color: 'var(--ink-3)' }}>—</span>

  const isLong = note.length > 25

  return (
    <div
      onClick={() => isLong && setExpanded(!expanded)}
      style={{
        width: 220,
        maxWidth: 220,
        cursor: isLong ? 'pointer' : 'default',
        whiteSpace: expanded ? 'normal' : 'nowrap',
        wordBreak: expanded ? 'break-word' : 'normal',
        overflow: expanded ? 'visible' : 'hidden',
        textOverflow: expanded ? 'clip' : 'ellipsis',
        color: expanded ? 'var(--ink)' : 'var(--ink-3)',
        transition: 'all 0.15s ease',
        display: 'flex',
        alignItems: expanded ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 6,
        padding: expanded ? '6px 8px' : '0',
        background: expanded ? 'var(--border-faint)' : 'transparent',
        borderRadius: 'var(--radius-xs)',
      }}
      title={isLong ? (expanded ? 'Click để thu gọn' : 'Click để xem đầy đủ') : undefined}
    >
      <span style={{ flex: 1 }}>{note}</span>
      {isLong && (
        <i
          className={`ti ti-chevron-${expanded ? 'up' : 'down'}`}
          style={{
            fontSize: 11,
            color: 'var(--ink-3)',
            flexShrink: 0,
            opacity: 0.7,
            marginTop: expanded ? 3 : 0,
            transition: 'transform 0.15s ease',
          }}
        />
      )}
    </div>
  )
}