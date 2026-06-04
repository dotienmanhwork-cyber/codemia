// src/features/teacher/pages/TeacherCourses.jsx
import { useTeacherCourses } from '../hooks/useTeacherCourses';
import PageHeader          from '../../../shared/components/dashboard-ui/PageHeader';
import FormModal           from '../../../shared/components/dashboard-ui/FormModal';
import ConfirmModal        from '../../../shared/components/dashboard-ui/ConfirmModal';
import CourseStatCards     from '../components/CourseStatCards';
import CourseFilterBar     from '../components/CourseFilterBar';
import CourseTable         from '../components/TeacherCourseTable';
import RejectedReasonModal from '../components/RejectedReasonModal';

/* ─── Small reusable Field wrapper ──────────────── */
const inputStyle = {
  width: '100%', height: 36,
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '0 12px',
  fontSize: 13, color: 'var(--ink)',
  background: 'var(--surface)',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>{label}</label>
    {children}
  </div>
);

/* ══════════════════════════════════════════════
   TeacherCourses
══════════════════════════════════════════════ */
export default function TeacherCourses() {
  const {
    paged,
    totalPages,
    page,
    setPage,
    statCardData,
    statsLoading,
    tableLoading,
    flatCategories,
    categoriesLoading,
    filter,
    search,
    modal,
    setModal,
    confirm,
    setConfirm,
    rejectedModal,
    setRejectedModal,
    cancelConfirm,
    setCancelConfirm,
    deleteError,
    setDeleteError,
    form,
    setForm,
    submitting,
    createError,
    handleFilter,
    handleSearch,
    openCreate,
    handleCreate,
    handleDelete,
    handleSubmit,
    handleCancelPending,
    handleUnpublish,
    handleRepublish,
    unpublishConfirm,
    setUnpublishConfirm,
    handleUnpublishConfirm,
    republishConfirm,
    setRepublishConfirm,
    handleRepublishConfirm,
    errorModal,
    setErrorModal,
  } = useTeacherCourses();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <PageHeader
        title="Khóa học của tôi"
        subtitle="Quản lý, chỉnh sửa và theo dõi toàn bộ các khóa học của bạn."
        action={
          <button
            onClick={openCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 15px',
              background: 'var(--purple)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--purple-dim)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--purple)')}
          >
            <i className="ti ti-plus" style={{ fontSize: 14 }} />
            Tạo khóa học
          </button>
        }
      />

      {/* Stat cards */}
      <CourseStatCards stats={statCardData} loading={statsLoading} />

      {/* Table card */}
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        <CourseFilterBar
          filter={filter}
          search={search}
          onFilter={handleFilter}
          onSearch={handleSearch}
        />
        <CourseTable
          courses={paged}
          loading={tableLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSubmit={handleSubmit}
          onDelete={setConfirm}
          onRejectedClick={setRejectedModal}
          onCancelPending={setCancelConfirm}
          onUnpublish={handleUnpublish}
          onRepublish={handleRepublish}
        />
      </div>

      {/* ── Create course modal ── */}
      <FormModal
        open={modal}
        onClose={() => setModal(false)}
        title="Tạo khóa học mới"
        onSubmit={handleCreate}
        submitLabel={submitting ? 'Đang tạo…' : 'Tạo khóa học'}
        width={500}
      >
        {/* Tên khóa học */}
        <Field label="Tên khóa học *">
          <input
            style={inputStyle}
            placeholder="Ví dụ: Làm chủ React: Từ cơ bản đến nâng cao"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </Field>

        {/* Danh mục */}
        <Field label="Danh mục">
          {categoriesLoading ? (
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: 'var(--ink-3)', gap: 6 }}>
              <span style={{ fontSize: 12 }}>Đang tải danh mục…</span>
            </div>
          ) : (
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            >
              <option value="">-- Chọn danh mục --</option>
              {flatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        {/* Giá */}
        <Field label="Giá (VND)">
          <input
            style={inputStyle}
            placeholder="Ví dụ: 499000 — để trống nếu miễn phí"
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
        </Field>

        {/* Mô tả */}
        <Field label="Mô tả ngắn">
          <textarea
            style={{ ...inputStyle, height: 80, padding: '8px 12px', resize: 'vertical', lineHeight: 1.5 }}
            placeholder="Mô tả ngắn gọn về khóa học…"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>

        {/* Lỗi từ BE */}
        {createError && (
          <p style={{
            fontSize: 12,
            color: '#dc2626',
            background: '#fef2f2',
            border: '0.5px solid #fecaca',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            margin: 0,
          }}>
            {createError}
          </p>
        )}
      </FormModal>

      {/* Confirm delete */}
      {confirm && (
        <ConfirmModal
          open
          onClose={() => { setConfirm(null); setDeleteError(''); }}
          onConfirm={handleDelete}
          title={`Xóa "${confirm.title}"?`}
          description={
            deleteError
              ? deleteError
              : 'Khóa học này sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.'
          }
          confirmLabel="Xóa khóa học"
          danger
        />
      )}

      {/* Confirm hủy chờ duyệt */}
      {cancelConfirm && (
        <ConfirmModal
          open
          onClose={() => setCancelConfirm(null)}
          onConfirm={handleCancelPending}
          title={`Hủy yêu cầu duyệt cho "${cancelConfirm.title}"?`}
          description="Khóa học sẽ trở về trạng thái Bản nháp. Bạn có thể gửi duyệt lại bất cứ lúc nào."
          confirmLabel="Hủy yêu cầu duyệt"
        />
      )}

      {unpublishConfirm && (
        <ConfirmModal
          open
          onClose={() => setUnpublishConfirm(null)}
          onConfirm={handleUnpublishConfirm}
          title={`Ẩn "${unpublishConfirm.title}"?`}
          description="Khóa học sẽ bị ẩn khỏi danh mục. Học viên đã đăng ký vẫn học bình thường."
          confirmLabel="Ẩn khóa học"
        />
      )}

      {republishConfirm && (
        <ConfirmModal
          open
          onClose={() => setRepublishConfirm(null)}
          onConfirm={handleRepublishConfirm}
          title={`Xuất bản lại "${republishConfirm.title}"?`}
          description="Khóa học sẽ xuất hiện trở lại trên danh mục. Học viên mới có thể đăng ký."
          confirmLabel="Xuất bản lại"
        />
      )}

      {/* ── Error modal (thay thế alert()) ── */}
      {errorModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setErrorModal(null)}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px 24px 20px',
              width: 360,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
              {errorModal.title}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              {errorModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                onClick={() => setErrorModal(null)}
                style={{
                  padding: '7px 18px',
                  background: 'var(--purple)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejected reason modal */}
      <RejectedReasonModal
        course={rejectedModal}
        onClose={() => setRejectedModal(null)}
      />
    </div>
  );
}