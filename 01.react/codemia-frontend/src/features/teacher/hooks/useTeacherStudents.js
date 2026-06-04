import { useState, useEffect, useCallback, useMemo, useContext } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { DashboardSearchContext } from '@/layouts/DashboardLayout'
import {
  getStudentStats,
  getStudents,
  getTeacherCourses,
} from '../api/teacher.api'

/**
 * Tính status từ data — đồng bộ với BE mapToStudentResponse():
 *   progress === 100                        → COMPLETED
 *   progress === 0                          → NOT_STARTED
 *   lastActiveAt > 7 ngày trước            → INACTIVE
 *   còn lại                                → ACTIVE
 *
 * Dùng để filter client-side trong khi BE chưa deploy NOT_STARTED.
 * TODO: Khi BE deploy xong, bỏ hàm này + bỏ filteredStudents,
 *       truyền params.status thẳng lên getStudents() là xong.
 */
function deriveStatus(student) {
  const { progress, lastActiveAt } = student
  if (progress === 100) return 'COMPLETED'
  if (progress === 0)   return 'NOT_STARTED'
  if (lastActiveAt) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    if (new Date(lastActiveAt).getTime() < sevenDaysAgo) return 'INACTIVE'
  }
  return 'ACTIVE'
}

export function useTeacherStudents() {
  const [searchParams] = useSearchParams()

  /* ── Server data ── */
  const [stats,    setStats]    = useState(null)
  const [students, setStudents] = useState([])
  const [courses,  setCourses]  = useState([])

  /* ── Filter state — courseFilter khởi tạo từ ?courseId= nếu có ── */
  const [statusFilter, setStatusFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState(() => searchParams.get('courseId') ?? '')
  const { keyword: search, setKeyword: setSearch } = useContext(DashboardSearchContext)
  const debouncedKw = useDebounce(search, 400)

  /* ── Pagination ── */
  const [page, setPage] = useState(1)

  /* ── Loading ── */
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingList,  setLoadingList]  = useState(true)

  /* ── Init: stats + course list ── */
  useEffect(() => {
    getStudentStats()
      .then((res) => setStats(res.result ?? null))
      .catch(console.error)
      .finally(() => setLoadingStats(false))

    getTeacherCourses()
      .then((res) => setCourses(res.result ?? []))
      .catch(console.error)
  }, [])

  /* ── Fetch students — KHÔNG gửi status lên BE (BE chưa deploy NOT_STARTED)
        Chỉ gửi courseId + keyword để DB filter, status filter ở client ── */
  useEffect(() => {
    const params = {}
    if (courseFilter) params.courseId = courseFilter
    if (debouncedKw)  params.keyword  = debouncedKw

    setLoadingList(true)
    getStudents(params)
      .then((res) => {
        setStudents(res.result ?? [])
        setPage(1)
      })
      .catch(console.error)
      .finally(() => setLoadingList(false))
  }, [courseFilter, debouncedKw])

  /* ── Client-side status filter (đồng bộ logic với BE) ── */
  const filteredStudents = useMemo(() => {
    if (statusFilter === 'all') return students
    return students.filter((s) => deriveStatus(s) === statusFilter)
  }, [students, statusFilter])

  /* ── Reset page khi filter thay đổi ── */
  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  /* ── Handlers ── */
  const handleStatus = useCallback((val) => {
    setStatusFilter(val)
  }, [])

  const handleCourse = useCallback((val) => {
    setCourseFilter(val)
    setPage(1)
  }, [])

  const handleSearch = useCallback((val) => {
    setSearch(val)
  }, [])

  return {
    stats,
    students: filteredStudents,   // đã filter theo status
    courses,
    statusFilter,
    courseFilter,
    search,
    page,
    loadingStats,
    loadingList,
    handleStatus,
    handleCourse,
    handleSearch,
    setPage,
  }
}