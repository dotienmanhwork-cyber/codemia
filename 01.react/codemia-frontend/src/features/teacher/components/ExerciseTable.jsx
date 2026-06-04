// src/features/teacher/components/ExerciseTable.jsx
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge'
import Pagination  from '../../../shared/components/dashboard-ui/Pagination'

const PAGE_SIZE = 7

const typeConfig = {
  QUIZ: { label: 'Trắc nghiệm', variant: 'blue',   icon: 'list-check' },
  CODE: { label: 'Lập trình', variant: 'purple', icon: 'code'        },
}

const difficultyConfig = {
  EASY:   { label: 'Dễ',   variant: 'green' },
  MEDIUM: { label: 'Trung bình', variant: 'amber' },
  HARD:   { label: 'Khó',   variant: 'red'   },
}

const ActBtn = ({ children, variant = 'ghost', onClick }) => {
  const s = {
    ghost:  { background: 'var(--surface)',      color: 'var(--ink-2)',      border: '0.5px solid var(--border)'        },
    purple: { background: 'var(--purple-light)', color: 'var(--purple-dim)', border: '0.5px solid var(--purple-light)'  },
    red:    { background: 'var(--red-bg)',        color: 'var(--red)',        border: '0.5px solid var(--red-bg)'        },
  }
  const h = { ghost: 'var(--border-faint)', purple: '#e8c6ff', red: '#ffc8c4' }
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11, fontWeight: 600, padding: '4px 10px',
        borderRadius: 'var(--radius-xs)', cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.12s', ...s[variant],
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = h[variant])}
      onMouseLeave={(e) => (e.currentTarget.style.background = s[variant].background)}
    >
      {children}
    </button>
  )
}

export default function ExerciseTable({ exercises, loading, page, onPageChange }) {
  const navigate = useNavigate()

  const totalPages = Math.ceil(exercises.length / PAGE_SIZE)
  const paged      = exercises.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleEdit(ex) {
    // Redirect sang Course Edit — tab Bài tập, đúng lesson context
    navigate(`/teacher/courses/${ex.courseId}/edit`)
  }

  if (loading) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--ink-3)' }}>
        <i className="ti ti-loader-2" style={{ fontSize: 22, marginBottom: 8, display: 'block' }} />
        Đang tải…
      </div>
    )
  }

  return (
    <>
      {/* overflow-x: auto theo RESPONSIVE.md */}
      <div style={{ overflowX: 'auto' }}>
        <table className="dt" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th>Tên bài tập</th>
              <th>Khóa học</th>
              <th>Bài học</th>
              <th>Loại</th>
              <th>Lượt nộp</th>
              <th>Độ khó</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '32px 16px' }}>
                  Không tìm thấy bài tập nào
                </td>
              </tr>
            )}
            {paged.map((ex) => {
              const typeCfg = typeConfig[ex.type]   ?? typeConfig.CODE
              const diffCfg = difficultyConfig[ex.difficulty] ?? difficultyConfig.EASY
              return (
                <tr key={ex.id}>
                  {/* Tên */}
                  <td>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{ex.title}</span>
                  </td>

                  {/* Khóa học — ellipsis nếu dài */}
                  <td style={{ fontSize: 12, color: 'var(--ink-2)', maxWidth: 160 }}>
                    <span style={{
                      display: 'block', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {ex.courseName}
                    </span>
                  </td>

                  {/* Bài học */}
                  <td style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {ex.lessonTitle}
                  </td>

                  {/* Loại */}
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i
                        className={`ti ti-${typeCfg.icon}`}
                        style={{ fontSize: 13, color: `var(--${typeCfg.variant === 'blue' ? 'blue' : 'purple-dim'})` }}
                      />
                      <StatusBadge label={typeCfg.label} variant={typeCfg.variant} />
                    </span>
                  </td>

                  {/* Lượt nộp */}
                  <td style={{ color: 'var(--ink-2)', fontSize: 13 }}>
                    {ex.totalSubmissions.toLocaleString()}
                  </td>

                  {/* Độ khó */}
                  <td>
                    <StatusBadge label={diffCfg.label} variant={diffCfg.variant} />
                  </td>

                  {/* Hành động — Sửa redirect sang Course Edit */}
                  <td>
                    <ActBtn variant="purple" onClick={() => handleEdit(ex)}>
                      <i className="ti ti-edit" style={{ fontSize: 11, marginRight: 3 }} />
                      Chỉnh sửa
                    </ActBtn>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </>
  )
}