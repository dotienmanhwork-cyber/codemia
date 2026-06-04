import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { catalogApi } from "../api/catalog.api"

export function useCatalog() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [courses,    setCourses]    = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)

  // Đọc ?category=X từ URL lúc mới vào trang
  const [activeCatId, setActiveCatId] = useState(() => {
    const param = searchParams.get("category")
    return param ? Number(param) : null
  })

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [coursesData, categoriesData] = await Promise.all([
          catalogApi.getAllCourses(),
          catalogApi.getAllCategories(),
        ])

        if (Array.isArray(coursesData))          setCourses(coursesData)
        else if (Array.isArray(coursesData?.content)) setCourses(coursesData.content)
        else setCourses([])

        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      } catch (err) {
        console.error("useCatalog fetchAll error:", err)
        setCourses([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Đổi category: cập nhật state + đồng bộ URL
  const handleCatChange = (catId) => {
    setActiveCatId(catId)
    if (catId) setSearchParams({ category: catId })
    else       setSearchParams({})
  }

  // Lọc courses theo category đang chọn VÀ từ khóa tìm kiếm (search tương đối)
  const filtered = useMemo(() => {
    let result = courses
    if (activeCatId) {
      result = result.filter((c) => c.category?.id === activeCatId)
    }
    const searchQuery = searchParams.get("search")
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((c) =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.teacherName && c.teacherName.toLowerCase().includes(q))
      )
    }
    return result
  }, [courses, activeCatId, searchParams])

  // Tên category đang chọn (để hiện tiêu đề)
  const activeCatName = useMemo(
    () => categories.find((c) => c.id === activeCatId)?.name ?? null,
    [categories, activeCatId]
  )

  return {
    courses,
    categories,
    loading,
    activeCatId,
    handleCatChange,
    filtered,
    activeCatName,
    searchQuery: searchParams.get("search") || "",
  }
}
