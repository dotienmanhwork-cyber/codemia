// src/features/teacher/pages/TeacherFinance.jsx
import PageHeader          from '../../../shared/components/dashboard-ui/PageHeader'
import FinanceStatCards    from '../components/TeacherFinanceStatCards'
import FinanceChartSection from '../components/FinanceChartSection'
import FinanceTransactions from '../components/FinanceTransactions'
import WithdrawalSection   from '../components/WithdrawalSection'
import { useTeacherFinance } from '../hooks/useTeacherFinance'

export default function TeacherFinance() {
  const {
    stats,
    monthlyData,
    courseData,
    transactions,
    txTotal,
    txPage,
    txSearch,
    loadingStats,
    loadingChart,
    loadingCourse,
    loadingTx,
    handleTxSearch,
    handleTxPage,
    txSize,
    balance,
    withdrawals,
    loadingBalance,
    loadingWithdrawals,
    requesting,
    handleRequestWithdrawal,
    savingBankInfo,
    handleSaveBankInfo,
  } = useTeacherFinance()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        title="Ví & Thu nhập"
        subtitle="Doanh thu, giao dịch và hiệu suất tài chính từ các khóa học của bạn."
      />

      {/* 4 Stat cards */}
      <FinanceStatCards stats={stats} loading={loadingStats} />

      {/* Bar chart + Course breakdown */}
      <FinanceChartSection
        monthlyData={monthlyData}
        courseData={courseData}
        loadingChart={loadingChart}
        loadingCourse={loadingCourse}
      />

      {/* Transaction history */}
      <FinanceTransactions
        transactions={transactions}
        total={txTotal}
        size={txSize}
        loading={loadingTx}
        page={txPage}
        search={txSearch}
        onPageChange={handleTxPage}
        onSearch={handleTxSearch}
      />

      {/* Số dư & Rút tiền */}
      <WithdrawalSection
        balance={balance}
        withdrawals={withdrawals}
        loadingBalance={loadingBalance}
        loadingWithdrawals={loadingWithdrawals}
        onRequestWithdrawal={handleRequestWithdrawal}
        requesting={requesting}
        onSaveBankInfo={handleSaveBankInfo}
        savingBankInfo={savingBankInfo}
      />
    </div>
  )
}