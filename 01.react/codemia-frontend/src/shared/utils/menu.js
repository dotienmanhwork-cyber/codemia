/**
 * Menu configuration for each role.
 * Each item: { id, label, icon, path, badge? }
 * isDivider: true  → renders a separator
 * isBack: true     → "Back to student view" style
 *
 * NOTE: badge on 'roles' is intentionally omitted here.
 * It is injected dynamically in Sidebar.jsx by fetching
 * the real pending-request count from the API.
 */

/** @type {MenuItem[]} */
export const teacherMenu = [
  { id: 'dashboard', label: 'Bảng điều khiển', icon: 'layout-dashboard', path: '/teacher'           },
  { id: 'courses',   label: 'Khóa học',   icon: 'book',             path: '/teacher/courses'   },
  { id: 'exercises', label: 'Bài tập', icon: 'code',             path: '/teacher/exercises' },
  { id: 'students',  label: 'Học viên',  icon: 'users',            path: '/teacher/students'  },
  { id: 'finance',   label: 'Ví & Thu nhập',   icon: 'wallet',      path: '/teacher/finance'   },
  { isDivider: true },
  { id: 'back', label: 'Quay lại giao diện học viên', icon: 'arrow-left', path: '/', isBack: true },
]

/** @type {MenuItem[]} */
export const adminMenu = [
  { id: 'dashboard', label: 'Bảng điều khiển', icon: 'layout-dashboard', path: '/admin'          },
  { id: 'users',     label: 'Người dùng',     icon: 'users',            path: '/admin/users'    },
  { id: 'roles',     label: 'Phê duyệt giảng viên', icon: 'shield-check',     path: '/admin/roles'    }, // badge injected dynamically
  { id: 'courses',    label: 'Khóa học',    icon: 'book',          path: '/admin/courses'     },
  { id: 'categories',label: 'Danh mục', icon: 'folder',        path: '/admin/categories'  },
  { id: 'finance',   label: 'Tài chính',    icon: 'credit-card',   path: '/admin/finance'     },
  { id: 'ai-config', label: 'Cấu hình AI',  icon: 'cpu',              path: '/admin/ai-config' },
  { isDivider: true },
  { id: 'back', label: 'Quay lại giao diện học viên', icon: 'arrow-left', path: '/', isBack: true },
]

/**
 * @typedef {{ id?: string, label?: string, icon?: string, path?: string, badge?: number, isDivider?: boolean, isBack?: boolean }} MenuItem
 */