// src/features/teacher/components/ExerciseFilterBar.jsx
import SearchBar from '../../../shared/components/dashboard-ui/SearchBar'

const TABS = [
  { key: 'all',  label: 'Tất cả'  },
  { key: 'QUIZ', label: 'Trắc nghiệm' },
  { key: 'CODE', label: 'Lập trình' },
]

export default function ExerciseFilterBar({ filter, search, onFilter, onSearch }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      gap: 12,
      borderBottom: '0.5px solid var(--border)',
      flexWrap: 'wrap',
    }}>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {TABS.map((tab) => (
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
              background: filter === tab.key ? 'var(--ink)' : 'transparent',
              color:      filter === tab.key ? '#fff'       : 'var(--ink-3)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SearchBar
        value={search}
        onChange={onSearch}
        placeholder="Tìm theo tên bài tập, khóa học…"
        width={240}
      />
    </div>
  )
}