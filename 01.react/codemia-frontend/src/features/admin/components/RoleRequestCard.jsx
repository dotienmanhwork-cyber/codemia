// src/features/admin/components/RoleRequestCard.jsx
import { useState, useEffect, useRef } from 'react'
import apiClient from '../../../shared/config/axios'
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge'
import AvatarSm    from './AdminAvatarSm'

/* ── Helpers ── */
function relativeTime(iso) {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(mins  / 60)
  const days  = Math.floor(hours / 24)
  if (mins  < 1)   return 'vừa xong'
  if (mins  < 60)  return `${mins} phút trước`
  if (hours < 24)  return `${hours} giờ trước`
  if (days  === 1) return '1 ngày trước'
  return `${days} ngày trước`
}

function toTitle(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/* ── ActBtn ── */
const BTN_BASE = {
  dark:  { background: 'var(--ink)',     color: '#fff',         border: 'none' },
  ghost: { background: 'var(--surface)', color: 'var(--ink-2)', border: '0.5px solid var(--border)' },
}
const BTN_HOVER = {
  dark:  { background: '#2d2f31' },
  ghost: { background: 'var(--border-faint)' },
}

function ActBtn({ children, variant = 'dark', onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 12, fontWeight: 600,
        padding: '6px 14px', minHeight: 34,
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.12s',
        opacity: disabled ? 0.5 : 1,
        ...BTN_BASE[variant],
      }}
      onMouseEnter={(e) => { if (!disabled) Object.assign(e.currentTarget.style, BTN_HOVER[variant]) }}
      onMouseLeave={(e) => { if (!disabled) Object.assign(e.currentTarget.style, BTN_BASE[variant]) }}
    >
      {children}
    </button>
  )
}

/* ── CV Preview Modal ── */
//
// TẠI SAO DÙNG fetch + blob thay vì <iframe src={proxyUrl}> ?
//
//   App dùng JWT trong Authorization header (localStorage).
//   <iframe> là browser navigation request — không tự đính kèm header đó → 401.
//
//   Flow đúng:
//     1. axiosInstance.get(proxyUrl, { responseType: 'blob' })
//        → interceptor tự gắn Authorization: Bearer <token>
//        → nhận PDF bytes về FE
//     2. URL.createObjectURL(blob) → local blob URL (cùng origin)
//     3. <iframe src={blobUrl}> → render ngay, không CORS, không auth issue
//     4. onClose: URL.revokeObjectURL(blobUrl) để giải phóng memory
//
// VẤN ĐỀ ABORT:
//   Dùng AbortController + settled flag để tránh 2 race condition:
//   (a) StrictMode unmount/remount nhanh → abort trước khi response về → ClientAbortException ở BE
//   (b) Component cha re-render → CvModal remount nhiều lần → nhiều request song song
//   Giải pháp: chỉ abort nếu response chưa về (settled=false); sau khi .then() chạy thì
//   cleanup chỉ revoke blob URL, không abort nữa.
//

