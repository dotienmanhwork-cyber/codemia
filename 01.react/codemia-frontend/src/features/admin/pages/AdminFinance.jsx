// src/features/admin/pages/AdminFinance.jsx
import { useState, useEffect, useCallback } from 'react'
import PageHeader            from '../../../shared/components/dashboard-ui/PageHeader'
import FinanceStatCards      from '../components/AdminFinanceStatCards'
import MonthlyBreakdownTable from '../components/MonthlyBreakdownTable'
import RevenueChart          from '../components/RevenueChart'
import TeacherPayoutsTable   from '../components/TeacherPayoutsTable'
import AdminWithdrawalTable  from '../components/AdminWithdrawalTable'
import AdminRefundTable      from '../components/AdminRefundTable'
import { useAdminRefunds }     from '../hooks/useAdminRefunds'
import { useAdminWithdrawals } from '../hooks/useAdminWithdrawals'
import {
  getFinanceStats,
  getFinanceMonthly,
  getTeacherPayouts,
} from '../api/admin.api'

// Inline hook — không tạo file riêng, đúng pattern RESPONSIVE.md
function useIsMobile(breakpoint) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

// Tháng hiện tại dạng 'YYYY-MM' — default cho teacher payouts
const currentMonth = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})()

/* ══════════════════════════════════════════════
   AdminFinance — page-level orchestration only
══════════════════════════════════════════════ */
export default function AdminFinance() {
  const isOneCol = useIsMobile(1280)

  const [stats,          setStats]          = useState(null)
  const [monthly,        setMonthly]        = useState([])
  const [teacherPayouts, setTeacherPayouts] = useState([])
  const [activeMonth,    setActiveMonth]    = useState(currentMonth)

  const [loadingStats,   setLoadingStats]   = useState(true)
  const [loadingMonthly, setLoadingMonthly] = useState(true)
  const [loadingPayouts, setLoadingPayouts] = useState(true)

  /* ── Withdrawal state (từ hook) ── */
  const {
    withdrawals,
    activeStatus  : wdStatus,
    setActiveStatus: setWdStatus,
    page          : wdPage,
    totalPages    : wdTotalPages,
    onPageChange  : wdOnPageChange,
    statusCounts  : wdStatusCounts,
    loading       : loadingWd,
    approving,
    rejecting,
    reminding,
    completing    : wdCompleting,
    handleApprove,
    handleReject,
    handleRemind,
    handleCompleteHold,
  } = useAdminWithdrawals()

  /* ── Refund state (từ hook) ── */
  const {
    refunds,
    activeStatus  : refundStatus,
    setActiveStatus: setRefundStatus,
    page          : refundPage,
    totalPages    : refundTotalPages,
    onPageChange  : refundOnPageChange,
    totalByStatus : refundTotalByStatus,
    loading       : loadingRefunds,
    completing    : refundCompleting,
    cancelling,
    reminding     : refundReminding,
    handleComplete,
    handleCancel,
    handleRemind  : handleRefundRemind,
  } = useAdminRefunds()

  // ── Load stats + monthly một lần khi mount ──────────────
  useEffect(() => {
    getFinanceStats()
      .then((res) => setStats(res.result))
      .catch(console.error)
      .finally(() => setLoadingStats(false))

    getFinanceMonthly(6)
      .then((res) => setMonthly(res.result))
      .catch(console.error)
      .finally(() => setLoadingMonthly(false))
  }, [])

  // ── Load teacher payouts — refetch khi đổi tháng ────────
  const fetchPayouts = useCallback((month) => {
    setLoadingPayouts(true)
    getTeacherPayouts(month)
      .then((res) => setTeacherPayouts(res.result))
      .catch(console.error)
      .finally(() => setLoadingPayouts(false))
  }, [])

  useEffect(() => {
    fetchPayouts(activeMonth)
  }, [activeMonth, fetchPayouts])

  // ── Export CSV ───────────────────────────────────────────
  const handleExportCSV = () => {
    const rows = [
      ['Month', 'Revenue', 'Payouts', 'Net', 'Transactions'],
      ...monthly.map((m) => [m.month, m.revenue, m.payouts, m.net, m.transactions]),
    ]
    const csv  = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `finance-${activeMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Header ── */}
      <PageHeader
        title="Tài chính"
        subtitle="Doanh thu, thanh toán và lịch sử giao dịch toàn nền tảng."
        action={
          <button
            onClick={handleExportCSV}
            style={{
              display    : 'flex',
              alignItems : 'center',
              gap        : 6,
              padding    : '8px 15px',
              background : 'var(--ink)',
              color      : '#fff',
              border     : 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize   : 13,
              fontWeight : 600,
              cursor     : 'pointer',
              fontFamily : 'inherit',
              minHeight  : 40,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2d2f31')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ink)')}
          >
            <i className="ti ti-download" style={{ fontSize: 14 }} />
            Xuất CSV
          </button>
        }
      />

      {/* ── Stat cards ── */}
      <FinanceStatCards stats={stats} loading={loadingStats} />

      {/* ── Monthly breakdown + Revenue chart ── */}
      <div style={{
        display             : 'grid',
        gridTemplateColumns : isOneCol ? '1fr' : '1fr 260px',
        gap                 : 10,
        alignItems          : 'start',
      }}>
        <MonthlyBreakdownTable data={monthly} loading={loadingMonthly} />
        <RevenueChart          data={monthly} loading={loadingMonthly} />
      </div>

      {/* ── Teacher payouts ── */}
      <TeacherPayoutsTable
        data={teacherPayouts}
        loading={loadingPayouts}
        activeMonth={activeMonth}
        onMonthChange={setActiveMonth}
      />

      {/* ── Withdrawal requests ── */}
      <AdminWithdrawalTable
        data={withdrawals}
        loading={loadingWd}
        activeStatus={wdStatus}
        onStatusChange={setWdStatus}
        onApprove={handleApprove}
        onReject={handleReject}
        onRemind={handleRemind}
        onCompleteHold={handleCompleteHold}
        approving={approving}
        rejecting={rejecting}
        reminding={reminding}
        completing={wdCompleting}
        page={wdPage}
        totalPages={wdTotalPages}
        onPageChange={wdOnPageChange}
        statusCounts={wdStatusCounts}
      />

      {/* ── Refund requests ── */}
      <AdminRefundTable
        data={refunds}
        loading={loadingRefunds}
        activeStatus={refundStatus}
        onStatusChange={setRefundStatus}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onRemind={handleRefundRemind}
        completing={refundCompleting}
        cancelling={cancelling}
        reminding={refundReminding}
        page={refundPage}
        totalPages={refundTotalPages}
        onPageChange={refundOnPageChange}
        totalByStatus={refundTotalByStatus}
      />

    </div>
  )
}