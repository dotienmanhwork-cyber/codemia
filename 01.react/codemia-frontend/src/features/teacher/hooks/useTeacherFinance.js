import { useState, useEffect, useCallback, useContext } from 'react';
import { DashboardSearchContext } from '@/layouts/DashboardLayout';
import {
  getFinanceStats,
  getMonthlyRevenue,
  getRevenueByCourse,
  getTransactions,
  getMyBalance,
  requestWithdrawal,
  getMyWithdrawals,
} from '../api/teacher.api';
import { authApi } from '../../auth/api/auth.api';

const TX_SIZE = 8;

export function useTeacherFinance() {
  /* ── Server data ── */
  const [stats,       setStats]       = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [courseData,  setCourseData]  = useState([]);

  /* ── Transactions (server-side pagination) ── */
  const [transactions, setTransactions] = useState([]);
  const [txTotal,      setTxTotal]      = useState(0);
  const [txPage,       setTxPage]       = useState(1);
  const { keyword: txSearch, setKeyword: setTxSearch } = useContext(DashboardSearchContext);
  const [debouncedKw,  setDebouncedKw]  = useState('');

  /* ── Withdrawal ── */
  const [balance,            setBalance]            = useState(null);
  const [withdrawals,        setWithdrawals]        = useState([]);
  const [loadingBalance,     setLoadingBalance]     = useState(true);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [requesting,         setRequesting]         = useState(false);
  const [savingBankInfo,     setSavingBankInfo]     = useState(false);

  /* ── Loading states ── */
  const [loadingStats,   setLoadingStats]   = useState(true);
  const [loadingChart,   setLoadingChart]   = useState(true);
  const [loadingCourse,  setLoadingCourse]  = useState(true);
  const [loadingTx,      setLoadingTx]      = useState(true);

  /* ── Debounce keyword search ── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKw(txSearch), 400);
    return () => clearTimeout(t);
  }, [txSearch]);

  /* ── Init: stats, chart, course breakdown ── */
  useEffect(() => {
    getFinanceStats()
      .then((res) => setStats(res.result ?? null))
      .catch(console.error)
      .finally(() => setLoadingStats(false));

    getMonthlyRevenue(7)
      .then((res) => setMonthlyData(res.result ?? []))
      .catch(console.error)
      .finally(() => setLoadingChart(false));

    getRevenueByCourse()
      .then((res) => setCourseData(res.result ?? []))
      .catch(console.error)
      .finally(() => setLoadingCourse(false));
  }, []);

  /* ── Init: balance + withdrawal history ── */
  const fetchBalanceAndHistory = useCallback(() => {
    setLoadingBalance(true);
    getMyBalance()
      .then((res) => setBalance(res.result ?? null))
      .catch(console.error)
      .finally(() => setLoadingBalance(false));

    setLoadingWithdrawals(true);
    getMyWithdrawals()
      .then((res) => setWithdrawals(res.result ?? []))
      .catch(console.error)
      .finally(() => setLoadingWithdrawals(false));
  }, []);

  useEffect(() => {
    fetchBalanceAndHistory();
  }, [fetchBalanceAndHistory]);

  /* ── Fetch transactions ── */
  useEffect(() => {
    const params = { page: txPage - 1, size: TX_SIZE };
    if (debouncedKw) params.keyword = debouncedKw;

    setLoadingTx(true);
    getTransactions(params)
      .then((res) => {
        const data = res.result ?? {};
        setTransactions(data.transactions ?? []);
        setTxTotal(data.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoadingTx(false));
  }, [txPage, debouncedKw]);

  /* ── Handlers ── */
  const handleTxSearch = (val) => { setTxSearch(val); setTxPage(1); };
  const handleTxPage   = (p)   => setTxPage(p);

  const handleRequestWithdrawal = async (amount) => {
    setRequesting(true);
    try {
      await requestWithdrawal(amount);
      // Refetch balance + history ngay sau khi tạo thành công
      fetchBalanceAndHistory();
    } catch (err) {
      console.error(err);
      throw err; // để component hiển thị lỗi nếu cần
    } finally {
      setRequesting(false);
    }
  };

  /**
   * Lưu thông tin ngân hàng — hard block trước khi rút tiền
   * @param {{ bankName: string, bankAccountNumber: string, bankAccountName: string }} data
   */
  const handleSaveBankInfo = async (data) => {
    setSavingBankInfo(true);
    try {
      // Fetch profile hiện tại để không overwrite fullName/bio/avatarUrl thành null
      const profileRes = await authApi.getMyProfile();
      const profile = profileRes.data?.result ?? profileRes.result ?? {};

      await authApi.updateProfile({
        fullName:          profile.fullName,
        bio:               profile.bio,
        avatarUrl:         profile.avatarUrl,
        bankAccountInfo:   JSON.stringify(data),
      });

      // Refetch balance để bankAccountInfo hiển thị trong UI
      await getMyBalance()
        .then((res) => setBalance(res.result ?? null))
        .catch(console.error);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setSavingBankInfo(false);
    }
  };

  return {
    /* finance */
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
    txSize: TX_SIZE,
    /* withdrawal */
    balance,
    withdrawals,
    loadingBalance,
    loadingWithdrawals,
    requesting,
    handleRequestWithdrawal,
    savingBankInfo,
    handleSaveBankInfo,
  };
}