// src/features/admin/components/DashboardStatCards.jsx
import { useState, useEffect } from 'react';
import StatCard from '../../../shared/components/dashboard-ui/StatCard';
import { getDashboardStats, getFinanceStats } from '../api/admin.api';

/* ── useIsMobile (inline per RESPONSIVE.md) ── */
function useIsMobile(breakpoint) {
  const [is, setIs] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const h = () => setIs(window.innerWidth < breakpoint);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [breakpoint]);
  return is;
}

/* ── Helpers ── */

/** VNĐ compact: 1_500_000 → "1.5M ₫" */
function formatRevenue(amount) {
  if (!amount) return '0 ₫';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ ₫`;
  if (amount >= 1_000_000)     return `${(amount / 1_000_000).toFixed(1)} tr ₫`;
  if (amount >= 1_000)         return `${(amount / 1_000).toFixed(1)}k ₫`;
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

/* ── Skeleton — giữ layout ổn khi loading ── */
function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        minHeight: 100,
        opacity: 0.5,
      }}
    />
  );
}

/* ══════════════════════════════════════════
   DashboardStatCards
   Responsive: 4 cols (≥480px) | 2×2 (<480px)
══════════════════════════════════════════ */
export default function DashboardStatCards() {
  const [stats,        setStats]        = useState(null);
  const [financeStats, setFinanceStats] = useState(null);
  const [loading,      setLoading]      = useState(true);

  // RESPONSIVE: stat cards 2×2 khi < 480px (per RESPONSIVE.md §5)
  const isSmallCard = useIsMobile(480);

  useEffect(() => {
    // Fetch cả 2 song song — dashboard cho users/health/approvals,
    // finance cho revenue thực (getDashboardStats thường trả monthlyRevenue: 0)
    Promise.allSettled([getDashboardStats(), getFinanceStats()])
      .then(([dashRes, finRes]) => {
        if (dashRes.status === 'fulfilled') setStats(dashRes.value.result);
        if (finRes.status  === 'fulfilled') setFinanceStats(finRes.value.result ?? finRes.value);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: isSmallCard
      ? 'repeat(2, 1fr)'
      : 'repeat(auto-fit, minmax(155px, 1fr))',
    gap: 10,
  };

  if (loading) {
    return (
      <div style={gridStyle}>
        {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div style={gridStyle}>
      <StatCard
        label="Tổng người dùng"
        value={stats ? stats.totalUsers.toLocaleString() : '—'}
        icon="users"
        iconColor="purple"
        badge={stats ? (() => {
          const g = stats.userGrowth
          if (g > 0) return `↑ +${g}%`
          if (g < 0) return `↓ ${g}%`
          return '0%'
        })() : '—'}
        badgeType={stats?.userGrowth >= 0 ? "up" : "down"}
      />
      <StatCard
        label="Chờ phê duyệt"
        value={stats ? `${stats.pendingApprovals} yêu cầu` : '—'}
        icon="clock-exclamation"
        iconColor="amber"
        badge="Ưu tiên cao"
        badgeType="warn"
      />
      <StatCard
        label="Tình trạng hệ thống"
        value={stats ? `${stats.systemHealth}%` : '—'}
        icon="shield-check"
        iconColor="green"
        badge="Hoạt động tốt"
        badgeType="up"
      />
      <StatCard
        label="Doanh thu tháng"
        value={financeStats?.monthlyRevenue != null
          ? formatRevenue(financeStats.monthlyRevenue)
          : stats?.monthlyRevenue != null
            ? formatRevenue(stats.monthlyRevenue)
            : '—'}
        icon="trending-up"
        iconColor="dark"
        badge={(() => {
          const g = financeStats?.revenueGrowth ?? stats?.revenueGrowth
          if (g == null) return 'Tháng này'
          if (g > 0)  return `↑ +${g}%`
          if (g < 0)  return `↓ ${g}%`
          return '0%'
        })()}
        badgeType={(financeStats?.revenueGrowth ?? stats?.revenueGrowth) >= 0 ? "up" : "down"}
      />
    </div>
  );
}