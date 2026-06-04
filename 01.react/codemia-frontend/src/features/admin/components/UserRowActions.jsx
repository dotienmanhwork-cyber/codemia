// src/features/admin/components/UserRowActions.jsx
import { useNavigate } from 'react-router-dom'

/**
 * Nút action nhỏ mỗi row — View / Lock / Unlock / Delete
 * variant: 'ghost' | 'red' | 'green'
 */
function ActBtn({ children, variant = 'ghost', onClick, disabled = false }) {
  const s = {
    ghost: { background: 'var(--surface)',  color: 'var(--ink-2)', border: '0.5px solid var(--border)'   },
    red:   { background: 'var(--red-bg)',   color: 'var(--red)',   border: '0.5px solid var(--red-bg)'   },
    green: { background: 'var(--green-bg)', color: 'var(--green)', border: '0.5px solid var(--green-bg)' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 11, fontWeight: 600,
        padding: '5px 10px',
        borderRadius: 'var(--radius-xs)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        transition: 'opacity 0.12s',
        opacity: disabled ? 0.4 : 1,
        whiteSpace: 'nowrap',
        ...s[variant],
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = '0.8' }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.opacity = '1' }}
    >
      {children}
    </button>
  )
}

/**
 * @param {{
 *   user: object,
 *   onLock: () => void,
 *   onUnlock: () => void,
 *   onDelete: () => void,
 * }} props
 *
 * View    — navigate to /admin/users/:id
 * Delete  — disabled nếu role ADMIN (không xóa được admin)
 */
export default function UserRowActions({ user, onLock, onUnlock, onDelete }) {
  const navigate = useNavigate()
  // Spec mục 6: status values là "ACTIVE" | "LOCKED" | "PENDING_TEACHER"
  const isLocked = user.status === 'BLOCKED'
  // Spec mục 2 & 6: dùng role để ẩn/hiện nút Delete
  const isAdmin  = user.role   === 'ADMIN'

  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      <ActBtn
        variant="ghost"
        onClick={() => navigate(`/admin/users/${user.id}`)}
      >
        Xem
      </ActBtn>

      {isLocked
        ? <ActBtn variant="green" onClick={onUnlock}>Mở khóa</ActBtn>
        : <ActBtn variant="red"   onClick={onLock}>Khóa</ActBtn>
      }

      {/* Spec mục 2: ADMIN → ẩn hoàn toàn nút Delete, không chỉ disabled */}
      {!isAdmin && (
        <ActBtn variant="ghost" onClick={onDelete}>
          Xóa
        </ActBtn>
      )}
    </div>
  )
}