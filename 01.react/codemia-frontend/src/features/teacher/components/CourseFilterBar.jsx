// src/features/teacher/components/CourseFilterBar.jsx
import SearchBar from '../../../shared/components/dashboard-ui/SearchBar';

const FILTER_TABS = [
  { key: '',          label: 'Tất cả'        },
  { key: 'PUBLISHED', label: 'Đã xuất bản'  },
  { key: 'UNLISTED',  label: 'Đã ẩn'   },
  { key: 'PENDING',   label: 'Chờ duyệt'    },
  { key: 'DRAFT',     label: 'Bản nháp'      },
  { key: 'REJECTED',  label: 'Từ chối'   },
];

/**
 * @param {string}   filter   - key đang active
 * @param {string}   search   - giá trị ô tìm kiếm
 * @param {Function} onFilter - (key: string) => void
 * @param {Function} onSearch - (val: string) => void
 */
export default function CourseFilterBar({ filter, search, onFilter, onSearch }) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-[10px_14px] max-[479px]:p-[10px_12px] gap-3 max-[479px]:gap-2 border-b border-[var(--border)] flex-wrap max-[479px]:[&>*:last-child]:w-full">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] shrink min-w-0 [&::-webkit-scrollbar]:hidden">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilter(tab.key)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.12s',
              whiteSpace: 'nowrap',
              minHeight: 30,
              background: filter === tab.key ? 'var(--ink)' : 'transparent',
              color:      filter === tab.key ? '#fff'       : 'var(--ink-3)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={onSearch}
        placeholder="Tìm theo tên, danh mục…"
        width={240}
      />
    </div>
  );
}