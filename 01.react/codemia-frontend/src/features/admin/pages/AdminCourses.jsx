// src/features/admin/pages/AdminCourses.jsx
import { useNavigate } from 'react-router-dom'
import PageHeader   from '@/shared/components/dashboard-ui/PageHeader'
import SearchBar    from '@/shared/components/dashboard-ui/SearchBar'
import ConfirmModal from '@/shared/components/dashboard-ui/ConfirmModal'
import FormModal    from '@/shared/components/dashboard-ui/FormModal'
import CourseTable  from '@/features/admin/components/AdminCourseTable'
import { useAdminCourses } from '@/features/admin/hooks/useAdminCourses'

/* ── Filter tabs config ── */
const FILTER_TABS = [
  { key: '',          label: 'Tất cả'       },
  { key: 'PENDING',   label: 'Chờ duyệt'   },
  { key: 'PUBLISHED', label: 'Đã xuất bản' },
  { key: 'UNLISTED',  label: 'Đang ẩn'     },
  { key: 'DRAFT',     label: 'Bản nháp'     },
  { key: 'REJECTED',  label: 'Đã từ chối'  },
  { key: 'SUSPENDED', label: 'Đã khóa'     },
]

/* ══════════════════════════════════════════════
   AdminCourses
   Simplified using useAdminCourses custom hook.
 ══════════════════════════════════════════════ */
