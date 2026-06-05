import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { catalogApi } from "../api/catalog.api"

export function useCatalog() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [courses,    setCourses]    = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)

  // Đọc category và price trực tiếp từ URL bằng useMemo để luôn đồng bộ
  const activeCatId = useMemo(() => {
    const param = searchParams.get("category")
    return param ? Number(param) : null
  }, [searchParams])

  const activePrice = useMemo(() => {
    return searchParams.get("price") // 'free' | 'pro' | null
  }, [searchParams])

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

  // Đổi category: đồng bộ URL và giữ lại price / search
  const handleCatChange = (catId) => {
    const newParams = {}
    const price = searchParams.get("price")
    if (price) newParams.price = price
    const search = searchParams.get("search")
    if (search) newParams.search = search
    
    if (catId) newParams.category = catId
    setSearchParams(newParams)
  }

  // Đổi price: đồng bộ URL và giữ lại category / search
  const handlePriceChange = (priceType) => {
    const newParams = {}
    const category = searchParams.get("category")
    if (category) newParams.category = category
    const search = searchParams.get("search")
    if (search) newParams.search = search
    
    if (priceType) newParams.price = priceType
    setSearchParams(newParams)
  }

  // Lọc courses theo category đang chọn, price type VÀ từ khóa tìm kiếm
  const filtered = useMemo(() => {
    let result = courses
    if (activeCatId) {
      result = result.filter((c) => c.category?.id === activeCatId)
    }
    if (activePrice === "free") {
      result = result.filter((c) => c.price === 0 || c.price === null)
    } else if (activePrice === "pro") {
      result = result.filter((c) => c.price > 0)
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
  }, [courses, activeCatId, activePrice, searchParams])

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
    activePrice,
    handleCatChange,
    handlePriceChange,
    filtered,
    activeCatName,
    searchQuery: searchParams.get("search") || "",
  }
}
