// src/layouts/Sidebar.jsx
import { teacherMenu, adminMenu } from '@/shared/utils/menu'

/* ─── Logo ─── */
const LogoMark = () => (
  <div style={{
    width: 30, height: 30, background: 'var(--ink)',
    borderRadius: 8, display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  }}>
    <svg viewBox="0 0 16 16" width={15} height={15} fill="#fff">
      <path d="M8 1L1 4.5V9c0 3.8 2.9 6.7 7 7.9 4.1-1.2 7-4.1 7-7.9V4.5L8 1zm0 1.8l6 3.1V9c0 3-2.2 5.4-6 6.7C4.2 14.4 2 12 2 9V5.9l6-3.1z" />
    </svg>
  </div>
)

/* ─── Avatar ─── */
const Avatar = ({ initials, bg = 'var(--ink)', size = 32 }) => (
  <div style={{
    width: size, height: size, minWidth: size, minHeight: size,
    borderRadius: '50%', background: bg, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size <= 28 ? 10 : 11, fontWeight: 700,
    flexShrink: 0, alignSelf: 'center',
  }}>
    {initials}
  </div>
)

/* ─── NavItem ─── */
const NavItem = ({ item, isActive, onClick }) => {
  if (item.isDivider) {
    return <div style={{ height: '0.5px', background: 'var(--border)', margin: '6px 0' }} />
  }

  const isActiveItem = isActive && !item.isBack

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 10px',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        fontSize: 13.5, fontWeight: 500,
        transition: 'all 0.12s',
        userSelect: 'none',
        background: isActiveItem ? 'var(--purple)' : 'transparent',
        color: item.isBack ? 'var(--ink-3)' : isActiveItem ? '#fff' : 'var(--ink-2)',
        fontSize: item.isBack ? 12.5 : 13.5,
      }}
      onClick={() => onClick(item.id)}
      onMouseEnter={(e) => {
        if (isActiveItem) return
        e.currentTarget.style.background = item.isBack ? 'var(--purple-light)' : 'var(--border-faint)'
        e.currentTarget.style.color      = item.isBack ? 'var(--purple)' : 'var(--ink)'
      }}
      onMouseLeave={(e) => {
        if (isActiveItem) return
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color      = item.isBack ? 'var(--ink-3)' : 'var(--ink-2)'
      }}
    >
      <i className={`ti ti-${item.icon}`} style={{
        fontSize: 17, width: 20, textAlign: 'center', flexShrink: 0,
        color: isActiveItem ? '#fff' : 'var(--ink-3)',
      }} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge > 0 && (
        <span style={{
          marginLeft: 'auto',
          background: isActiveItem ? 'rgba(255,255,255,0.25)' : 'var(--red-bg)',
          color: isActiveItem ? '#fff' : 'var(--red)',
          fontSize: 10, fontWeight: 700,
          padding: '1px 6px', borderRadius: 99,
        }}>
          {item.badge}
        </span>
      )}
    </div>
  )
}

/* ─── UserCard ─── */
const UserCard = ({ user }) => {
  const isAdmin = user.role === 'admin'
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 10px', borderRadius: 'var(--radius-sm)',
        cursor: 'pointer', transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-faint)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <Avatar initials={user.initials} bg={isAdmin ? 'var(--purple)' : 'var(--ink)'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: 'var(--ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {user.name}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10.5, fontWeight: 600, padding: '1px 7px',
          borderRadius: 99, marginTop: 2,
          background: isAdmin ? 'var(--ink)' : 'var(--purple-light)',
          color: isAdmin ? '#fff' : 'var(--purple-dim)',
        }}>
          <i className={`ti ti-${isAdmin ? 'shield' : 'school'}`} style={{ fontSize: 10 }} />
          {isAdmin ? 'Admin' : 'Teacher'}
        </div>
      </div>
      <i className="ti ti-dots" style={{ fontSize: 16, color: 'var(--ink-3)' }} />
    </div>
  )
}

/* ── Inner content — dùng chung giữa desktop và mobile drawer ── */
function SidebarContent({ menu, activeId, onNavigate, user, isMobile, onClose }) {
  return (
    <>
      {/* Logo + close button (mobile) */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '18px 20px 14px',
        borderBottom: '0.5px solid var(--border)',
        flexShrink: 0,
      }}>
        <LogoMark />
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Codemia
        </span>
        {isMobile && (
          <button
            onClick={onClose}
            aria-label="Đóng menu"
            style={{
              marginLeft: 'auto',
              width: 32, height: 32,
              padding: 4,
              border: 'none', background: 'transparent',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-3)', fontSize: 18,
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-faint)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <i className="ti ti-x" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: '8px 10px',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        {menu.map((item, idx) => (
          <NavItem
            key={item.id ?? `divider-${idx}`}
            item={item}
            isActive={activeId === item.id}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* User card */}
      <div style={{ borderTop: '0.5px solid var(--border)', padding: 10, flexShrink: 0 }}>
        <UserCard user={user} />
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════
   SIDEBAR (main export)

   Props:
     role       — 'teacher' | 'admin'
     activeId   — id của menu item đang active
     onNavigate — (id) => void
     user       — { name, initials, role }
     isMobile   — boolean  (< 1024px)
     isOpen     — boolean  (drawer open/close trên mobile)
     onClose    — () => void
══════════════════════════════════════════════ */
export default function Sidebar({
  role = 'teacher',
  activeId,
  onNavigate,
  user,
  isMobile = false,
  isOpen   = true,
  onClose,
}) {
  const menu = role === 'admin' ? adminMenu : teacherMenu

  const sharedStyle = {
    background: 'var(--surface)',
    borderRight: '0.5px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    width: 'var(--sidebar-width)',
  }

  /* MOBILE / TABLET — fixed drawer, slide từ trái */
  if (isMobile) {
    return (
      <aside style={{
        ...sharedStyle,
        position: 'fixed',
        top: 0, left: 0,
        height: '100vh',
        maxWidth: '80vw',
        zIndex: 100,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform',
      }}>
        <SidebarContent
          menu={menu} activeId={activeId}
          onNavigate={onNavigate} user={user}
          isMobile={true} onClose={onClose}
        />
      </aside>
    )
  }

  /* DESKTOP — static, chiếm không gian layout */
  return (
    <aside style={{ ...sharedStyle, minWidth: 'var(--sidebar-width)' }}>
      <SidebarContent
        menu={menu} activeId={activeId}
        onNavigate={onNavigate} user={user}
        isMobile={false} onClose={onClose}
      />
    </aside>
  )
}