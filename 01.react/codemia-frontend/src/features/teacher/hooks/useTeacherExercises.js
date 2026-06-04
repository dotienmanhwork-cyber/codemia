import { useState, useEffect, useContext } from 'react'
import { getExerciseStats, getExercises } from '../api/teacher.api'
import { DashboardSearchContext } from '@/layouts/DashboardLayout'

const DEFAULT_STATS = { totalExercises: 0, quizExercises: 0, codeExercises: 0, totalSubmissions: 0 }

export function useTeacherExercises() {
  const [stats,      setStats]      = useState(DEFAULT_STATS)
  const [exercises,  setExercises]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')   // 'all' | 'QUIZ' | 'CODE'
  const { keyword: search, setKeyword: setSearch } = useContext(DashboardSearchContext)
  const [page,       setPage]       = useState(1)

  // ── Fetch stats (1 lần) ───────────────────────────────────────────────────
  useEffect(() => {
    getExerciseStats()
      .then((res) => setStats(res.result))
      .catch(console.error)
  }, [])

  // ── Fetch list — refetch khi filter thay đổi ──────────────────────────────
  useEffect(() => {
    setLoading(true)
    const params = {
      type:    filter !== 'all' ? filter : undefined,
      keyword: search.trim() || undefined,
    }
    getExercises(params)
      .then((res) => {
        setExercises(res.result ?? [])
        setPage(1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  // ── Debounce search 400ms ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      const params = {
        type:    filter !== 'all' ? filter : undefined,
        keyword: search.trim() || undefined,
      }
      getExercises(params)
        .then((res) => {
          setExercises(res.result ?? [])
          setPage(1)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleFilter(val) {
    setFilter(val)
    setPage(1)
  }

  function handleSearch(val) {
    setSearch(val)
  }

  return {
    stats,
    exercises,
    loading,
    filter,
    search,
    page,
    handleFilter,
    handleSearch,
    setPage,
  }
}
