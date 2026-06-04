// src/layouts/DashboardLayout.jsx
import { useNavigate, useLocation, Outlet, useSearchParams } from 'react-router-dom'
import { useContext, useState, useEffect, createContext } from 'react'
import Sidebar from '@/shared/components/site-layout/Sidebar'
import Topbar  from '@/shared/components/site-layout/Topbar'
import { AuthContext } from '../shared/context/AuthContext'
import { teacherMenu, adminMenu } from '../shared/utils/menu'

export const DashboardSearchContext = createContext({
  keyword: '',
  setKeyword: () => {},
})

/* ── Responsive hook ──────────────────────────────────────
 * Dùng breakpoint 1024px — sidebar ẩn dưới 1024px (tablet + mobile)
 * Xem RESPONSIVE.md mục 6 để biết các giá trị breakpoint khác
 * ───────────────────────────────────────────────────────── */
function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

/* ── Helpers ── */
function getActiveId(menu, pathname) {
  const exact = menu.find(
    (item) => !item.isDivider && !item.isBack && item.path === pathname
  )
  if (exact) return exact.id

  const prefix = [...menu]
    .filter((item) => !item.isDivider && !item.isBack && item.path !== '/')
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => pathname.startsWith(item.path.split(':')[0]))

  return prefix?.id ?? null
}

function getBreadcrumb(menu, activeId) {
  const item = menu.find((m) => m.id === activeId)
  return {
    label: item?.label ?? 'Dashboard',
    icon:  item?.icon  ?? 'layout-dashboard',
  }
}

/* ══════════════════════════════════════════════
   DashboardLayout
══════════════════════════════════════════════ */
export default function DashboardLayout({ role: roleProp }) {
  const navigate         = useNavigate()
  const location         = useLocation()
  const { user, logout } = useContext(AuthContext)

  const [searchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(() => searchParams.get('search') ?? '')

  useEffect(() => {
    const searchFromUrl = searchParams.get('search') ?? ''
    setKeyword(searchFromUrl)
  }, [location.pathname, searchParams])

  // Sidebar ẩn dưới 1024px (tablet + mobile) — xem RESPONSIVE.md mục 4
  const isMobile = useIsMobile(1024)

  // Sidebar mở mặc định trên desktop, đóng trên mobile/tablet
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  // Khi resize vượt qua breakpoint: reset state tránh sidebar bị kẹt
  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  const role = roleProp ?? (location.pathname.startsWith('/admin') ? 'admin' : 'teacher')
  const menu = role === 'admin' ? adminMenu : teacherMenu

  const activeId = getActiveId(menu, location.pathname)
  const { label: breadcrumbLabel, icon: breadcrumbIcon } = getBreadcrumb(menu, activeId)

  function handleNavigate(id) {
    const item = menu.find((m) => m.id === id)
    if (!item || item.isDivider) return
    navigate(item.path)
    // Đóng sidebar sau navigate trên mobile/tablet
    if (isMobile) setSidebarOpen(false)
  }

  const sidebarUser = {
    name: user?.fullName ?? user?.name ?? user?.email ?? 'Unknown',
    initials: (() => {
      const n = user?.fullName ?? user?.name
      if (n) return n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
      if (user?.email) return user.email[0].toUpperCase()
      return '??'
    })(),
    role,
  }

  return (
    <DashboardSearchContext.Provider value={{ keyword, setKeyword }}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

        {/* Backdrop — chỉ render khi mobile/tablet và sidebar đang mở */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              zIndex: 99,
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />
        )}

        <Sidebar
          role={role}
          activeId={activeId}
          onNavigate={handleNavigate}
          user={sidebarUser}
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <Topbar
            breadcrumb={breadcrumbLabel}
            breadcrumbIcon={breadcrumbIcon}
            searchPlaceholder={
              role === 'admin'
                ? 'Tìm kiếm người dùng, khoá học, thống kê...'
                : 'Tìm kiếm khoá học, học viên...'
            }
            hasUnread={true}
            user={sidebarUser}
            isMobile={isMobile}
            onMenuToggle={() => setSidebarOpen((v) => !v)}
          />

          {/* padding dùng CSS variables — tự co giãn theo breakpoint trong admin.css */}
          <main style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--page-py) var(--page-px)',
            background: 'var(--bg)',
          }}>
            <Outlet />
          </main>
        </div>

      </div>
    </DashboardSearchContext.Provider>
  )
}