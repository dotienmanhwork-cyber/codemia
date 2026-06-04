import { useState, useEffect, useCallback } from 'react'
import {
  getTeacherDashboardStats,
  getTeacherCourses,
  getRecentStudents,
  getRecentRevenue,
} from '../api/teacher.api'

export function useTeacherDashboard() {
  /* State */
  const [stats,    setStats]    = useState(null)
  const [courses,  setCourses]  = useState([])
  const [students, setStudents] = useState([])
  const [revenue,  setRevenue]  = useState([])
  const [loading,  setLoading]  = useState(true)

  /* Fetch */
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, coursesRes, studentsRes, revenueRes] = await Promise.all([
        getTeacherDashboardStats(),
        getTeacherCourses(),
        getRecentStudents(5),
        getRecentRevenue(10),
      ])
      setStats(statsRes.result)
      setCourses(coursesRes.result   ?? [])
      setStudents(studentsRes.result ?? [])
      setRevenue(revenueRes.result   ?? [])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    stats,
    courses,
    students,
    revenue,
    loading,
    refetch: fetchAll,
  }
}
