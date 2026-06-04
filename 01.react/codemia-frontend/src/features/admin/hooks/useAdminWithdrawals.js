// src/features/admin/hooks/useAdminWithdrawals.js
import { useState, useEffect, useCallback } from 'react'
import {
  getWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal,
  remindWithdrawal,
  completeHoldWithdrawal,
} from '../api/admin.api'

const PAGE_SIZE = 10

// Fetch count cho 1 status — size=1 để nhẹ nhất
const fetchCount = (status) =>
  getWithdrawalRequests(status, 1, 1)
    .then((res) => res.result?.totalElements ?? 0)
    .catch(() => 0)

export function useAdminWithdrawals() {
  const [withdrawals,  setWithdrawals]  = useState([])
  const [statusCounts, setStatusCounts] = useState({
    ALL: 0, HOLD: 0, PENDING: 0, APPROVED: 0, REJECTED: 0,
  })
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [page,         setPage]         = useState(1)
  const [totalPages,   setTotalPages]   = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [approving,    setApproving]    = useState(false)
  const [rejecting,    setRejecting]    = useState(false)
  const [reminding,    setReminding]    = useState(false)
  const [completing,   setCompleting]   = useState(false)

  // ── Fetch counts cho tất cả tabs ────────────────────────
  const fetchAllCounts = useCallback(() => {
    const statuses = ['ALL', 'HOLD', 'PENDING', 'APPROVED', 'REJECTED']
    Promise.all(statuses.map((s) => fetchCount(s))).then(([all, hold, pending, approved, rejected]) => {
      setStatusCounts({ ALL: all, HOLD: hold, PENDING: pending, APPROVED: approved, REJECTED: rejected })
    })
  }, [])

  // ── Fetch data trang hiện tại ────────────────────────────
  const fetchWithdrawals = useCallback((status, p) => {
    setLoading(true)
    getWithdrawalRequests(status, p, PAGE_SIZE)
      .then((res) => {
        const result = res.result ?? {}
        setWithdrawals(result.content ?? [])
        setTotalPages(result.totalPages ?? 1)
        // Nếu BE trả totalByStatus thì dùng luôn, không cần gọi thêm
        if (result.totalByStatus) {
          setStatusCounts(prev => ({ ...prev, ...result.totalByStatus }))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Mount: fetch counts + data song song
  useEffect(() => {
    fetchAllCounts()
  }, [fetchAllCounts])

  useEffect(() => {
    fetchWithdrawals(activeStatus, page)
  }, [activeStatus, page, fetchWithdrawals])

  const handleStatusChange = useCallback((status) => {
    setActiveStatus(status)
    setPage(1)
  }, [])

  // Sau action: refetch data + cập nhật counts
  const refetchAfterAction = useCallback((status, p) => {
    fetchWithdrawals(status, p)
    fetchAllCounts()
  }, [fetchWithdrawals, fetchAllCounts])

  // ── Approve ──────────────────────────────────────────────
  const handleApprove = useCallback(async (id) => {
    setApproving(true)
    try {
      await approveWithdrawal(id)
      refetchAfterAction(activeStatus, page)
    } catch (err) {
      console.error(err)
    } finally {
      setApproving(false)
    }
  }, [refetchAfterAction, activeStatus, page])

  // ── Reject ───────────────────────────────────────────────
  const handleReject = useCallback(async (id, note) => {
    setRejecting(true)
    try {
      await rejectWithdrawal(id, note)
      refetchAfterAction(activeStatus, page)
    } catch (err) {
      console.error(err)
    } finally {
      setRejecting(false)
    }
  }, [refetchAfterAction, activeStatus, page])

  // ── Remind ───────────────────────────────────────────────
  const handleRemind = useCallback(async (id) => {
    setReminding(true)
    try {
      await remindWithdrawal(id)
    } catch (err) {
      console.error(err)
    } finally {
      setReminding(false)
    }
  }, [])

  // ── Complete HOLD (xử lý thủ công xong) ─────────────────────────
  const handleCompleteHold = useCallback(async (id, note) => {
    setCompleting(true)
    try {
      await completeHoldWithdrawal(id, note)
      refetchAfterAction(activeStatus, page)
    } catch (err) {
      console.error(err)
    } finally {
      setCompleting(false)
    }
  }, [refetchAfterAction, activeStatus, page])

  return {
    withdrawals,
    statusCounts,
    activeStatus,
    setActiveStatus: handleStatusChange,
    page,
    totalPages,
    onPageChange: setPage,
    loading,
    approving,
    rejecting,
    reminding,
    completing,
    handleApprove,
    handleReject,
    handleRemind,
    handleCompleteHold,
  }
}