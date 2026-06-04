// src/features/teacher/components/StudentFilterBar.jsx
import SearchBar from '../../../shared/components/dashboard-ui/SearchBar'

const STATUS_TABS = [
  { key: 'all',          label: 'Tất cả'        },
  { key: 'ACTIVE',       label: 'Đang học'      },
  { key: 'COMPLETED',    label: 'Đã hoàn thành' },
  { key: 'INACTIVE',     label: 'Ngừng học'     },
  { key: 'NOT_STARTED',  label: 'Chưa bắt đầu' },
]

/**
 * Toolbar filter cho trang Học viên.
 *
 * @param {string}   statusFilter  - 'all' | 'ACTIVE' | 'COMPLETED' | 'INACTIVE'
 * @param {string}   courseFilter  - courseId hoặc '' (tất cả)
 * @param {Array}    courses       - list từ GET /api/teacher/courses: [{ id, title }]
 * @param {string}   search        - giá trị ô tìm kiếm
 * @param {Function} onStatus      - (key: string) => void
 * @param {Function} onCourse      - (courseId: string) => void
 * @param {Function} onSearch      - (keyword: string) => void
 */
export default function StudentFilterBar({
  statusFilter,
  courseFilter,
  courses,
  search,
  onStatus,
  onCourse,
  onSearch,
}) {
  return (
    <div className="flex items-center justify-between p-[12px_16px] max-[1023px]:p-[12px_14px] max-[767px]:p-[10px_12px] max-[479px]:p-[8px_10px] gap-3 max-[767px]:gap-2 border-b border-b-[0.5px] border-[var(--border)] flex-wrap">
      {/* Left: tabs + course dropdown */}
      <div className="flex items-center gap-[10px] flex-wrap">

        {/* Status tabs */}
        <div className="flex gap-[4px] flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onStatus(tab.key)}
              className={`px-3 max-[479px]:px-2 py-[5px] min-h-[40px] rounded-[20px] text-xs max-[479px]:text-[11px] font-semibold border-none cursor-pointer font-inherit transition-all duration-120 ${statusFilter === tab.key ? 'bg-[var(--ink)] text-white' : 'bg-transparent text-[var(--ink-3)] hover:bg-black/5'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Course dropdown — dữ liệu từ GET /api/teacher/courses */}
        <select
          value={courseFilter}
          onChange={(e) => onCourse(e.target.value)}
          className="h-8 min-h-[40px] border border-[0.5px] border-[var(--border)] rounded-[var(--radius-sm)] pr-7 pl-2.5 text-xs text-[var(--ink-2)] bg-[var(--surface)] font-inherit cursor-pointer outline-none appearance-none bg-no-repeat bg-[right_8px_center]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2375777a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
        >
          <option value="">Tất cả khóa học</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Right: search */}
      <SearchBar
        value={search}
        onChange={onSearch}
        placeholder="Tìm theo tên, email…"
        width={220}
      />
    </div>
  )
}