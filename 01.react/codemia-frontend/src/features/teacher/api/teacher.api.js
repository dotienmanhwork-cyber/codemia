import api from '@/shared/config/axios'

// ============================================================
// DASHBOARD
// ============================================================

/** Stat cards: totalStudents, totalCourses, draftCourses, monthlyRevenue, revenueGrowth, studentGrowth, averageRating */
export const getTeacherDashboardStats = () =>
  api.get('/teacher/dashboard/stats')

/** Widget khóa học: toàn bộ course (không filter) */
export const getTeacherCourses = () =>
  api.get('/teacher/courses')

/** Widget học viên gần đây */
export const getRecentStudents = (limit = 10) =>
  api.get('/teacher/students/recent', { params: { limit } })

/** Widget giao dịch gần đây */
export const getRecentRevenue = (limit = 10) =>
  api.get('/teacher/revenue/recent', { params: { limit } })

// ============================================================
// CATEGORIES
// ============================================================

/** Lấy toàn bộ cây danh mục — dùng cho dropdown khi tạo/sửa khóa học */
export const getCategories = () =>
  api.get('/categories')

// ============================================================
// COURSES
// ============================================================

export const getTeacherCoursesFilter = (params = {}) =>
  api.get('/teacher/courses/filter', { params })

export const getTeacherCourseById = (id) =>
  api.get(`/teacher/courses/${id}`)

export const createCourse = (data) =>
  api.post('/courses', data)

export const updateCourse = (id, data) =>
  api.put(`/courses/${id}`, data)

export const submitCourse = (id) =>
  api.patch(`/teacher/courses/${id}/submit`)

export const updateCourseStatus = (id, status) =>
  api.patch(`/teacher/courses/${id}/status`, null, { params: { status } })

export const deleteCourse = (id) =>
  api.delete(`/courses/${id}`)

export const cancelPendingCourse = (id) =>
  api.patch(`/teacher/courses/${id}/cancel-pending`)

export const unpublishCourse = (id) =>
  api.patch(`/teacher/courses/${id}/unpublish`)

export const republishCourse = (id) =>
  api.patch(`/teacher/courses/${id}/republish`)

// ============================================================
// COURSE EDIT — sections & lessons
// ============================================================

export const getSectionsByCourse = (courseId) =>
  api.get(`/sections/course/${courseId}`)

export const createSection = (data) =>
  api.post('/sections', data)

export const updateSection = (id, data) =>
  api.put(`/sections/${id}`, data)

export const deleteSection = (id) =>
  api.delete(`/sections/${id}`)

export const createLesson = (data) =>
  api.post('/lessons', data)

export const updateLesson = (id, data) =>
  api.put(`/lessons/${id}`, data)

export const deleteLesson = (id) =>
  api.delete(`/lessons/${id}`)

/**
 * Cập nhật thứ tự bài học sau khi drag & drop hoặc chèn giữa
 * @param {Array<{id: number, orderIndex: number}>} lessons
 */
export const reorderLessons = (lessons) =>
  api.patch('/lessons/reorder', { lessons })

/**
 * Cập nhật thứ tự chương sau khi drag & drop
 * @param {Array<{id: number, orderIndex: number}>} sections
 */
export const reorderSections = (sections) =>
  api.patch("/sections/reorder", { sections })

// ============================================================
// STUDENTS
// ============================================================

export const getStudentStats = () =>
  api.get('/teacher/students/stats')

export const getStudents = (params = {}) =>
  api.get('/teacher/students', { params })

// ============================================================
// FINANCE
// ============================================================

export const getFinanceStats = () =>
  api.get('/teacher/finance/stats')

export const getMonthlyRevenue = (months = 7) =>
  api.get('/teacher/finance/monthly', { params: { months } })

export const getRevenueByCourse = () =>
  api.get('/teacher/finance/by-course')

export const getTransactions = (params = {}) =>
  api.get('/teacher/finance/transactions', { params })

/** Số dư khả dụng + bank info — { totalEarned, totalWithdrawn, availableBalance, bankAccountInfo } */
export const getMyBalance = () =>
  api.get('/teacher/finance/balance')

/** Tạo withdrawal request — body: { amount: number } */
export const requestWithdrawal = (amount) =>
  api.post('/teacher/finance/withdraw', { amount })

/** Lịch sử rút tiền — List<WithdrawalResponse> */
export const getMyWithdrawals = () =>
  api.get('/teacher/finance/withdrawals')

/**
 * Cập nhật thông tin ngân hàng — bắt buộc trước khi rút tiền
 * Lưu qua profile chung, serialize thành JSON string theo chuẩn ProfilePage
 * @param {{ bankName: string, bankAccountNumber: string, bankAccountName: string }} data
 */
export const updateBankInfo = async ({ bankName, bankAccountNumber, bankAccountName }) => {
  const res = await api.get('/users/my-profile')
  const profile = res.result ?? res

  return api.put('/users/my-profile', {
    fullName: profile.fullName ?? '',
    bio: profile.bio ?? '',
    avatarUrl: profile.avatarUrl ?? '',
    bankAccountInfo: JSON.stringify({ bankName, bankAccountNumber, bankAccountName }),
  })
}

// ============================================================
// EXERCISES
// ============================================================

export const getExerciseStats = () =>
  api.get('/teacher/exercises/stats')

export const getExercises = (params = {}) =>
  api.get('/teacher/exercises', { params })

// ── Exercise CRUD (Teacher) ───────────────────────────────────

/**
 * Lấy exercise của 1 lesson — dùng để điền form khi teacher bấm "Chỉnh sửa bài tập"
 * Response: ExerciseResponse { id, type, title, description, difficulty, tag,
 *   timeEstimate, language, starterCode, fileName, requirements, questions }
 */
export const getExerciseByLesson = (lessonId) =>
  api.get(`/learning/lessons/${lessonId}/exercise`)

/**
 * Tạo exercise mới cho lesson (lesson phải có type = EXERCISE)
 * @param {number} lessonId
 * @param {ExerciseRequest} data
 */
export const createExercise = (lessonId, data) =>
  api.post(`/teacher/lessons/${lessonId}/exercise`, data)

/**
 * Cập nhật exercise đã tồn tại
 * @param {number} exerciseId
 * @param {ExerciseRequest} data
 */
export const updateExercise = (exerciseId, data) =>
  api.put(`/teacher/exercises/${exerciseId}`, data)

/**
 * Xóa exercise — lesson vẫn còn, chỉ xóa nội dung bài tập
 * @param {number} exerciseId
 */
export const deleteExercise = (exerciseId) =>
  api.delete(`/teacher/exercises/${exerciseId}`)