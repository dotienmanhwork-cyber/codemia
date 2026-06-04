import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTeacherCourseById,
  getCategories,
  getSectionsByCourse,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
  updateCourse,
  submitCourse,
  reorderLessons,
} from '../api/teacher.api';

export function useTeacherCourseEdit(id) {
  const navigate = useNavigate();

  /* ── Course info state ── */
  const [course, setCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [form, setForm] = useState({ title: '', categoryId: '', price: '', description: '', thumbnailUrl: '' });
  const [initialForm, setInitialForm] = useState({ title: '', categoryId: '', price: '', description: '', thumbnailUrl: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ── Toast state ── */
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }

  /* ── Category state ── */
  const [categories, setCategories] = useState([]);

  /* ── Curriculum state ── */
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  /* ── Helper: show toast ── */
  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Fetch sections + lessons ── */
  const fetchSections = useCallback(async () => {
    setSectionsLoading(true);
    try {
      const res = await getSectionsByCourse(id);
      setSections(res.result ?? res);
    } catch (err) {
      console.error('fetchSections error:', err);
    } finally {
      setSectionsLoading(false);
    }
  }, [id]);

  /* ── Fetch initial data on mount ── */
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.result ?? res))
      .catch((err) => console.error('getCategories error:', err));

    const state = window.history.state?.usr;

    if (state?.course) {
      const c = state.course;
      setCourse(c);
      const f0 = {
        title:        c.title                                         ?? '',
        categoryId:   c.categoryId                                    ?? '',
        price:        c.price != null ? String(c.price)              : '',
        description:  c.description                                   ?? '',
        thumbnailUrl: c.thumbnail ?? c.thumbnailUrl                   ?? '',
      };
      setForm(f0);
      setInitialForm(f0);
      setCourseLoading(false);
    } else {
      getTeacherCourseById(id)
        .then((res) => {
          const c = res.result ?? res;
          setCourse(c);
          const f1 = {
            title:        c.title                                         ?? '',
            categoryId:   c.categoryId                                    ?? '',
            price:        c.price != null ? String(c.price)              : '',
            description:  c.description                                   ?? '',
            thumbnailUrl: c.thumbnail ?? c.thumbnailUrl                   ?? '',
          };
          setForm(f1);
          setInitialForm(f1);
        })
        .catch((err) => console.error('fetchCourse error:', err))
        .finally(() => setCourseLoading(false));
    }

    fetchSections();
  }, [id, fetchSections]);

  /* ── Course info handlers ── */
  const handleFormChange = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) {
      setSaveError('Tên khóa học không được để trống.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = await updateCourse(id, {
        title:        form.title.trim(),
        categoryId:   form.categoryId ? Number(form.categoryId) : undefined,
        price:        form.price !== '' ? Number(form.price) : 0,
        description:  form.description,
        thumbnailUrl: form.thumbnailUrl || null,
      });
      const updatedCourse = res.result ?? res;
      setCourse(updatedCourse);
      const newForm = {
        title:        updatedCourse.title                                         ?? '',
        categoryId:   updatedCourse.categoryId                                    ?? '',
        price:        updatedCourse.price != null ? String(updatedCourse.price)  : '',
        description:  updatedCourse.description                                   ?? '',
        thumbnailUrl: updatedCourse.thumbnail ?? updatedCourse.thumbnailUrl       ?? '',
      };
      setForm(newForm);
      setInitialForm(newForm);
      showToast('success', 'Lưu thay đổi thành công!');
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Lưu thất bại. Vui lòng thử lại.';
      setSaveError(msg);
      showToast('error', msg);
      console.error('updateCourse error:', err);
    } finally {
      setSaving(false);
    }
  }, [id, form, showToast]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      await submitCourse(id);
      setCourse((c) => ({ ...c, status: 'PENDING' }));
      showToast('success', 'Đã nộp duyệt! Admin sẽ xem xét khóa học sớm.');
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 1023) {
        showToast('error', 'Khóa học không thể submit ở trạng thái hiện tại.');
      } else if (code === 1024) {
        showToast('error', 'Cần có ít nhất 1 chương và 1 bài học để nộp duyệt.');
      } else {
        showToast('error', 'Nộp duyệt thất bại. Vui lòng thử lại.');
        console.error('submitCourse error:', err);
      }
    } finally {
      setSubmitting(false);
    }
  }, [id, showToast]);

  /* ── Section handlers ── */
  const handleAddSection = useCallback(async (title) => {
    await createSection({ courseId: id, title, orderIndex: sections.length });
    await fetchSections();
  }, [id, sections.length, fetchSections]);

  const handleEditSection = useCallback(async (section, newTitle) => {
    await updateSection(section.id, {
      courseId: id,
      title: newTitle,
      orderIndex: section.orderIndex,
    });
    await fetchSections();
  }, [id, fetchSections]);

  const handleDeleteSection = useCallback(async (section) => {
    await deleteSection(section.id);
    await fetchSections();
  }, [fetchSections]);

  /* ── Lesson handlers ── */
  const handleAddLesson = useCallback(async (section, data) => {
    const res = await createLesson({
      sectionId: section.id,
      ...data,
    });
    const newLesson = res.result ?? res;

    const insertAt = data.orderIndex ?? (section.lessons?.length ?? 0);
    const currentLessons = section.lessons ?? [];

    if (insertAt < currentLessons.length) {
      const reordered = [
        ...currentLessons.slice(0, insertAt),
        newLesson,
        ...currentLessons.slice(insertAt),
      ];
      const payload = reordered.map((l, idx) => ({ id: l.id, orderIndex: idx }));
      await reorderLessons(payload);
    }

    await fetchSections();
    return newLesson;
  }, [fetchSections]);

  const handleEditLesson = useCallback(async (lesson, data) => {
    await updateLesson(lesson.id, {
      sectionId: lesson.sectionId,
      orderIndex: lesson.orderIndex,
      ...data,
    });
    await fetchSections();
  }, [fetchSections]);

  const handleDeleteLesson = useCallback(async (lesson) => {
    await deleteLesson(lesson.id);
    await fetchSections();
  }, [fetchSections]);

  const handleReorderLessons = useCallback((sectionId, reorderedLessons) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, lessons: reorderedLessons } : s
      )
    );
  }, []);

  const handleReorderSections = useCallback((reorderedSections) => {
    setSections(reorderedSections);
  }, []);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  return {
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
  };
}
