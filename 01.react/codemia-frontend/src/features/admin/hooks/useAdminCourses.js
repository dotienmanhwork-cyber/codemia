import { useState, useEffect, useCallback, useContext } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { DashboardSearchContext } from '@/layouts/DashboardLayout';
import {
  getAdminCourses,
  updateAdminCourseStatus,
  deleteAdminCourse,
} from '../api/admin.api';

/* ── Clamp helper: không cho nhập số âm ── */
function clampPositive(val) {
  if (val === '') return ''
  const n = Number(val)
  return n < 0 ? '0' : String(n)
}

export function useAdminCourses() {
  /* ── List state ── */
  const [courses,       setCourses]       = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages,    setTotalPages]    = useState(1)
  const [loading,       setLoading]       = useState(false)

  /* ── Filter / search / page ── */
  const [filter,  setFilter]  = useState('')
  const { keyword: search, setKeyword: setSearch } = useContext(DashboardSearchContext)
  const [page,    setPage]    = useState(1)

  /* ── Debounced keyword (300ms) ── */
  const keyword = useDebounce(search, 300)

  /* ── Price range (raw input) ── */
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  /* ── Debounced prices (500ms) ── */
  const debouncedMin = useDebounce(minPrice, 500)
  const debouncedMax = useDebounce(maxPrice, 500)

  /* ── Validation: min > max ── */
  const priceRangeInvalid =
    debouncedMin !== '' &&
    debouncedMax !== '' &&
    Number(debouncedMin) > Number(debouncedMax)

  /* ── Modal state ── */
  const [deleteTarget,    setDeleteTarget]    = useState(null)
  const [rejectTarget,    setRejectTarget]    = useState(null)
  const [rejectReason,    setRejectReason]    = useState('')
  const [republishTarget, setRepublishTarget] = useState(null)
  const [suspendTarget,   setSuspendTarget]   = useState(null)
  const [suspendReason,   setSuspendReason]   = useState('')
  const [restoreTarget,   setRestoreTarget]   = useState(null)
  const [actionLoading,   setActionLoading]   = useState(false)
  const [deleteError,     setDeleteError]     = useState('')

  /* ── Fetch ── */
  const fetchCourses = useCallback(async () => {
    if (priceRangeInvalid) return
    setLoading(true)
    try {
      const res = await getAdminCourses({
        page,
        size: 10,
        ...(filter       && { status: filter }),
        ...(keyword      && { keyword }),
        ...(debouncedMin !== '' && { minPrice: Number(debouncedMin) }),
        ...(debouncedMax !== '' && { maxPrice: Number(debouncedMax) }),
      })
      const data = res.result
      setCourses(data.content)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error('Failed to fetch courses', err)
    } finally {
      setLoading(false)
    }
  }, [page, filter, keyword, debouncedMin, debouncedMax, priceRangeInvalid])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  /* ── Handlers ── */
  const handleFilter = (val) => { setFilter(val); setPage(1) }
  const handleSearch = (val) => { setSearch(val); setPage(1) }

  const handleMinPrice = (val) => {
    const safe = clampPositive(val)
    setMinPrice(safe)
    setPage(1)
  }

  const handleMaxPrice = (val) => {
    const safe = clampPositive(val)
    setMaxPrice(safe)
    setPage(1)
  }

  const clearPriceRange = () => {
    setMinPrice('')
    setMaxPrice('')
    setPage(1)
  }

  /* ── Actions ── */
  const handleApprove = async (course) => {
    try {
      await updateAdminCourseStatus(course.id, { status: 'PUBLISHED', reason: null })
      fetchCourses()
    } catch (err) {
      console.error('Approve failed', err)
    }
  }

  const openReject = (course) => {
    setRejectTarget(course)
    setRejectReason('')
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return
    setActionLoading(true)
    try {
      await updateAdminCourseStatus(rejectTarget.id, {
        status: 'REJECTED',
        reason: rejectReason.trim() || null,
      })
      setRejectTarget(null)
      setRejectReason('')
      fetchCourses()
    } catch (err) {
      console.error('Reject failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRepublishConfirm = async () => {
    if (!republishTarget) return
    setActionLoading(true)
    try {
      await updateAdminCourseStatus(republishTarget.id, { status: 'PUBLISHED', reason: null })
      setRepublishTarget(null)
      fetchCourses()
    } catch (err) {
      console.error('Republish failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspendConfirm = async () => {
    if (!suspendTarget) return
    setActionLoading(true)
    try {
      await updateAdminCourseStatus(suspendTarget.id, {
        status: 'SUSPENDED',
        reason: suspendReason.trim() || null,
      })
      setSuspendTarget(null)
      setSuspendReason('')
      fetchCourses()
    } catch (err) {
      console.error('Suspend failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return
    setActionLoading(true)
    try {
      await updateAdminCourseStatus(restoreTarget.id, { status: 'PUBLISHED', reason: null })
      setRestoreTarget(null)
      fetchCourses()
    } catch (err) {
      console.error('Restore failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    setDeleteError('')
    try {
      await deleteAdminCourse(deleteTarget.id)
      setDeleteTarget(null)
      setDeleteError('')
      if (courses.length === 1 && page > 1) setPage((p) => p - 1)
      else fetchCourses()
    } catch (err) {
      setDeleteError('Xóa thất bại. Vui lòng thử lại.')
      console.error('Delete failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  return {
    courses,
    totalElements,
    totalPages,
    loading,
    filter,
    search,
    page,
    setPage,
    minPrice,
    maxPrice,
    priceRangeInvalid,
    deleteTarget,
    setDeleteTarget,
    rejectTarget,
    setRejectTarget,
    rejectReason,
    setRejectReason,
    republishTarget,
    setRepublishTarget,
    suspendTarget,
    setSuspendTarget,
    suspendReason,
    setSuspendReason,
    restoreTarget,
    setRestoreTarget,
    actionLoading,
    deleteError,
    setDeleteError,
    handleFilter,
    handleSearch,
    handleMinPrice,
    handleMaxPrice,
    clearPriceRange,
    handleApprove,
    openReject,
    handleRejectConfirm,
    handleRepublishConfirm,
    handleSuspendConfirm,
    handleRestoreConfirm,
    handleDeleteConfirm,
  }
}