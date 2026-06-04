// src/features/admin/pages/AdminUsers.jsx
import { useState, useEffect, useCallback, useContext } from 'react'
import { DashboardSearchContext } from '@/layouts/DashboardLayout'
import toast from 'react-hot-toast' // 👈 Import thư viện Toast để thông báo theo Spec
import PageHeader    from '../../../shared/components/dashboard-ui/PageHeader'
import ConfirmModal  from '../../../shared/components/dashboard-ui/ConfirmModal'
import UserTable     from '../components/UserTable'
import { getAdminUsers, updateUserStatus, deleteUser, blockTeacher } from '../api/admin.api'

const PAGE_SIZE = 10

// ── Bảng map mã lỗi sang thông báo Tiếng Việt (Mục 3 trong Spec) ──
const DELETE_ERROR_MESSAGES = {
  1034: "Không thể xóa người dùng này vì giảng viên đã có khóa học trên hệ thống không thể xóa.",
  1035: "Không thể xóa người dùng này vì học viên đã đăng ký một khóa học không thể xóa.",
  1005: "Không thể xóa tài khoản Admin.",
  TEACHER_HAS_COURSES: "Không thể xóa người dùng này vì giảng viên đã có khóa học trên hệ thống không thể xóa.",
  STUDENT_HAS_ENROLLMENTS: "Không thể xóa người dùng này vì học viên đã đăng ký một khóa học không thể xóa.",
}

/* ── Confirm modal metadata (Đã dịch 100% sang Tiếng Việt chuẩn UX Spec) ── */
function confirmMeta(action, user) {
  const name = user?.fullName ?? user?.email ?? ''
  return {
    lock: {
      title: `Khóa tài khoản ${name}?`,
      description: 'Người dùng này sẽ không thể tiếp tục đăng nhập vào hệ thống.',
      confirmLabel: 'Khóa tài khoản',
      danger: true,
    },
    unlock: {
      title: `Mở khóa tài khoản ${name}?`,
      description: 'Người dùng này sẽ khôi phục lại toàn bộ quyền truy cập hệ thống.',
      confirmLabel: 'Mở khóa',
      danger: false,
    },
    // Khớp yêu cầu "Bạn có chắc muốn xóa [tên user]?" của mục 4 trong Spec
    delete: {
      title: `Bạn có chắc muốn xóa ${name}?`,
      description: 'Hành động này là vĩnh viễn và hoàn toàn không thể hoàn tác.',
      confirmLabel: 'Xóa người dùng',
      danger: true,
    },
  }[action]
}

/* ══════════════════════════════════════════════
   AdminUsers Component
══════════════════════════════════════════════ */
export default function AdminUsers() {
  /* ── Data state ── */
  const [users,         setUsers]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [totalPages,    setTotalPages]    = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  /* ── Filter / Pagination state ── */
  const [page,    setPage]    = useState(1)
  const { keyword, setKeyword } = useContext(DashboardSearchContext)

  /* ── Interaction state ── */
  const [confirmDialog, setConfirmDialog] = useState(null) // { user, action }
  const [confirmLoading, setConfirmLoading] = useState(false)

  /* ── API Action: Fetch users list ── */
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminUsers({ page, size: PAGE_SIZE, keyword })
      // BE trả về { code, result: { content, totalPages, totalElements } }
      // Axios interceptor unwrap thành response.data nên res = { code, result }
      const data = res.result ?? res
      setUsers(data.content ?? [])
      setTotalPages(data.totalPages ?? 1)
      setTotalElements(data.totalElements ?? 0)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      toast.error('Không thể tải danh sách người dùng.')
    } finally {
      setLoading(false)
    }
  }, [page, keyword])

  // Trích xuất dữ liệu khi thay đổi trang hoặc từ khóa tìm kiếm
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  /* ── Helper: Open confirmation dialog ── */
  function openConfirm(user, action) {
    setConfirmDialog({ user, action })
  }

  /* ── API Action: Handle confirm logic (Mục 4 trong Spec) ── */
  async function handleConfirm() {
  if (!confirmDialog) return
  const { user, action } = confirmDialog
  setConfirmLoading(true)
  
  try {
    if (action === 'lock') {
      // 🌟 Kiểm tra nếu đối tượng bị khóa là Giảng viên thì gọi API chuyên biệt
      if (user.role === 'TEACHER') {
        await blockTeacher(user.id)
      } else {
        await updateUserStatus(user.id, 'BLOCKED')
      }
      toast.success(`Đã khóa tài khoản ${user.email} thành công.`)
    } else if (action === 'unlock') {
      await updateUserStatus(user.id, 'ACTIVE')
      toast.success(`Đã mở khóa tài khoản ${user.email} thành công.`)
    } else if (action === 'delete') {
      const response = await deleteUser(user.id)
      
      if (response?.code && response.code !== 1000) {
        const errorMsg = DELETE_ERROR_MESSAGES[response.code] || "Xóa người dùng thất bại."
        toast.error(errorMsg)
        setConfirmDialog(null) // 🌟 Thêm dòng này để tự động đóng modal khi lỗi code bên trong body
        return
      }

      toast.success("Đã xóa người dùng thành công.")
      
      if (users.length === 1 && page > 1) {
        setPage((p) => p - 1)
      }
    }
    
    fetchUsers()
    setConfirmDialog(null) // Thành công: Đóng modal
  } catch (err) {
    console.error('Action error:', err)
    
    if (action === 'delete') {
      const errorCode = err.response?.data?.code ?? err?.code
      const errorMsg = DELETE_ERROR_MESSAGES[errorCode] || err.response?.data?.message || "Có lỗi xảy ra, không thể xóa người dùng."
      toast.error(errorMsg)
    } else {
      toast.error("Thực hiện thao tác thất bại.")
    }
    setConfirmDialog(null) // 🌟 Thêm dòng này để tự động đóng modal khi API bị crash/lỗi mạng (catch)
  } finally {
    setConfirmLoading(false)
  }
}

  const meta = confirmDialog ? confirmMeta(confirmDialog.action, confirmDialog.user) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Page Header ── */}
      <PageHeader
        title="Quản lý người dùng"
        subtitle={`Quản lý danh sách thành viên hệ thống (${totalElements} người dùng)`}
        
      />

      {/* ── Table Card hiển thị dữ liệu ── */}
      <UserTable
        users={users}
        loading={loading}
        totalElements={totalElements}
        totalPages={totalPages}
        page={page}
        keyword={keyword}
        onKeywordChange={setKeyword}
        onPageChange={setPage}
        onLock={(u)   => openConfirm(u, 'lock')}
        onUnlock={(u) => openConfirm(u, 'unlock')}
        onDelete={(u) => openConfirm(u, 'delete')}
      />

      {/* ── Confirm Modal dùng chung cho Lock/Unlock/Delete ── */}
      {confirmDialog && meta && (
        <ConfirmModal
          open
          onClose={() => !confirmLoading && setConfirmDialog(null)}
          onConfirm={handleConfirm}
          title={meta.title}
          description={meta.description}
          confirmLabel={meta.confirmLabel}
          danger={meta.danger}
          loading={confirmLoading}
        />
      )}
    </div>
  )
}