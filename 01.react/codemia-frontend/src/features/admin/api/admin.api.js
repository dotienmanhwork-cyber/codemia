// src/features/admin/api/admin.api.js
import apiClient from '../../../shared/config/axios'

// ── Dashboard ──────────────────────────────────────────────

export const getDashboardStats = () =>
  apiClient.get('/admin/dashboard/stats')

export const getDashboardRoleRequests = (limit = 5) =>
  apiClient.get('/admin/dashboard/role-requests', { params: { limit } })

// ── Users ──────────────────────────────────────────────────

export const getAdminUsers = (params = {}) =>
  apiClient.get('/admin/users', { params })

/**
 * GET /admin/users/:id
 * @returns { result: { user: UserResponse, roleLogs: RoleChangeLogResponse[] } }
 */
export const getUserDetail = (userId) =>
  apiClient.get(`/admin/users/${userId}`)

export const updateUserStatus = (userId, status) =>
  apiClient.patch(`/admin/users/${userId}/status`, null, { params: { status } })

/**
 * PUT /admin/users/:id/role
 * @param {string} userId
 * @param {string} role  — 'STUDENT' | 'TEACHER'
 * @param {string} [note] — ghi chú tùy chọn, ghi vào audit log
 */
export const updateUserRole = (userId, role, note) =>
  apiClient.put(`/admin/users/${userId}/role`, { role, note })
/**
 * PUT /admin/teachers/:teacherId/block
 * API dành riêng để khóa Teacher (kèm xử lý khóa học & gom tiền vào HOLD)
 */
export const blockTeacher = (teacherId) =>
  apiClient.put(`/admin/teachers/${teacherId}/block`)
  
/**
 * GET /admin/users/:id/downgrade-impact
 * Trả về tác động khi hạ role TEACHER → STUDENT:
 *   { publishedCourses, pendingCourses, draftCourses, pendingWithdrawals, remainingBalance }
 * @returns { result: RoleDowngradeImpactResponse }
 */
export const getDowngradeImpact = (userId) =>
  apiClient.get(`/admin/users/${userId}/downgrade-impact`)

/**
 * POST /admin/users/:id/downgrade
 * Hạ role TEACHER → STUDENT, kèm ghi chú audit log.
 * BE tự xử lý: lock courses, tạo HOLD withdrawal nếu bank null.
 * @param {string} userId
 * @param {string} [note] — lý do hạ role, bắt buộc hiển thị cho admin nhập
 * @returns { result: { user: UserResponse } }
 */
export const downgradeUserRole = (userId, note) =>
  apiClient.post(`/admin/users/${userId}/downgrade`, note ? { note } : {})

export const deleteUser = (userId) =>
  apiClient.delete(`/admin/users/${userId}`)

// ── Roles ──────────────────────────────────────────────────

export const getRoleRequests = () =>
  apiClient.get('/admin/roles/requests')

export const approveRoleRequest = (userId) =>
  apiClient.patch(`/admin/roles/${userId}/approve`)

export const declineRoleRequest = (userId, reason) =>
  apiClient.patch(`/admin/roles/${userId}/decline`, reason ? { reason } : {})

// ── Finance ────────────────────────────────────────────────

export const getFinanceStats = () =>
  apiClient.get('/admin/finance/stats')

export const getFinanceMonthly = (months = 6) =>
  apiClient.get('/admin/finance/monthly', { params: { months } })

export const getTeacherPayouts = (month) =>
  apiClient.get('/admin/finance/teacher-payouts', { params: month ? { month } : {} })

/**
 * GET /admin/finance/withdrawal-requests?status=PENDING|APPROVED|REJECTED|HOLD&page=1&size=20
 * @param {string} [status] — bỏ trống để lấy tất cả
 * @param {number} [page]   — 1-indexed, default 1
 * @param {number} [size]   — default 20
 * @returns Page<WithdrawalResponse>
 */
export const getWithdrawalRequests = (status, page = 1, size = 10) =>
  apiClient.get('/admin/finance/withdrawal-requests', {
    params: {
      ...(status && status !== 'ALL' ? { status } : {}),
      page,
      size,
    },
  })

/**
 * PATCH /admin/finance/withdrawal-requests/:id/approve
 */
export const approveWithdrawal = (id) =>
  apiClient.patch(`/admin/finance/withdrawal-requests/${id}/approve`)

/**
 * PATCH /admin/finance/withdrawal-requests/:id/reject
 * @param {number} id
 * @param {string} [note] — lý do từ chối, không bắt buộc
 */
export const rejectWithdrawal = (id, note) =>
  apiClient.patch(`/admin/finance/withdrawal-requests/${id}/reject`, note ? { note } : {})

/**
 * POST /admin/finance/withdrawal-requests/:id/remind
 * Gửi notification nhắc teacher cập nhật bank info.
 * Chỉ áp dụng cho HOLD withdrawal chưa có bankSnapshot.
 * @param {number} id
 */
export const remindWithdrawal = (id) =>
  apiClient.post(`/admin/finance/withdrawal-requests/${id}/remind`)

