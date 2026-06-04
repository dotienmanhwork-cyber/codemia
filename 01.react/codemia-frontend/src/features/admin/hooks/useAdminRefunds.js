// src/features/admin/hooks/useAdminRefunds.js
import { useState, useEffect, useCallback } from 'react'
import { getRefunds, completeRefund, cancelRefund, remindRefund } from '../api/admin.api'

const PAGE_SIZE = 10

export function useAdminRefunds() {
  const [refunds,      setRefunds]      = useState([])
  const [activeStatus, setActiveStatus] = useState('PENDING')
  const [page,         setPage]         = useState(1)
  const [totalPages,   setTotalPages]   = useState(1)
  const [totalByStatus,setTotalByStatus]= useState({})
  const [loading,      setLoading]      = useState(true)
  const [completing,   setCompleting]   = useState(false)
  const [cancelling,   setCancelling]   = useState(false)
  const [reminding,    setReminding]    = useState(false)

  // ── Fetch ────────────────────────────────────────────────
  const fetchRefunds = useCallback((status, p) => {
    setLoading(true)
    getRefunds(status, p, PAGE_SIZE)
      .then((res) => {
        const result = res.result ?? {}
        setRefunds(result.content ?? [])
        setTotalPages(result.totalPages ?? 1)
        // totalByStatus nếu BE trả về, fallback giữ nguyên
        if (result.totalByStatus) setTotalByStatus(result.totalByStatus)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRefunds(activeStatus, page)
  }, [activeStatus, page, fetchRefunds])

  // Khi đổi tab — reset về page 1
  const handleStatusChange = useCallback((status) => {
    setActiveStatus(status)
    setPage(1)
  }, [])

  // ── Mark Completed ───────────────────────────────────────
  const handleComplete = useCallback(async (id, note) => {
    setCompleting(true)
    try {
      await completeRefund(id, note)
      fetchRefunds(activeStatus, page)
    } catch (err) {
      console.error(err)
    } finally {
      setCompleting(false)
    }
  }, [fetchRefunds, activeStatus, page])

  // ── Cancel ───────────────────────────────────────────────
  const handleCancel = useCallback(async (id) => {
    setCancelling(true)
    try {
      await cancelRefund(id)
      fetchRefunds(activeStatus, page)
    } catch (err) {
      console.error(err)
    } finally {
      setCancelling(false)
    }
  }, [fetchRefunds, activeStatus, page])

  // ── Remind ───────────────────────────────────────────────
  const handleRemind = useCallback(async (id) => {
    setReminding(true)
    try {
      await remindRefund(id)
    } catch (err) {
      console.error(err)
    } finally {
      setReminding(false)
    }
  }, [])

  return {
    refunds,
    activeStatus,
    setActiveStatus: handleStatusChange,
    page,
    totalPages,
    onPageChange: setPage,
    totalByStatus,
    loading,
    completing,
    cancelling,
    reminding,
    handleComplete,
    handleCancel,
    handleRemind,
    fetchRefunds,
  }
}