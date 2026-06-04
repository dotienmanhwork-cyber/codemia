// src/features/admin/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import PageHeader         from '../../../shared/components/dashboard-ui/PageHeader';
import DashboardStatCards from '../components/DashboardStatCards';
import RoleRequestsWidget from '../components/RoleRequestsWidget';
import SystemLogs         from '../components/SystemLogs';

/* ── useIsMobile (inline per RESPONSIVE.md §6) ── */
function useIsMobile(breakpoint) {
  const [is, setIs] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const h = () => setIs(window.innerWidth < breakpoint);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [breakpoint]);
  return is;
}

/* ══════════════════════════════════════════
   AdminDashboard
══════════════════════════════════════════ */
export default function AdminDashboard() {
  // RESPONSIVE: 2-col collapse về 1-col khi < 1280px (per RESPONSIVE.md §5)
  const isOneCol = useIsMobile(1280);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <PageHeader
        title="Bảng điều khiển Admin"
        subtitle="Giám sát toàn hệ thống và quản lý nền tảng."
        action={
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 15px',
              background: 'var(--ink)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2d2f31')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ink)')}
          >
            <i className="ti ti-download" style={{ fontSize: 14 }} />
            Xuất báo cáo
          </button>
        }
      />

      {/* Stat cards — responsive grid handled internally */}
      <DashboardStatCards />

      {/* Two-col: role requests + system logs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isOneCol ? '1fr' : '1fr 268px',
          gap: 10,
          alignItems: 'start',
        }}
      >
        <RoleRequestsWidget />
        <SystemLogs />
      </div>
    </div>
  );
}