/**
 * PUT /admin/finance/withdrawal-requests/:id/complete
 * Admin đánh dấu lệnh HOLD là đã xử lý thủ công xong → APPROVED.
 * @param {number} id
 * @param {string} [note] — ghi chú của admin
 */
export const completeHoldWithdrawal = (id, note) =>
  apiClient.put(`/admin/finance/withdrawal-requests/${id}/complete`, note ? { note } : {})

// ── Courses ────────────────────────────────────────────────

export const getAdminCourses = (params = {}) =>
  apiClient.get('/admin/courses', { params })

export const getAdminCourseDetail = (id) =>
  apiClient.get(`/admin/courses/${id}`)

export const updateAdminCourseStatus = (id, body) =>
  apiClient.patch(`/admin/courses/${id}/status`, body)

export const deleteAdminCourse = (id) =>
  apiClient.delete(`/admin/courses/${id}`)

// ── Lessons ────────────────────────────────────────────────

export const getAdminLessonDetail = (lessonId) =>
  apiClient.get(`/admin/lessons/${lessonId}`)

// ── Categories ─────────────────────────────────────────────

export const getAdminCategories = () =>
  apiClient.get('/categories')

export const getCategoryUsage = (id) =>
  apiClient.get(`/categories/${id}/usage`)

export const createCategory = (body) =>
  apiClient.post('/categories', body)

export const updateCategory = (id, body) =>
  apiClient.put(`/categories/${id}`, body)

/**
 * DELETE /categories/:id
 * @param {number} id
 * @param {{ targetCategoryId: number } | undefined} body
 *   — nếu category có courses, truyền targetCategoryId để reassign trước khi xóa
 */
export const deleteCategory = (id, body) =>
  body
    ? apiClient.delete(`/categories/${id}`, { data: body })
    : apiClient.delete(`/categories/${id}`)

// ── AI Configuration & Cache ───────────────────────────────

/** GET /admin/ai/providers → AiProviderStatusResponse[] */
export const getAiProviders = () =>
  apiClient.get('/admin/ai/providers')

/** GET /admin/ai/config → AiFeatureConfigResponse[] */
export const getAiConfig = () =>
  apiClient.get('/admin/ai/config')

/**
 * PUT /admin/ai/config/{feature}
 * @param {string} feature  — e.g. 'LESSON_SUMMARY'
 * @param {object} body     — AiFeatureConfigUpdateRequest
 *   { providerOrder: string[], enabled: boolean }
 */
export const updateAiFeatureConfig = (feature, body) =>
  apiClient.put(`/admin/ai/config/${feature}`, body)

/** POST /admin/ai/config/reset → reset all features to default */
export const resetAiConfig = () =>
  apiClient.post('/admin/ai/config/reset')

/**
 * GET /admin/ai/cache/summary?courseId={courseId}
 * @param {string|number} [courseId] — optional filter
 */
export const getAiCacheSummary = (courseId) =>
  apiClient.get('/admin/ai/cache/summary', {
    params: courseId ? { courseId } : {},
  })

/**
 * DELETE /admin/ai/cache/summary/{lessonId}
 * Xóa cache của 1 lesson cụ thể
 */
export const deleteAiCacheByLesson = (lessonId) =>
  apiClient.delete(`/admin/ai/cache/summary/${lessonId}`)

/**
 * DELETE /admin/ai/cache/summary/course/{courseId}
 * Xóa toàn bộ cache của 1 course
 */
export const deleteAiCacheByCourse = (courseId) =>
  apiClient.delete(`/admin/ai/cache/summary/course/${courseId}`)

// ── Refunds ────────────────────────────────────────────────

/**
 * GET /admin/refunds?status=WAITING_BANK_INFO|PENDING|COMPLETED|CANCELLED&page=1&size=20
 * @param {string} [status] — bỏ trống để lấy tất cả
 * @param {number} [page]   — 1-indexed, default 1
 * @param {number} [size]   — default 20
 * @returns Page<RefundResponse>
 */
export const getRefunds = (status, page = 1, size = 10) =>
  apiClient.get('/admin/finance/refunds', {
    params: {
      ...(status && status !== 'ALL' ? { status } : {}),
      page,
      size,
    },
  })

/**
 * PUT /admin/finance/refunds/:id/complete
 * Admin mark đã chuyển khoản xong, kèm ghi chú.
 * @param {string} id
 * @param {string} [note] — ghi chú của admin
 */
export const completeRefund = (id, note) =>
  apiClient.put(`/admin/finance/refunds/${id}/complete`, note ? { note } : {})

/**
 * PUT /admin/finance/refunds/:id/cancel
 * Huỷ refund request.
 * @param {string} id
 */
export const cancelRefund = (id) =>
  apiClient.put(`/admin/finance/refunds/${id}/cancel`)

/**
 * POST /admin/finance/refunds/:id/remind
 * Gửi lại notification cho student chưa có bank info.
 * @param {string} id
 */
export const remindRefund = (id) =>
  apiClient.post(`/admin/finance/refunds/${id}/remind`)