import { useState, useEffect } from "react"
import { getMyCourses } from "../api/learning.api"

const clamp = (v) => Math.min(Math.max(Number(v) || 0, 0), 100)

export function useMyCourses() {
  const [courses, setCourses]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")
  const [filter, setFilter]     = useState("all") // all | inprogress | completed | notstarted

  useEffect(() => {
    getMyCourses()
      .then((res) => setCourses(res.result || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = courses.filter((c) => {
    const p = clamp(c.progressPercent)
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === "all"        ? true :
      filter === "completed"  ? p >= 100 :
      filter === "inprogress" ? p > 0 && p < 100 :
      filter === "notstarted" ? p === 0 : true
    return matchSearch && matchFilter
  })

  const tabs = [
    { key: "all",        label: "Tất cả",        count: courses.length },
    { key: "inprogress", label: "Đang học",       count: courses.filter(c => clamp(c.progressPercent) > 0 && clamp(c.progressPercent) < 100).length },
    { key: "completed",  label: "Hoàn thành",     count: courses.filter(c => clamp(c.progressPercent) >= 100).length },
    { key: "notstarted", label: "Chưa bắt đầu",   count: courses.filter(c => clamp(c.progressPercent) === 0).length },
  ]

  return {
    courses,
    loading,
    search,
    setSearch,
    filter,
    setFilter,
    filtered,
    tabs,
  }
}
