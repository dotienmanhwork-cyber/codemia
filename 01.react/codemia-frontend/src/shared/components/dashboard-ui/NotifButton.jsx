// src/shared/components/dashboard-ui/NotifButton.jsx
import { useState, useEffect, useRef } from 'react'
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notification.api'
import { useAuth } from '../../context/AuthContext'

/**
 * Dùng được ở cả Navbar (PublicLayout) lẫn Topbar (DashboardLayout).
 *
 * Props:
 *   variant  — "topbar" (CSS vars, icon ti-bell)
 *            | "navbar" (inline colors, lucide Bell icon)   default: "topbar"
 */
export default function NotifButton({ variant = 'topbar' }) {
  const { isAuthenticated } = useAuth()
  const [open, setOpen]   = useState(false)
  const [items, setItems] = useState([])
  const ref               = useRef(null)

  const unread = items.filter(n => !n.read).length

  const fetchNotifs = async () => {
    try {
      const res = await getNotifications()
      setItems(res.result ?? [])
    } catch {}
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchNotifs()
    const timer = setInterval(fetchNotifs, 5000)
    return () => clearInterval(timer)
  }, [isAuthenticated])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleRead = async (id) => {
    await markAsRead(id)
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleReadAll = async () => {
    await markAllAsRead()
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  // ── style theo variant ──────────────────────────────────────
  const isNavbar  = variant === 'navbar'
  const purple    = '#8c06d8'
  const btnStyle  = isNavbar
    ? { color: '#44474a', backgroundColor: 'transparent' }
    : { color: 'var(--ink-2)', backgroundColor: open ? 'var(--border-faint)' : 'transparent' }

  const btnHoverIn  = isNavbar
    ? (e) => { e.currentTarget.style.backgroundColor = '#f6f3f2'; e.currentTarget.style.color = purple }
    : (e) => { e.currentTarget.style.background = 'var(--border-faint)'; e.currentTarget.style.color = 'var(--ink)' }
  const btnHoverOut = isNavbar
    ? (e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#44474a' }
    : (e) => { e.currentTarget.style.background = open ? 'var(--border-faint)' : 'transparent'; e.currentTarget.style.color = 'var(--ink-2)' }

  const dropdownBg     = isNavbar ? '#fcf8f8'           : 'var(--surface)'
  const dropdownBorder = isNavbar ? '#c5c6ca'           : 'var(--border)'
  const inkColor       = isNavbar ? '#181a1c'           : 'var(--ink)'
  const ink2Color      = isNavbar ? '#44474a'           : 'var(--ink-2)'
  const ink3Color      = isNavbar ? '#888'              : 'var(--ink-3)'
  const borderFaint    = isNavbar ? '#ebe7e7'           : 'var(--border-faint)'
  const purpleColor    = isNavbar ? purple              : 'var(--purple)'
  const radius         = isNavbar ? '12px'              : 'var(--radius)'

  if (!isAuthenticated) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        aria-label="Thông báo"
        onClick={() => setOpen(v => !v)}
        className={isNavbar ? 'transition-colors p-2 rounded-full' : ''}
        style={{
          width: 40, height: 40,
          borderRadius: isNavbar ? '50%' : 'var(--radius-sm)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, position: 'relative', flexShrink: 0,
          transition: 'background 0.12s',
          ...btnStyle,
        }}
        onMouseEnter={btnHoverIn}
        onMouseLeave={btnHoverOut}
      >
        {/* Icon — topbar dùng tabler icons, navbar dùng lucide */}
        {isNavbar
          ? <BellIcon size={20} />
          : <i className="ti ti-bell" />
        }

        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 6,
            minWidth: 16, height: 16,
            background: '#ba1a1a', borderRadius: 8,
            border: '1.5px solid white',
            fontSize: 10, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 46, right: 0,
          width: 320,
          background: dropdownBg,
          border: `0.5px solid ${dropdownBorder}`,
          borderRadius: radius,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 200,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: `0.5px solid ${dropdownBorder}`,
          }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: inkColor }}>
              Thông báo {unread > 0 && <span style={{ color: '#ba1a1a' }}>({unread})</span>}
            </span>
            {unread > 0 && (
              <button onClick={handleReadAll} style={{
                border: 'none', background: 'transparent',
                fontSize: 12, color: purpleColor, cursor: 'pointer',
              }}>
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {items.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: ink3Color, fontSize: 13 }}>
                Không có thông báo
              </div>
            ) : items.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && handleRead(n.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: `0.5px solid ${borderFaint}`,
                  background: n.read ? 'transparent' : `${purple}08`,
                  cursor: n.read ? 'default' : 'pointer',
                  transition: 'background 0.12s',
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  {!n.read && (
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: purpleColor, flexShrink: 0, marginTop: 5,
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: inkColor, marginBottom: 2 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 12, color: ink2Color, lineHeight: 1.4 }}>
                      {n.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* Lucide Bell inline — tránh import thêm khi dùng trong topbar variant */
function BellIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}