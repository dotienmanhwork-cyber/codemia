import { useState, useEffect, useRef, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import NotifButton from '@/shared/components/dashboard-ui/NotifButton'
import { DashboardSearchContext } from '@/layouts/DashboardLayout'

/* ─── Hamburger ─── */
const HamburgerButton = ({ onClick }) => (
  <button
    aria-label="Mở menu"
    onClick={onClick}
    style={{
      width: 40, height: 40,
      borderRadius: 'var(--radius-sm)',
      border: 'none', background: 'transparent',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--ink-2)', fontSize: 20,
      flexShrink: 0, transition: 'background 0.12s',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-faint)'; e.currentTarget.style.color = 'var(--ink)' }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-2)' }}
  >
    <i className="ti ti-menu-2" />
  </button>
)

/* ─── Search ─── */
const SearchInput = ({ placeholder, isMobile }) => {
  const { keyword, setKeyword } = useContext(DashboardSearchContext)
  const [focused, setFocused] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const path = location.pathname
      const isAdmin = path.startsWith('/admin')
      const isTeacher = path.startsWith('/teacher')

      if (isAdmin) {
        if (!path.startsWith('/admin/courses') && !path.startsWith('/admin/users') && !path.startsWith('/admin/lessons') && !path.startsWith('/admin/categories')) {
          navigate(`/admin/courses?search=${encodeURIComponent(keyword)}`)
        } else {
          const searchParams = new URLSearchParams(location.search)
          if (keyword) {
            searchParams.set('search', keyword)
          } else {
            searchParams.delete('search')
          }
          navigate(`${path}?${searchParams.toString()}`)
        }
      } else if (isTeacher) {
        if (!path.startsWith('/teacher/courses') && !path.startsWith('/teacher/students') && !path.startsWith('/teacher/exercises') && !path.startsWith('/teacher/finance')) {
          navigate(`/teacher/courses?search=${encodeURIComponent(keyword)}`)
        } else {
          const searchParams = new URLSearchParams(location.search)
          if (keyword) {
            searchParams.set('search', keyword)
          } else {
            searchParams.delete('search')
          }
          navigate(`${path}?${searchParams.toString()}`)
        }
      }
    }
  }

  return (
    <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
      <i className="ti ti-search" style={{
        position: 'absolute', left: 10, top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 15, color: 'var(--ink-3)', pointerEvents: 'none',
      }} />
      <input
        type="text"
        placeholder={isMobile ? 'Tìm kiếm…' : placeholder}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', height: 34,
          background: focused ? 'var(--surface)' : 'var(--border-faint)',
          border: `0.5px solid ${focused ? 'var(--purple)' : 'var(--border)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(140,6,216,0.08)' : 'none',
          borderRadius: 7,
          padding: '0 12px 0 32px',
          fontSize: 12.5, color: 'var(--ink)',
          outline: 'none', fontFamily: 'inherit',
          transition: 'all 0.15s',
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      />
    </div>
  )
}


/* ══════════════════════════════════════════════
   TOPBAR (main export)

   Props:
     isMobile     — boolean (< 1024px) — truyền từ DashboardLayout
     onMenuToggle — () => void          — mở/đóng sidebar drawer

   Hamburger hiện khi isMobile = true
   NotifButton tự fetch — không cần hasUnread prop nữa
══════════════════════════════════════════════ */
export default function Topbar({
  breadcrumb,
  breadcrumbIcon = 'layout-dashboard',
  searchPlaceholder = 'Tìm kiếm người dùng, khoá học, thống kê...',
  user,
  isMobile = false,
  onMenuToggle,
}) {
  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'var(--surface)',
      borderBottom: '0.5px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: isMobile ? '0 10px' : '0 22px',
      gap: isMobile ? 6 : 14,
      flexShrink: 0,
    }}>

      {/* Hamburger — chỉ hiện dưới 1024px */}
      {isMobile && <HamburgerButton onClick={onMenuToggle} />}

      <SearchInput placeholder={searchPlaceholder} isMobile={isMobile} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <NotifButton variant="topbar" />
      </div>
    </header>
  )
}