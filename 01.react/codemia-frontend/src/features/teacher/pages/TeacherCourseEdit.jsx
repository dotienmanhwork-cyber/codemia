// src/features/teacher/pages/TeacherCourseEdit.jsx
import { useParams } from 'react-router-dom';
import PageHeader from '../../../shared/components/dashboard-ui/PageHeader';
import CourseInfoForm from '../components/CourseInfoForm';
import CurriculumEditor from '../components/CurriculumEditor';
import { useTeacherCourseEdit } from '../hooks/useTeacherCourseEdit';

/* ─── Toast component ─── */
function Toast({ toast }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 18px',
        borderRadius: 'var(--radius)',
        background: isSuccess ? 'var(--green-bg, #f0fdf4)' : 'var(--red-bg, #fef2f2)',
        border: `0.5px solid ${isSuccess ? '#86efac' : '#fecaca'}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        fontSize: 13,
        fontWeight: 600,
        color: isSuccess ? 'var(--green, #16a34a)' : 'var(--red, #dc2626)',
        animation: 'tce-toast-in 0.2s ease',
        maxWidth: 340,
      }}
    >
      <i
        className={`ti ${isSuccess ? 'ti-circle-check' : 'ti-alert-circle'}`}
        style={{ fontSize: 16, flexShrink: 0 }}
      />
      {toast.message}
    </div>
  );
}

/* ══════════════════════════════════════════════
   TeacherCourseEdit
   Route: /teacher/courses/:id/edit
══════════════════════════════════════════════ */
export default function TeacherCourseEdit() {
  const { id } = useParams();
  const {
    course,
    courseLoading,
    form,
    saving,
    saveError,
    submitting,
    toast,
    categories,
    sections,
    sectionsLoading,
    handleFormChange,
    handleSave,
    handleSubmit,
    handleAddSection,
    handleEditSection,
    handleDeleteSection,
    handleAddLesson,
    handleEditLesson,
    handleDeleteLesson,
    handleReorderLessons,
    handleReorderSections,
    isDirty,
    navigate,
    showToast,
    fetchSections,
  } = useTeacherCourseEdit(id);

  if (courseLoading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
        Đang tải khóa học…
      </div>
    );
  }

  const isPending = course?.status === 'PENDING';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Floating toast */}
      <Toast toast={toast} />

      {/* Header */}
      <PageHeader
        title="Chỉnh sửa khóa học"
        subtitle={course?.title ?? ''}
        action={
          <button
            onClick={() => navigate('/teacher/courses')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              color: 'var(--ink-2)',
              fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-faint)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 13 }} />
            Quay lại
          </button>
        }
      />

      {/* Rejected reason banner */}
      {course?.status === 'REJECTED' && course?.rejectedReason && (
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
            <p style={{ fontSize: 13, color: 'var(--red)', margin: 0, opacity: 0.85, lineHeight: 1.6 }}>
              {course.rejectedReason}
            </p>
          </div>
        </div>
      )}

      {/* Course info form */}
      <CourseInfoForm
        form={form}
        onChange={handleFormChange}
        onSave={handleSave}
        saving={saving}
        saveError={saveError}
        status={course?.status ?? 'DRAFT'}
        onSubmit={handleSubmit}
        submitting={submitting}
        categories={categories}
        isDirty={isDirty}
      />

      {/* Curriculum editor */}
      {sectionsLoading && sections.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '32px 16px',
          textAlign: 'center', color: 'var(--ink-3)', fontSize: 13,
        }}>
          Đang tải nội dung…
        </div>
      ) : (
        <CurriculumEditor
          sections={sections}
          disabled={isPending}
          courseId={id}
          onAddSection={handleAddSection}
          onEditSection={handleEditSection}
          onDeleteSection={handleDeleteSection}
          onAddLesson={handleAddLesson}
          onEditLesson={handleEditLesson}
          onDeleteLesson={handleDeleteLesson}
          onReorderLessons={handleReorderLessons}
          onReorderSections={handleReorderSections}
          onSaveOrderSuccess={async () => {
            showToast('success', 'Đã lưu thay đổi thứ tự chương và bài học thành công!');
            await fetchSections();
          }}
        />
      )}
    </div>
  );
}