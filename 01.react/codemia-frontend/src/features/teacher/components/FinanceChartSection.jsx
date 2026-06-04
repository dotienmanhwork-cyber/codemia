// src/features/teacher/components/FinanceChartSection.jsx

const COURSE_COLORS = [
  'var(--purple)',
  'var(--blue)',
  'var(--green)',
  'var(--amber)',
  'var(--red, #e53935)',
]

/** Format VND ngắn: 1_200_000 → '1.2tr đ' */
function fmtVNDShort(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr đ`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k đ`
  return n > 0 ? `${n} đ` : ''
}

/** Format VND đầy đủ: 1_000_000 → '1.000.000 đ' */
function fmtVND(n) {
  return Number(n).toLocaleString('vi-VN') + ' đ'
}

/**
 * Luôn trả về mảng 12 phần tử (T1–T12) của năm hiện tại.
 * Merge data từ API vào — tháng không có data → revenue = 0.
 */
function buildFullYear(data) {
  const year = new Date().getFullYear()
  const map  = {}
  ;(data ?? []).forEach((d) => { map[d.month] = d.revenue })

  return Array.from({ length: 12 }, (_, i) => {
    const mm    = String(i + 1).padStart(2, '0')
    const key   = `${year}-${mm}`
    return { month: key, revenue: map[key] ?? 0 }
  })
}

const SectionCard = ({ title, headerRight, children }) => (
  <div style={{
    background: 'var(--surface)',
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
  }}>
    {(title || headerRight) && (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 16px',
        borderBottom: '0.5px solid var(--border)',
      }}>
        {title && (
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{title}</span>
        )}
        {headerRight}
      </div>
    )}
    {children}
  </div>
)

/* ─── BarChart — luôn 12 cột ─── */
const BarChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div style={{ padding: '20px 16px', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Đang tải…</span>
      </div>
    )
  }

  // ✅ Luôn đủ 12 tháng
  const fullData   = buildFullYear(data)
  const maxRevenue = Math.max(...fullData.map((m) => m.revenue), 1)
  const nowMonth   = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  return (
    <div style={{ padding: '20px 16px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, marginBottom: 8 }}>
        {fullData.map((m) => {
          const isCurrent = m.month === nowMonth
          const barH      = m.revenue > 0 ? Math.max(Math.round((m.revenue / maxRevenue) * 125), 4) : 2
          return (
            <div
              key={m.month}
              title={`${m.month}: ${fmtVND(m.revenue)}`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              {/* Label chỉ hiện khi có tiền */}
              <span style={{
                fontSize: 9,
                color:      isCurrent ? 'var(--purple-dim)' : 'var(--ink-3)',
                fontWeight: isCurrent ? 700 : 400,
                whiteSpace: 'nowrap',
                minHeight: 14,
              }}>
                {m.revenue > 0 ? fmtVNDShort(m.revenue) : ''}
              </span>

              {/* Bar */}
              <div style={{
                width: '100%',
                height: barH,
                borderRadius: '3px 3px 0 0',
                background: isCurrent
                  ? 'var(--purple)'
                  : m.revenue > 0
                    ? 'var(--border-dark, #bbb)'
                    : 'var(--border)',
                transition: 'background 0.2s',
              }} />
            </div>
          )
        })}
      </div>

      {/* X-axis */}
      <div style={{ display: 'flex', gap: 6 }}>
        {fullData.map((m, i) => {
          const isCurrent = m.month === nowMonth
          return (
            <div
              key={m.month}
              style={{
                flex: 1, textAlign: 'center',
                fontSize: 10,
                fontWeight: isCurrent ? 700 : 400,
                color: isCurrent ? 'var(--purple-dim)' : 'var(--ink-3)',
              }}
            >
              {['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'][i]}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── CourseBreakdown ─── */
const CourseBreakdown = ({ data, loading }) => {
  if (loading) {
    return (
      <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Đang tải…</span>
      </div>
    )
  }

  if (!data || data.length === 0) return null

  const maxRevenue = data[0]?.revenue ?? 0
  const total      = data.reduce((s, c) => s + c.revenue, 0)

  return (
    <>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.map((c, i) => {
          const pct   = maxRevenue > 0 ? Math.round((c.revenue / maxRevenue) * 100) : 0
          const color = c.revenue > 0 ? COURSE_COLORS[i % COURSE_COLORS.length] : 'var(--border)'
          return (
            <div key={c.courseId}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 5,
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--ink-2)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: '55%',
                }}>
                  {c.courseName}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: c.revenue > 0 ? 'var(--ink)' : 'var(--ink-3)',
                }}>
                  {fmtVND(c.revenue)}
                </span>
              </div>
              <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99, width: `${pct}%`,
                  background: color, transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>
                {Number(c.totalStudents).toLocaleString()} học viên
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        margin: '0 16px 14px', padding: '10px 14px',
        background: 'var(--purple-light)', borderRadius: 'var(--radius-sm)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--purple-dim)', fontWeight: 600 }}>Tổng cộng</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--purple-dim)' }}>
          {fmtVND(total)}
        </span>
      </div>
    </>
  )
}

export default function FinanceChartSection({ monthlyData, courseData, loadingChart, loadingCourse }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-[10px] items-start">
      <SectionCard
        title="Doanh thu theo tháng"
        headerRight={
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            {new Date().getFullYear()}
          </span>
        }
      >
        <BarChart data={monthlyData} loading={loadingChart} />
      </SectionCard>

      <SectionCard title="Doanh thu theo khóa học">
        <CourseBreakdown data={courseData} loading={loadingCourse} />
      </SectionCard>
    </div>
  )
}