export default function AdminCourses() {
  const navigate = useNavigate()

  const {
    courses,
    totalElements,
    totalPages,
    loading,
    filter,
    search,
    page,
    setPage,
    minPrice,
    maxPrice,
    priceRangeInvalid,
    deleteTarget,
    setDeleteTarget,
    rejectTarget,
    setRejectTarget,
    rejectReason,
    setRejectReason,
    republishTarget,
    setRepublishTarget,
    suspendTarget,
    setSuspendTarget,
    suspendReason,
    setSuspendReason,
    restoreTarget,
    setRestoreTarget,
    actionLoading,
    deleteError,
    setDeleteError,
    handleFilter,
    handleSearch,
    handleMinPrice,
    handleMaxPrice,
    clearPriceRange,
    handleApprove,
    openReject,
    handleRejectConfirm,
    handleRepublishConfirm,
    handleSuspendConfirm,
    handleRestoreConfirm,
    handleDeleteConfirm,
  } = useAdminCourses()

  /* ── Shared input style factory ── */
  const priceInputStyle = (invalid) => ({
    width: 100, padding: '5px 10px',
    border: `0.5px solid ${invalid ? 'var(--danger, #e53e3e)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-sm)',
    fontSize: 12, fontFamily: 'inherit',
    background: invalid ? 'var(--danger-bg, #fff5f5)' : 'var(--bg)',
    color: 'var(--ink)',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
  })

  const hasPriceFilter = minPrice !== '' || maxPrice !== ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        title="Khóa học"
        subtitle="Quản lý và xét duyệt tất cả khóa học trên nền tảng."
      />

      {/* Table card */}
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', gap: 12,
          borderBottom: '0.5px solid var(--border)',
          flexWrap: 'wrap',
        }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleFilter(tab.key)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: 'none',
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.12s',
                  background: filter === tab.key ? 'var(--ink)' : 'transparent',
                  color:      filter === tab.key ? '#fff'        : 'var(--ink-3)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Tìm tên khóa học…"
            width={240}
          />

          {/* ── Price range filter ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number"
                placeholder="Giá tối thiểu"
                value={minPrice}
                min={0}
                onChange={(e) => handleMinPrice(e.target.value)}
                style={priceInputStyle(priceRangeInvalid)}
              />
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>–</span>
              <input
                type="number"
                placeholder="Giá tối đa"
                value={maxPrice}
                min={0}
                onChange={(e) => handleMaxPrice(e.target.value)}
                style={priceInputStyle(priceRangeInvalid)}
              />
              {/* Clear button — chỉ hiện khi đang có giá trị */}
              {hasPriceFilter && (
                <button
                  onClick={clearPriceRange}
                  title="Xóa lọc giá"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 22, height: 22, borderRadius: '50%',
                    border: 'none', cursor: 'pointer',
                    background: 'var(--ink-3)',
                    color: '#fff',
                    fontSize: 13, lineHeight: 1,
                    flexShrink: 0,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ink)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--ink-3)'}
                >
                  ×
                </button>
              )}
            </div>

            {/* Inline error — chỉ hiện khi min > max */}
            {priceRangeInvalid && (
              <p style={{
                margin: 0, fontSize: 11,
                color: 'var(--danger, #e53e3e)',
                lineHeight: 1.4,
              }}>
                Giá tối thiểu phải ≤ Giá tối đa
              </p>
            )}
          </div>
        </div>

        {/* Table */}
        <CourseTable
          courses={courses}
          loading={loading}
          totalElements={totalElements}
          totalPages={totalPages}
          page={page}
          onPageChange={setPage}
          onRowClick={(c) => navigate(`/admin/courses/${c.id}`)}
          onApprove={handleApprove}
          onReject={openReject}
          onRepublish={setRepublishTarget}
          onSuspend={setSuspendTarget}
          onRestore={setRestoreTarget}
          onDelete={setDeleteTarget}
        />
      </div>

      {/* ── Modal: Delete ── */}
      {deleteTarget && (
        <ConfirmModal
          open
          onClose={() => { setDeleteTarget(null); setDeleteError('') }}
          onConfirm={handleDeleteConfirm}
          title={`Xóa "${deleteTarget.title}"?`}
          description={
            deleteError
              ? deleteError
              : deleteTarget.totalStudents > 0
                ? `Khóa học sẽ bị gỡ khỏi nền tảng. ${deleteTarget.totalStudents} học viên đang đăng ký sẽ nhận được thông báo. Giáo viên cũng sẽ được thông báo.`
                : 'Khóa học sẽ bị gỡ khỏi nền tảng. Giáo viên sẽ nhận được thông báo.'
          }
          confirmLabel="Xóa khóa học"
          danger
          loading={actionLoading}
        />
      )}

      {/* ── Modal: Reject ── */}
      {rejectTarget && (
        <FormModal
          open
          onClose={() => { setRejectTarget(null); setRejectReason('') }}
          onSubmit={handleRejectConfirm}
          title={`Từ chối "${rejectTarget.title}"?`}
          submitLabel="Từ chối khóa học"
          loading={actionLoading}
          width={440}
        >
          <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            Khóa học sẽ bị từ chối. Giáo viên sẽ nhận được thông báo kèm lý do bên dưới.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
              Lý do từ chối{' '}
              <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(tùy chọn)</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Vd: Nội dung chưa đủ bài, thiếu mô tả khóa học, vi phạm nội quy..."
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 10px',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13, color: 'var(--ink)',
                background: 'var(--bg)',
                fontFamily: 'inherit', lineHeight: 1.6,
                resize: 'vertical', outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--ink-3)'}
              onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        </FormModal>
      )}

      {/* ── Modal: Republish ── */}
      {republishTarget && (
        <ConfirmModal
          open
          onClose={() => setRepublishTarget(null)}
          onConfirm={handleRepublishConfirm}
          title={`Xuất bản lại "${republishTarget.title}"?`}
          description="Khóa học sẽ hiển thị trở lại trên danh mục. Học viên mới có thể đăng ký."
          confirmLabel="Xuất bản lại"
          loading={actionLoading}
        />
      )}

      {/* ── Modal: Suspend ── */}
      {suspendTarget && (
        <FormModal
          open
          onClose={() => { setSuspendTarget(null); setSuspendReason('') }}
          onSubmit={handleSuspendConfirm}
          title={`Khóa "${suspendTarget.title}"?`}
          submitLabel="Khóa khóa học"
          loading={actionLoading}
          width={440}
        >
          <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            Khóa học sẽ bị khóa hoàn toàn. Chỉ Quản trị viên mới có thể mở khóa. Giáo viên sẽ nhận được thông báo kèm lý do.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
              Lý do khóa{' '}
              <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>(tùy chọn)</span>
            </label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Vd: Vi phạm bản quyền, nội dung không phù hợp, vi phạm chính sách nền tảng..."
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 10px',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13, color: 'var(--ink)',
                background: 'var(--bg)',
                fontFamily: 'inherit', lineHeight: 1.6,
                resize: 'vertical', outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--ink-3)'}
              onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        </FormModal>
      )}

      {/* ── Modal: Restore ── */}
      {restoreTarget && (
        <ConfirmModal
          open
          onClose={() => setRestoreTarget(null)}
          onConfirm={handleRestoreConfirm}
          title={`Mở khóa "${restoreTarget.title}"?`}
          description="Khóa học sẽ được mở khóa và xuất bản trở lại. Giáo viên sẽ nhận được thông báo."
          confirmLabel="Mở khóa"
          loading={actionLoading}
        />
      )}
    </div>
  )
}