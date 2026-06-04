// src/features/admin/pages/AdminCourseDetail.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader  from '../../../shared/components/dashboard-ui/PageHeader'
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge'
import {
  getAdminCourseDetail,
  updateAdminCourseStatus,
  getAdminLessonDetail,
} from '../api/admin.api'

/* ── Helpers ── */
const STATUS_VARIANT = {
  PUBLISHED: 'green',
  PENDING:   'amber',
  DRAFT:     'neutral',
  REJECTED:  'red',
  SUSPENDED: 'red',
}

const STATUS_LABEL = {
  PUBLISHED: 'Đã xuất bản',
  PENDING:   'Chờ duyệt',
  DRAFT:     'Bản nháp',
  REJECTED:  'Đã từ chối',
  SUSPENDED: 'Đã khóa',
}

const DIFFICULTY_LABEL = {
  EASY:   'Dễ',
  MEDIUM: 'Trung bình',
  HARD:   'Khó',
}

function fmtPrice(vnd) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vnd)
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDuration(seconds) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m >= 60) {
    const h   = Math.floor(m / 60)
    const rem = m % 60
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`
  }
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`
  return `${s}s`
}

/* ── ActBtn ── */
const ActBtn = ({ children, variant = 'ghost', onClick, disabled }) => {
  const s = {
    dark:  { background: 'var(--ink)',     color: '#fff',          border: 'none'                        },
    ghost: { background: 'var(--surface)', color: 'var(--ink-2)',  border: '0.5px solid var(--border)'   },
    red:   { background: 'var(--red-bg)',  color: 'var(--red)',    border: '0.5px solid var(--red-bg)'   },
    green: { background: 'var(--green-bg)',color: 'var(--green)',  border: '0.5px solid var(--green-bg)' },
  }
  const h = { dark: '#2d2f31', ghost: 'var(--border-faint)', red: '#ffc8c4', green: '#d5ecc4' }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12.5, fontWeight: 600, padding: '7px 14px',
        borderRadius: 'var(--radius-sm)', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', transition: 'all 0.12s',
        opacity: disabled ? 0.5 : 1,
        ...s[variant],
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = h[variant])}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = s[variant].background)}
    >
      {children}
    </button>
  )
}

