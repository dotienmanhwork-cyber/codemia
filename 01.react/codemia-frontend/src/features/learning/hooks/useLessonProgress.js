import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import {
  getCourseProgress,
  getCourseCurriculum,
  getLessonDetail,
  getLessonExercise,
  markLessonComplete,
  saveVideoProgress,
} from "../api/learning.api"

// ─── Hook: Tự động lưu video progress (debounce 5s) ─────────────────────────
function useAutoSaveProgress(lessonId, enabled = true) {
  const timerRef = useRef(null)

  const save = useCallback(
    (currentTime) => {
      if (!lessonId || !enabled) return
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        saveVideoProgress(lessonId, currentTime).catch(console.error)
      }, 5000)
    },
    [lessonId, enabled]
  )

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return save
}

/**
 * Parse timestamp string "MM:SS" hoặc "HH:MM:SS" → seconds
 */
function parseTimestamp(str) {
  if (!str) return 0
  const parts = String(str).split(":").map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

/**
 * Sắp xếp các chapter theo orderIndex, và các lesson trong mỗi chapter theo orderIndex
 */
function sortChaptersAndLessons(chapters) {
  return [...(chapters ?? [])]
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    .map((chapter) => ({
      ...chapter,
      lessons: [...(chapter.lessons ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    }))
}

export function useLessonProgress() {
  const { courseSlug } = useParams()
  const navigate = useNavigate()

  // ── State ─────────────────────────────────────────────────────────────────
  const [course, setCourse] = useState(null)
  const [chapters, setChapters] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [currentExercise, setCurrentExercise] = useState(null)

  const [activeLessonId, setActiveLessonIdReal] = useState(null)
  const setActiveLessonId = (id) => {
    setActiveLessonIdReal(id != null ? Number(id) : null)
  }

  const [sidebarTab, setSidebarTab] = useState("content")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [chatHistory, setChatHistory] = useState({})

  const [loadingCourse, setLoadingCourse] = useState(true)
  const [loadingLesson, setLoadingLesson] = useState(false)
  const [courseError, setCourseError] = useState(null)
  const [lessonError, setLessonError] = useState(null)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)

  const seekToRef = useRef(null)

  const saveProgress = useAutoSaveProgress(
    activeLessonId,
    currentLesson?.type === "video"
  )

  // ── Refetch course + curriculum (silent support) ───────────────────────────
  const refetchCurriculum = useCallback(
    async (silent = false) => {
      if (!silent) setLoadingCourse(true)
      try {
        const [progressRes, curriculumRes] = await Promise.all([
          getCourseProgress(courseSlug),
          getCourseCurriculum(courseSlug),
        ])

        const progressData = progressRes?.result ?? progressRes
        const curriculumData = curriculumRes?.result ?? curriculumRes

        setCourse(progressData)
        const sorted = sortChaptersAndLessons(curriculumData?.chapters ?? [])
        setChapters(sorted)
        return { progressData, chapters: sorted }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu khóa học:", err)
        if (!silent) {
          setCourseError("Không thể tải dữ liệu khóa học. Vui lòng thử lại.")
        }
      } finally {
        if (!silent) setLoadingCourse(false)
      }
    },
    [courseSlug]
  )

  // ── Load course + curriculum initially ─────────────────────────────────────
  useEffect(() => {
    if (!courseSlug) {
      setCourseError("Không tìm thấy khóa học. Vui lòng kiểm tra đường dẫn.")
      setLoadingCourse(false)
      return
    }

    const init = async () => {
      const res = await refetchCurriculum(false)
      if (res) {
        const { progressData, chapters: sortedChapters } = res
        const allLessonsFlat = sortedChapters.flatMap((c) => c.lessons ?? [])
        const firstIncomplete = allLessonsFlat.find((l) => !l.completed)
        const smartFallbackId =
          firstIncomplete?.id ??
          allLessonsFlat[allLessonsFlat.length - 1]?.id ??
          null
        const firstLessonId = progressData?.currentLessonId ?? smartFallbackId

        if (firstLessonId != null) setActiveLessonId(firstLessonId)
      }
    }

    init()
  }, [courseSlug, refetchCurriculum])

  // ── Load lesson detail khi đổi bài ────────────────────────────────────────
  useEffect(() => {
    if (!activeLessonId) return

    seekToRef.current = null

    const fetchLesson = async () => {
      setLoadingLesson(true)
      setCurrentLesson(null)
      setCurrentExercise(null)
      setLessonError(null)
      try {
        const res = await getLessonDetail(activeLessonId)
        const lessonData = res?.result ?? res
        setCurrentLesson(lessonData)

        if (["EXERCISE", "QUIZ"].includes(lessonData?.type?.toUpperCase())) {
          const exRes = await getLessonExercise(activeLessonId)
          setCurrentExercise(exRes?.result ?? exRes)
        }
      } catch (err) {
        console.error("Lỗi khi tải bài học:", err)
        setLessonError("Không thể tải bài học. Vui lòng thử lại.")
      } finally {
        setLoadingLesson(false)
      }
    }

    fetchLesson()
  }, [activeLessonId])

  // Computeds
  const allLessons = chapters.flatMap((c) => c.lessons ?? [])
  const currentIndex = allLessons.findIndex((l) => Number(l.id) === Number(activeLessonId))
  const nextLesson = allLessons[currentIndex + 1] ?? null
  const prevLesson = allLessons[currentIndex - 1] ?? null
  const isExercise = ["EXERCISE", "QUIZ"].includes(currentLesson?.type?.toUpperCase())

  // Lock status calculation
  const unlockedLessonIds = new Set()
  let allPriorCompleted = true
  for (let i = 0; i < allLessons.length; i++) {
    const lesson = allLessons[i]
    const lessonIdNum = Number(lesson.id)
    const isCompleted = !!lesson.completed

    // Rule: Mở khóa nếu bài đó đã completed, HOẶC tất cả bài học trước đó đều đã completed
    if (isCompleted || allPriorCompleted) {
      unlockedLessonIds.add(lessonIdNum)
    }

    // Cập nhật trạng thái "tất cả bài học trước đó đã hoàn thành" cho bài tiếp theo
    allPriorCompleted = allPriorCompleted && isCompleted
  }
  if (activeLessonId) unlockedLessonIds.add(Number(activeLessonId))

  const isLessonLocked = useCallback(
    (id) => !unlockedLessonIds.has(Number(id)),
    [unlockedLessonIds]
  )

  // Handlers
  const handleLessonClick = useCallback((id) => {
    const numId = Number(id)
    if (isLessonLocked(numId)) return
    setActiveLessonId(numId)
    setSidebarOpen(false)
    setShowCompletionModal(false)
    setLessonError(null)
  }, [isLessonLocked])

  const handleComplete = useCallback(async () => {
    if (!activeLessonId) return
    try {
      await markLessonComplete(activeLessonId)

      setChapters((prev) => {
        const updated = prev.map((chapter) => ({
          ...chapter,
          lessons: chapter.lessons.map((l) =>
            Number(l.id) === Number(activeLessonId) ? { ...l, completed: true } : l
          ),
        }))
        const flat = updated.flatMap((c) => c.lessons ?? [])
        const completedCount = flat.filter((l) => l.completed).length
        const newProgress = flat.length > 0 ? Math.round((completedCount / flat.length) * 100) : 0
        setCourse((prev) => ({ ...prev, progress: newProgress }))
        return updated
      })

      // Silently refetch structural curriculum changes (like reorders)
      await refetchCurriculum(true)
    } catch (err) {
      console.error("Lỗi khi đánh dấu hoàn thành:", err)
    }
    setShowCompletionModal(true)
  }, [activeLessonId, refetchCurriculum])

  const handleContinue = useCallback(() => {
    if (nextLesson) {
      if (isLessonLocked(nextLesson.id)) {
        // Find the first incomplete, unlocked lesson in the new sorted sequence
        const firstIncomplete = allLessons.find(
          (l) => !l.completed && !isLessonLocked(l.id)
        )
        if (firstIncomplete) {
          toast.success("Giáo trình vừa được cập nhật. Đang chuyển đến bài học tiếp theo...")
          setActiveLessonId(firstIncomplete.id)
        }
      } else {
        setActiveLessonId(nextLesson.id)
      }
    }
    setShowCompletionModal(false)
  }, [nextLesson, allLessons, isLessonLocked])

  const handleViewCertificate = useCallback(() => {
    navigate(`/courses/${course?.slug ?? courseSlug}/certificate`)
  }, [course, courseSlug, navigate])

  const handleWriteReview = useCallback(() => {
    navigate(`/courses/${course?.slug ?? courseSlug}#reviews`)
  }, [course, courseSlug, navigate])

  const handleVideoTimeUpdate = useCallback(
    (currentTime) => {
      saveProgress(currentTime)
      setCurrentVideoTime(currentTime)
    },
    [saveProgress]
  )

  const handlePlayerReady = useCallback((seekFn) => {
    seekToRef.current = seekFn
  }, [])

  const handleTimestampClick = useCallback((timeStr) => {
    const seconds = parseTimestamp(timeStr)
    seekToRef.current?.(seconds)
  }, [])

  return {
    courseSlug,
    course,
    chapters,
    currentLesson,
    currentExercise,
    activeLessonId,
    setActiveLessonId,
    sidebarTab,
    setSidebarTab,
    sidebarOpen,
    setSidebarOpen,
    showCompletionModal,
    setShowCompletionModal,
    chatHistory,
    setChatHistory,
    loadingCourse,
    loadingLesson,
    courseError,
    lessonError,
    setLessonError,
    currentVideoTime,
    prevLesson,
    nextLesson,
    isExercise,
    isLessonLocked,
    handleLessonClick,
    handleComplete,
    handleContinue,
    handleViewCertificate,
    handleWriteReview,
    handleVideoTimeUpdate,
    handlePlayerReady,
    handleTimestampClick,
    setActiveLessonIdReal,
  }
}