function CvModal({ cvUrl, name, onClose }) {

  // 'loading' | 'ok' | 'error'
  const [state, setState] = useState('loading')
  const [blobUrl, setBlobUrl] = useState(null)
  const blobRef = useRef(null)   // giữ blob URL để revoke khi modal đóng
  //
  // CHIẾN LƯỢC ABORT — tại sao dùng local `settled` thay vì useRef:
  //
  //   StrictMode (dev): effect lần 1 chạy → effect lần 2 chạy → cleanup lần 1 chạy.
  //   Thứ tự thực tế: run1 → run2 → cleanup1 → cleanup2.
  //
  //   Nếu dùng shared settledRef:
  //     - run2 reset settledRef.current = false
  //     - cleanup1 thấy false → abort controller CỦA RUN1, dù run1 đã xong!
  //     → ClientAbortException ở BE
  //
  //   Giải pháp đúng: mỗi effect run giữ `settled` local của riêng nó.
  //   Cleanup của run1 chỉ kiểm tra settled của run1 — không bị run2 ảnh hưởng.
  //   settled là closure variable — tồn tại trong cleanup function của từng run.
  //
  //   Vấn đề revoke blob URL:
  //   cleanup1 KHÔNG revoke blobRef — vì blobRef.current có thể là URL mà run2 vừa tạo.
  //   Chỉ cleanup2 (cleanup cuối cùng khi modal thực sự đóng) mới revoke.
  //

  /* Fetch PDF trực tiếp từ Cloudinary URL — không qua BE proxy */
  useEffect(() => {
    let settled = false
    const controller = new AbortController()

    fetch(cvUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        settled = true
        const url = URL.createObjectURL(blob)
        blobRef.current = url
        setBlobUrl(url)
        setState('ok')
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        console.error('[CvModal] fetch error:', err.message)
        setState('error')
      })

    return () => {
      if (!settled) controller.abort()
    }
  }, [cvUrl])

  /* Revoke blob URL khi modal đóng thật sự — tách riêng khỏi fetch effect */
  useEffect(() => {
    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current)
        blobRef.current = null
      }
    }
  }, [])

  /* Download: dùng lại blobUrl đã có — không cần fetch lại */
  function handleDownload() {
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `CV_${name}.pdf`
    a.click()
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        width: '100%', maxWidth: 860,
        height: '88vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '0.5px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-file-text" style={{ fontSize: 15, color: 'var(--ink-3)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              CV — {name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {state === 'ok' && (
              <button
                onClick={handleDownload}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: 'var(--ink-3)',
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: 'inherit', padding: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-3)')}
              >
                <i className="ti ti-download" style={{ fontSize: 13 }} />
                Tải xuống
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Đóng"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ink-3)', padding: 4, display: 'flex',
                borderRadius: 'var(--radius-sm)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-faint)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <i className="ti ti-x" style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, position: 'relative', background: '#525659' }}>

          {/* Spinner */}
          {state === 'loading' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
              background: '#525659',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2" strokeLinecap="round"
                style={{ animation: 'cvSpin 0.9s linear infinite' }}
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Đang tải CV...</span>
              <style>{`@keyframes cvSpin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error state */}
          {state === 'error' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#525659',
              padding: '0 32px', textAlign: 'center',
            }}>
              <i className="ti ti-file-off" style={{ fontSize: 32, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                Không thể tải file CV
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 360 }}>
                File có thể đã bị xóa hoặc server gặp lỗi.
              </span>
            </div>
          )}

          {/* iframe nhận blobUrl — cùng origin, không cần auth header, render ngay */}
          {blobUrl && (
            <iframe
              src={blobUrl}
              title={`CV – ${name}`}
              style={{
                width: '100%', height: '100%',
                border: 'none', display: 'block',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   RoleRequestCard
   Props: req, isActioning, onApprove, onDecline
══════════════════════════════════════════════ */
export default function RoleRequestCard({ req, isActioning, onApprove, onDecline }) {
  const fromLabel = toTitle(req.currentRole)
  const toLabel   = toTitle(req.requestedRole)
  const [showCv, setShowCv] = useState(false)

  return (
    <>
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
      }}>
        <AvatarSm name={req.name} email={req.email} avatarUrl={req.avatar} size={36} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + badge + time */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 8, flexWrap: 'wrap', marginBottom: 2,
          }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
              {req.name ?? req.email}
            </span>
            <StatusBadge label={`${fromLabel} → ${toLabel}`} variant="green" />
            <span style={{
              fontSize: 11.5, color: 'var(--ink-3)',
              marginLeft: 'auto', whiteSpace: 'nowrap',
            }}>
              {relativeTime(req.requestedAt)}
            </span>
          </div>

          {/* Email */}
          <div style={{
            fontSize: 12, color: 'var(--ink-3)', marginBottom: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {req.email}
          </div>

          {/* CV */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <i className="ti ti-file-text" style={{ fontSize: 13, color: 'var(--ink-3)' }} />
            {req.cvUrl ? (
              <button
                onClick={() => setShowCv(true)}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  fontSize: 12, color: 'var(--ink-2)', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  borderBottom: '1px solid var(--border)',
                  lineHeight: 1.3,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-2)')}
              >
                Xem CV đính kèm
                <i className="ti ti-maximize" style={{ fontSize: 11, marginLeft: 4, verticalAlign: 'middle' }} />
              </button>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--ink-3)', fontStyle: 'italic' }}>
                Không đính kèm CV
              </span>
            )}
          </div>

          {/* Portfolio link */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <i className="ti ti-brand-github" style={{ fontSize: 13, color: "var(--ink-3)" }} />
            {req.portfolioUrl ? (
              <a
                href={req.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12, color: "var(--ink-2)", fontWeight: 600,
                  textDecoration: "none",
                  borderBottom: "1px solid var(--border)",
                  lineHeight: 1.3,
                  maxWidth: 280,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  display: "inline-block",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-2)")}
              >
                {req.portfolioUrl}
                <i className="ti ti-external-link" style={{ fontSize: 11, marginLeft: 4, verticalAlign: "middle" }} />
              </a>
            ) : (
              <span style={{ fontSize: 12, color: "var(--ink-3)", fontStyle: "italic" }}>
                Không có portfolio
              </span>
            )}
          </div>

          {/* Reason */}
          {req.reason && (
            <div style={{
              fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6,
              background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
              padding: '8px 12px', marginBottom: 12,
            }}>
              "{req.reason}"
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ActBtn variant="dark" disabled={isActioning} onClick={() => onApprove(req)}>
              <i className="ti ti-check" style={{ fontSize: 13, marginRight: 4 }} />
              {isActioning ? 'Đang xử lý…' : 'Phê duyệt'}
            </ActBtn>
            <ActBtn variant="ghost" disabled={isActioning} onClick={() => onDecline(req)}>
              Từ chối
            </ActBtn>
          </div>
        </div>
      </div>

      {/* key=req.userId: đảm bảo React dùng lại cùng một instance CvModal
          khi cha re-render — tránh unmount/remount không cần thiết */}
      {showCv && (
        <CvModal
          key={req.cvUrl}
          cvUrl={req.cvUrl}
          name={req.name ?? req.email}
          onClose={() => setShowCv(false)}
        />
      )}
    </>
  )
}