/* ── DiffRow ── */
function DiffRow({ label, oldVal, newVal, isLongText }) {
  const isChanged = oldVal !== newVal;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '120px 1fr',
      alignItems: isLongText ? 'flex-start' : 'center',
      padding: isChanged ? '12px 16px' : '8px 16px',
      background: isChanged ? 'var(--surface-faint, #fafafa)' : 'transparent',
      borderRadius: 'var(--radius-sm)',
      border: isChanged ? '0.5px solid var(--border)' : 'none',
      transition: 'all 0.15s ease',
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>
        {label}
      </span>
      <div>
        {!isChanged ? (
          <span style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>
            (không đổi)
          </span>
        ) : isLongText ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              background: 'var(--red-bg, #fff3f3)',
              color: 'var(--red, #d32f2f)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              borderLeft: '4px solid var(--red, #d32f2f)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, opacity: 0.8, letterSpacing: '0.05em' }}>
                Bản đã xuất bản
              </div>
              {oldVal || '—'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--ink-3)', padding: '2px 0' }}>
              <i className="ti ti-arrow-down" style={{ fontSize: 16 }} />
            </div>
            <div style={{
              background: 'var(--green-bg, #e8f5e9)',
              color: 'var(--green, #2e7d32)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              borderLeft: '4px solid var(--green, #2e7d32)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, opacity: 0.8, letterSpacing: '0.05em' }}>
                Bản cập nhật
              </div>
              {newVal || '—'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{
              background: 'var(--red-bg, #fff3f3)',
              color: 'var(--red, #d32f2f)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              textDecoration: 'line-through',
            }}>
              {oldVal}
            </span>
            <span style={{ color: 'var(--ink-3)', fontWeight: 700, fontSize: 14 }}>──►</span>
            <span style={{
              background: 'var(--green-bg, #e8f5e9)',
              color: 'var(--green, #2e7d32)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 600,
            }}>
              {newVal}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Comparison Diff Panel ── */
function CourseDiffPanel({ course }) {
  if (course.submissionType !== 'EDIT') return null;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      marginBottom: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--purple-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--purple-dim)',
        }}>
          <i className="ti ti-git-compare" style={{ fontSize: 16 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
            Nội dung thay đổi xét duyệt
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            So sánh các thông tin nhạy cảm của bản cập nhật với bản đã xuất bản trước đó.
          </span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingTop: 8,
        borderTop: '0.5px solid var(--border-faint)',
      }}>
        <DiffRow
          label="Tiêu đề"
          oldVal={course.oldTitle}
          newVal={course.title}
        />
        <DiffRow
          label="Giá"
          oldVal={fmtPrice(course.oldPrice)}
          newVal={fmtPrice(course.price)}
        />
        <DiffRow
          label="Mô tả"
          oldVal={course.oldDescription}
          newVal={course.description}
          isLongText
        />
      </div>
    </div>
  );
}


/* ── RejectModal ── */
function RejectModal({ onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('')
  const valid = reason.trim().length > 0

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '0.5px solid var(--border)',
        padding: 24, width: '100%', maxWidth: 440,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>
          Từ chối khóa học
        </h3>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 16px' }}>
          Cung cấp lý do để giảng viên biết cần cải thiện điều gì.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
            Lý do <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Nội dung chưa đầy đủ, thiếu phần tổng quan…"
            rows={4}
            style={{
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              fontSize: 13, color: 'var(--ink)',
              fontFamily: 'inherit', resize: 'vertical',
              background: 'var(--bg)', outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--red)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,0,10,0.08)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <ActBtn variant="ghost" onClick={onClose} disabled={loading}>Hủy</ActBtn>
          <ActBtn
            variant="red"
            onClick={() => onConfirm(reason.trim())}
            disabled={!valid || loading}
          >
            {loading && <i className="ti ti-loader-2" style={{ fontSize: 13 }} />}
            Từ chối khóa học
          </ActBtn>
        </div>
      </div>
    </div>
  )
}

/* ── PreviewModal — full content preview cho từng lesson ── */
function PreviewModal({ lesson, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Fetch lesson detail khi mở modal — lấy videoUrl, aiSummaryCache, transcript
  useEffect(() => {
    if (!lesson) return
    setDetail(null)
    setLoadingDetail(true)
    getAdminLessonDetail(lesson.id)
      .then((res) => setDetail(res.result))
      .catch((err) => console.error('Failed to load lesson detail', err))
      .finally(() => setLoadingDetail(false))
  }, [lesson?.id])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!lesson) return null

  // Dùng detail nếu đã fetch xong, fallback về lesson (có title, type)
  const data       = detail ?? lesson
  const isVideo    = lesson.type === 'VIDEO'
  const isExercise = lesson.type === 'EXERCISE'
  const isText     = lesson.type === 'TEXT'

  /* Extract embed URL — hỗ trợ cả YouTube và Vimeo */
  function getEmbedUrl(url) {
    if (!url) return null
    // YouTube: youtube.com/watch?v=ID hoặc youtu.be/ID
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    // Vimeo: vimeo.com/ID hoặc player.vimeo.com/video/ID
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?badge=0&autopause=0&player_id=0&app_id=58479`
    return null
  }
  const embedUrl = isVideo ? getEmbedUrl(data.videoUrl) : null

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '0.5px solid var(--border)',
        width: '100%', maxWidth: 720,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '0.5px solid var(--border)',
          flexShrink: 0,
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <i
              className={`ti ti-${isVideo ? 'player-play' : isText ? 'file-text' : 'code'}`}
              style={{
                fontSize: 15, flexShrink: 0,
                color: isVideo ? 'var(--blue)' : isText ? 'var(--ink-2)' : 'var(--purple-dim)',
              }}
            />
            <span style={{
              fontSize: 14, fontWeight: 700, color: 'var(--ink)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {lesson.title}
            </span>
            <span style={{
              fontSize: 10.5, fontWeight: 600, padding: '2px 7px',
              borderRadius: 99, flexShrink: 0,
              background: isVideo ? 'var(--blue-bg)' : isText ? 'var(--border-faint)' : 'var(--purple-light)',
              color:      isVideo ? 'var(--blue)'    : isText ? 'var(--ink-2)' : 'var(--purple-dim)',
            }}>
              {isVideo ? 'Video' : isText ? 'Văn bản' : 'Bài tập'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 6,
              border: '0.5px solid var(--border)',
              background: 'var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, color: 'var(--ink-3)',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-faint)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
          >
            <i className="ti ti-x" style={{ fontSize: 14 }} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── VIDEO ── */}
            {isVideo && (
              <>
                {/* Video player */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                    Video
                  </p>
                  {embedUrl ? (
                    <div style={{
                      position: 'relative', paddingBottom: '56.25%', height: 0,
                      borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                      background: '#000',
                      border: '0.5px solid var(--border)',
                    }}>
                      <iframe
                        src={embedUrl}
                        title={data.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                      />
                    </div>
                  ) : data.videoUrl ? (
                    <div style={{
                      background: 'var(--border-faint)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 10,
                      border: '0.5px solid var(--border)',
                    }}>
                      <i className="ti ti-link" style={{ fontSize: 15, color: 'var(--ink-3)' }} />
                      <a
                        href={data.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 13, color: 'var(--blue)', wordBreak: 'break-all' }}
                      >
                        {lesson.videoUrl}
                      </a>
                    </div>
                  ) : (
                    <div style={{
                      background: 'var(--border-faint)', borderRadius: 'var(--radius-sm)',
                      padding: '24px', textAlign: 'center',
                      color: 'var(--ink-3)', fontSize: 13,
                      border: '0.5px solid var(--border)',
                    }}>
                      Chưa có URL video
                    </div>
                  )}
                </div>

                {/* AI Summary */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                    Tóm tắt AI
                  </p>
                  {loadingDetail ? (
                    <div style={{
                      background: 'var(--border-faint)', borderRadius: 'var(--radius-sm)',
                      padding: '14px 16px', fontSize: 13,
                      color: 'var(--ink-3)', fontStyle: 'italic',
                      border: '0.5px solid var(--border)',
                    }}>
                      Đang tải...
                    </div>
                  ) : data.aiSummaryCache ? (
                    <div style={{
                      background: 'var(--bg)',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 16px',
                      fontSize: 13, color: 'var(--ink-2)',
                      lineHeight: 1.75,
                      whiteSpace: 'pre-wrap',
                      maxHeight: 240,
                      overflowY: 'auto',
                    }}>
                      {data.aiSummaryCache}
                    </div>
                  ) : (
                    <div style={{
                      background: 'var(--border-faint)', borderRadius: 'var(--radius-sm)',
                      padding: '14px 16px', fontSize: 13,
                      color: 'var(--ink-3)', fontStyle: 'italic',
                      border: '0.5px solid var(--border)',
                    }}>
                      Chưa có AI summary cho bài học này.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── TEXT ── */}
            {isText && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                  Nội dung bài học dạng Văn bản
                </p>
                {loadingDetail ? (
                  <div style={{
                    background: 'var(--border-faint)', borderRadius: 'var(--radius-sm)',
                    padding: '14px 16px', fontSize: 13,
                    color: 'var(--ink-3)', fontStyle: 'italic',
                    border: '0.5px solid var(--border)',
                  }}>
                    Đang tải...
                  </div>
                ) : (
                  <div 
                    className="codemia-prose"
                    style={{
                      background: 'var(--bg)',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '20px 24px',
                      maxHeight: '500px',
                      overflowY: 'auto',
                      outline: 'none',
                    }}
                    dangerouslySetInnerHTML={{ __html: data.content || '<p style="color: var(--ink-3); font-style: italic;">Bài học này chưa có nội dung văn bản.</p>' }}
                  />
                )}
              </div>
            )}

            {/* ── EXERCISE — loading ── */}
            {isExercise && loadingDetail && (
              <div style={{
                background: 'var(--border-faint)', borderRadius: 'var(--radius-sm)',
                padding: '24px', textAlign: 'center',
                color: 'var(--ink-3)', fontSize: 13, fontStyle: 'italic',
                border: '0.5px solid var(--border)',
              }}>
                Đang tải nội dung bài tập...
              </div>
            )}

            {/* ── EXERCISE — QUIZ type ── */}
            {isExercise && !loadingDetail && data.exercises?.filter(ex => ex.type === 'QUIZ').map((ex, exi) => (
              <div key={ex.id ?? exi} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Exercise meta */}
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--bg)', border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  {ex.title && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', flex: 1 }}>
                      {ex.title}
                    </span>
                  )}
                  {ex.difficulty && (
                    <span style={{
                      fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: ex.difficulty === 'EASY' ? 'var(--green-bg)' : ex.difficulty === 'HARD' ? 'var(--red-bg)' : 'var(--amber-bg, #fff8e1)',
                      color:      ex.difficulty === 'EASY' ? 'var(--green)'    : ex.difficulty === 'HARD' ? 'var(--red)'    : '#b45309',
                    }}>
                      {DIFFICULTY_LABEL[ex.difficulty] ?? ex.difficulty}
                    </span>
                  )}
                  {ex.maxScore != null && (
                    <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                      {ex.maxScore} điểm
                    </span>
                  )}
                  {ex.time && (
                    <span style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="ti ti-clock" style={{ fontSize: 12 }} />
                      {ex.time} phút
                    </span>
                  )}
                </div>

                {/* Description */}
                {ex.description && (
                  <div style={{
                    fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7,
                    padding: '10px 14px',
                    background: 'var(--bg)', border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    {ex.description}
                  </div>
                )}

                {/* Questions */}
                {ex.questions && ex.questions.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                      Câu hỏi ({ex.questions.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {ex.questions.map((q, qi) => {
                        // BE trả về dạng {questionText, optionA, optionB, optionC, optionD}
                        const opts = [
                          { label: 'A', text: q.optionA },
                          { label: 'B', text: q.optionB },
                          { label: 'C', text: q.optionC },
                          { label: 'D', text: q.optionD },
                        ].filter(o => o.text)
                        return (
                          <div
                            key={q.id ?? qi}
                            style={{
                              border: '0.5px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                            }}
                          >
                            {/* Question header */}
                            <div style={{
                              background: 'var(--bg)',
                              padding: '11px 14px',
                              borderBottom: '0.5px solid var(--border-faint)',
                              display: 'flex', gap: 8, alignItems: 'flex-start',
                            }}>
                              <span style={{
                                fontSize: 10.5, fontWeight: 700, color: 'var(--purple-dim)',
                                background: 'var(--purple-light)',
                                padding: '1px 7px', borderRadius: 99, flexShrink: 0, marginTop: 1,
                              }}>
                                Q{qi + 1}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.5 }}>
                                {q.questionText ?? q.content}
                              </span>
                            </div>

                            {/* Options A/B/C/D */}
                            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                              {opts.map((opt) => (
                                <div
                                  key={opt.label}
                                  style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 8,
                                    padding: '7px 10px',
                                    borderRadius: 'var(--radius-xs)',
                                    border: '0.5px solid var(--border-faint)',
                                  }}
                                >
                                  <span style={{
                                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                    border: '1.5px solid var(--border)',
                                    background: 'var(--bg)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, fontWeight: 700, color: 'var(--ink-3)',
                                    marginTop: 1,
                                  }}>
                                    {opt.label}
                                  </span>
                                  <span style={{ fontSize: 13, color: 'var(--ink-2)', flex: 1, lineHeight: 1.5 }}>
                                    {opt.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* ── EXERCISE — CODE type ── */}
            {isExercise && !loadingDetail && data.exercises?.filter(ex => ex.type === 'CODE').map((ex, exi) => (
              <div key={ex.id ?? exi} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Meta */}
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--bg)', border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  {ex.title && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', flex: 1 }}>{ex.title}</span>
                  )}
                  {ex.language && (
                    <span style={{
                      fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: 'var(--blue-bg)', color: 'var(--blue)',
                    }}>
                      {ex.language}
                    </span>
                  )}
                  {ex.difficulty && (
                    <span style={{
                      fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: ex.difficulty === 'EASY' ? 'var(--green-bg)' : ex.difficulty === 'HARD' ? 'var(--red-bg)' : 'var(--amber-bg, #fff8e1)',
                      color:      ex.difficulty === 'EASY' ? 'var(--green)'    : ex.difficulty === 'HARD' ? 'var(--red)'    : '#b45309',
                    }}>
                      {DIFFICULTY_LABEL[ex.difficulty] ?? ex.difficulty}
                    </span>
                  )}
                </div>

                {/* Description */}
                {ex.description && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                      Đề bài
                    </p>
                    <div style={{
                      background: 'var(--bg)', border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                      fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap',
                    }}>
                      {ex.description}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {ex.requirements && ex.requirements.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                      Yêu cầu ({ex.requirements.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {ex.requirements.map((req, ri) => (
                        <div key={ri} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 8,
                          padding: '7px 12px',
                          border: '0.5px solid var(--border-faint)',
                          borderRadius: 'var(--radius-xs)',
                        }}>
                          <i className="ti ti-point-filled" style={{ fontSize: 8, color: 'var(--ink-3)', marginTop: 5, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Starter code */}
                {ex.starterCode && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                      Starter Code
                    </p>
                    <pre style={{
                      background: '#1e1e2e', color: '#cdd6f4',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                      fontSize: 12.5, fontFamily: 'monospace',
                      overflowX: 'auto', margin: 0,
                      maxHeight: 240, overflowY: 'auto',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    }}>
                      {ex.starterCode}
                    </pre>
                  </div>
                )}
              </div>
            ))}

            {/* Fallback nếu exercise không có data */}
            {isExercise && !loadingDetail && (!data.exercises || data.exercises.length === 0) && (
              <div style={{
                background: 'var(--border-faint)', borderRadius: 'var(--radius-sm)',
                padding: '24px', textAlign: 'center',
                color: 'var(--ink-3)', fontSize: 13,
                border: '0.5px solid var(--border)',
              }}>
                Chưa có nội dung bài tập.
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

/* ── SectionRow — expand/collapse ── */
function SectionRow({ section, index, onPreview }) {
  const [open, setOpen] = useState(true)

  const lessonCount   = section.lessons.length
  const totalSeconds  = section.lessons.reduce((sum, l) => sum + (l.duration || 0), 0)

  return (
    <div style={{ borderBottom: '0.5px solid var(--border-faint)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 16px', background: '#fafafa',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'background 0.12s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-faint)'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#fafafa'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{
            width: 20, height: 20, borderRadius: 4,
            background: 'var(--purple-light)', color: 'var(--purple-dim)',
            fontSize: 10.5, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {index + 1}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 700, color: 'var(--ink)', textAlign: 'left',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {section.title}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)', flexShrink: 0 }}>
            {lessonCount} bài học
            {totalSeconds > 0 && ` · ${fmtDuration(totalSeconds)}`}
          </span>
        </div>
        <i
          className={`ti ti-chevron-${open ? 'up' : 'down'}`}
          style={{ fontSize: 14, color: 'var(--ink-3)', flexShrink: 0 }}
        />
      </button>
      {open && (
        <div style={{ padding: '4px 16px 12px' }}>
          {section.lessons.map((lesson) => (
            <div
              key={lesson.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: '0.5px solid var(--border-faint)',
              }}
            >
              <i
                className={`ti ti-${lesson.type === 'VIDEO' ? 'player-play' : lesson.type === 'TEXT' ? 'file-text' : 'code'}`}
                style={{
                  fontSize: 13, flexShrink: 0,
                  color: lesson.type === 'VIDEO' ? 'var(--blue)' : lesson.type === 'TEXT' ? 'var(--ink-2)' : 'var(--purple-dim)',
                }}
              />
              {/* Title — truncate trên mobile */}
              <span style={{
                fontSize: 13, color: 'var(--ink)', flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                minWidth: 0,
              }}>
                {lesson.title}
              </span>

              {/* Type badge — ẩn trên mobile nhỏ */}
              <span className="hide-mobile-sm" style={{
                fontSize: 11, fontWeight: 600, padding: '2px 7px',
                borderRadius: 99, flexShrink: 0,
                background: lesson.type === 'VIDEO' ? 'var(--blue-bg)' : lesson.type === 'TEXT' ? 'var(--border-faint)' : 'var(--purple-light)',
                color:      lesson.type === 'VIDEO' ? 'var(--blue)'    : lesson.type === 'TEXT' ? 'var(--ink-2)' : 'var(--purple-dim)',
              }}>
                {lesson.type === 'VIDEO' ? 'Video' : lesson.type === 'TEXT' ? 'Văn bản' : 'Bài tập'}
              </span>

              {/* Duration */}
              {lesson.duration > 0 && (
                <span style={{
                  fontSize: 11.5, color: 'var(--ink-3)',
                  flexShrink: 0, minWidth: 28, textAlign: 'right',
                }}>
                  {fmtDuration(lesson.duration)}
                </span>
              )}

              {/* Preview button */}
              <button
                onClick={() => onPreview(lesson)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 600, padding: '4px 9px',
                  borderRadius: 'var(--radius-xs)',
                  border: '0.5px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--ink-2)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  flexShrink: 0, whiteSpace: 'nowrap',
                  transition: 'all 0.12s',
                  minHeight: 28,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--ink)'
                  e.currentTarget.style.color = '#fff'
                  e.currentTarget.style.borderColor = 'var(--ink)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--surface)'
                  e.currentTarget.style.color = 'var(--ink-2)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
              >
                <i className="ti ti-eye" style={{ fontSize: 12 }} />
                <span className="hide-mobile-sm">Xem trước</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   AdminCourseDetail
══════════════════════════════════════════════ */
export default function AdminCourseDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [course,        setCourse]        = useState(null)
  const [loadingPage,   setLoadingPage]   = useState(true)
  const [rejectOpen,    setRejectOpen]    = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [previewLesson, setPreviewLesson] = useState(null)

  /* ── Fetch detail ── */
  useEffect(() => {
    async function load() {
      setLoadingPage(true)
      try {
        const res = await getAdminCourseDetail(id)
        setCourse(res.result)
      } catch (err) {
        console.error('Failed to load course', err)
      } finally {
        setLoadingPage(false)
      }
    }
    load()
  }, [id])

  /* ── Approve ── */
  async function handleApprove() {
    setActionLoading(true)
    try {
      await updateAdminCourseStatus(id, { status: 'PUBLISHED', reason: null })
      setCourse((c) => ({ ...c, status: 'PUBLISHED', rejectedReason: null }))
    } catch (err) {
      console.error('Approve failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  /* ── Reject ── */
  async function handleReject(reason) {
    setActionLoading(true)
    try {
      await updateAdminCourseStatus(id, { status: 'REJECTED', reason })
      setCourse((c) => ({ ...c, status: 'REJECTED', rejectedReason: reason }))
      setRejectOpen(false)
    } catch (err) {
      console.error('Reject failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  /* ── Loading / not found ── */
  if (loadingPage) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
        Đang tải…
      </div>
    )
  }

  if (!course) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
        Không tìm thấy khóa học.
      </div>
    )
  }

  const isPending = course.status === 'PENDING'

  const totalLessons  = course.sections.reduce((s, sec) => s + sec.lessons.length, 0)
  const totalSeconds  = course.sections.reduce(
    (s, sec) => s + sec.lessons.reduce((a, l) => a + (l.duration || 0), 0), 0
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        title="Chi tiết khóa học"
        subtitle={`Đang xem xét: ${course.title}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <ActBtn variant="ghost" onClick={() => navigate('/admin/courses')}>
              <i className="ti ti-arrow-left" style={{ fontSize: 13 }} />
              Quay lại
            </ActBtn>
            {isPending && (
              <>
                <ActBtn variant="red" onClick={() => setRejectOpen(true)} disabled={actionLoading}>
                  <i className="ti ti-x" style={{ fontSize: 13 }} />
                  Từ chối
                </ActBtn>
                <ActBtn variant="green" onClick={handleApprove} disabled={actionLoading}>
                  {actionLoading
                    ? <i className="ti ti-loader-2" style={{ fontSize: 13 }} />
                    : <i className="ti ti-check" style={{ fontSize: 13 }} />
                  }
                  Duyệt
                </ActBtn>
              </>
            )}
          </div>
        }
      />

      {/* Rejected reason banner */}
      {course.status === 'REJECTED' && course.rejectedReason && (
        <div style={{
          background: 'var(--red-bg)', border: '0.5px solid #ffc8c4',
          borderRadius: 'var(--radius)', padding: '12px 16px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 16, color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--red)', margin: '0 0 2px' }}>
              Lý do từ chối
            </p>
            <p style={{ fontSize: 13, color: 'var(--red)', margin: 0, opacity: 0.85 }}>
              {course.rejectedReason}
            </p>
          </div>
        </div>
      )}

      {/* Comparison Diff Panel */}
      <CourseDiffPanel course={course} />

      {/* Thumbnail + Info — clamp để responsive tự nhiên */}
      <div style={{ display: 'grid', gridTemplateColumns: 'clamp(120px, 28%, 220px) 1fr', gap: 18 }}>
        {/* Thumbnail */}
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)', overflow: 'hidden',
          aspectRatio: '16/9', alignSelf: 'start',
        }}>
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', minHeight: 124,
              background: 'var(--border-faint)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-photo" style={{ fontSize: 28, color: 'var(--ink-3)' }} />
            </div>
          )}
        </div>

        {/* Info card */}
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1.3 }}>
              {course.title}
            </h2>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <StatusBadge
                label={STATUS_LABEL[course.status] ?? course.status}
                variant={STATUS_VARIANT[course.status] ?? 'neutral'}
              />
              {course.status === 'PENDING' && course.submissionType && (
                <StatusBadge
                  label={course.submissionType === 'NEW' ? 'Mới' : 'Cập nhật'}
                  variant={course.submissionType === 'NEW' ? 'blue' : 'purple'}
                />
              )}
            </div>
          </div>

          {course.description && (
            <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>
              {course.description}
            </p>
          )}

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '10px 20px', paddingTop: 12,
            borderTop: '0.5px solid var(--border-faint)',
          }}>
            {/* Teacher */}
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>
                Giảng viên
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: '0 0 1px' }}>
                {course.teacher.name ?? '—'}
              </p>
              <p style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: 0 }}>
                {course.teacher.email}
              </p>
            </div>

            {/* Price */}
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>
                Giá
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                {fmtPrice(course.price)}
              </p>
            </div>

            {/* Created */}
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>
                Ngày tạo
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                {fmtDate(course.createdAt)}
              </p>
            </div>

            {/* Content */}
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>
                Nội dung
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                {course.sections.length} chương · {totalLessons} bài học
                {totalSeconds > 0 && ` · ${fmtDuration(totalSeconds)}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '11px 16px', borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="ti ti-layout-list" style={{ fontSize: 14, color: 'var(--ink-3)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Chương trình học</span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            — {course.sections.length} chương
          </span>
        </div>

        {course.sections.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            Chưa có chương học nào
          </div>
        ) : (
          course.sections.map((section, i) => (
            <SectionRow key={section.id} section={section} index={i} onPreview={setPreviewLesson} />
          ))
        )}
      </div>

      {/* Reject modal */}
      {rejectOpen && (
        <RejectModal
          onClose={() => setRejectOpen(false)}
          onConfirm={handleReject}
          loading={actionLoading}
        />
      )}

      {/* Preview modal */}
      {previewLesson && (
        <PreviewModal
          lesson={previewLesson}
          onClose={() => setPreviewLesson(null)}
        />
      )}
    </div>
  )
}