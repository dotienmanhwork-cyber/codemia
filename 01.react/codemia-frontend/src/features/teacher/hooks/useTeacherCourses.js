import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { DashboardSearchContext } from '@/layouts/DashboardLayout';
import {
  getTeacherDashboardStats,
  getTeacherCoursesFilter,
  getCategories,
  createCourse,
  deleteCourse,
  submitCourse,
  cancelPendingCourse,
  unpublishCourse,
  republishCourse,
} from '../api/teacher.api';

const PAGE_SIZE = 5;
const EMPTY_FORM = { title: '', categoryId: '', price: '', description: '' };

function flattenCategories(nodes, depth = 0) {
  const result = [];
  for (const node of nodes ?? []) {
    result.push({
      id:    node.id,
      label: depth === 0 ? node.name : `${'  '.repeat(depth)}└─ ${node.name}`,
    });
    if (node.children?.length) {
      result.push(...flattenCategories(node.children, depth + 1));
    }
  }
  return result;
}

export function useTeacherCourses() {
  /* ── Data state ── */
  const [courses,      setCourses]      = useState([]);
  const [stats,        setStats]        = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);

  /* ── Category state ── */
  const [categories,        setCategories]        = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  /* ── Filter / pagination state ── */
  const [filter, setFilter] = useState('');
  const { keyword: search, setKeyword: setSearch } = useContext(DashboardSearchContext);
  const [page,   setPage]   = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  /* ── Modal state ── */
  const [modal,         setModal]         = useState(false);
  const [confirm,       setConfirm]       = useState(null);
  const [rejectedModal, setRejectedModal] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [unpublishConfirm, setUnpublishConfirm] = useState(null);
  const [republishConfirm, setRepublishConfirm] = useState(null);
  const [deleteError,   setDeleteError]   = useState('');

  /* ── Error modal state (thay thế alert()) ── */
  const [errorModal, setErrorModal] = useState(null); // null | { title, message }

  /* ── Create form state ── */
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [createError, setCreateError] = useState('');

  /* ── Flat list cho <select> ── */
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  /* ── Fetch stats ── */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getTeacherDashboardStats();
      setStats(res.result ?? res);
    } catch (err) {
      console.error('fetchStats error:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* ── Fetch courses ── */
  const fetchCourses = useCallback(async (statusFilter, keyword) => {
    setTableLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status  = statusFilter;
      if (keyword)      params.keyword = keyword;
      const res = await getTeacherCoursesFilter(params);
      setCourses(res.result ?? res);
    } catch (err) {
      console.error('fetchCourses error:', err);
    } finally {
      setTableLoading(false);
    }
  }, []);

  /* ── Fetch categories ── */
  const fetchCategories = useCallback(async () => {
    if (categories.length > 0) return;
    setCategoriesLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.result ?? res);
    } catch (err) {
      console.error('getCategories error:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, [categories.length]);

  /* Initial load */
  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    fetchCourses(filter, debouncedSearch);
    setPage(1);
  }, [filter, debouncedSearch, fetchCourses]);

  /* Derived data */
  const totalPages = Math.ceil(courses.length / PAGE_SIZE);
  const paged = useMemo(
    () => courses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [courses, page]
  );

  const publishedCount = useMemo(
    () => courses.filter((c) => c.status === 'PUBLISHED').length,
    [courses]
  );

  const statCardData = {
    totalCourses:     stats.totalCourses,
    publishedCourses: publishedCount,
    draftCourses:     stats.draftCourses,
    totalStudents:    stats.totalStudents,
  };

  /* Handlers */
  const handleFilter = (key) => { setFilter(key); };
  const handleSearch = (val) => { setSearch(val); };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreateError('');
    setModal(true);
    fetchCategories();
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    setCreateError('');
    try {
      await createCourse({
        title:       form.title.trim(),
        categoryId:  form.categoryId ? Number(form.categoryId) : undefined,
        price:       form.price ? Number(form.price) : 0,
        description: form.description,
      });
      setModal(false);
      await Promise.all([fetchStats(), fetchCourses(filter, search)]);
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to create course. Please try again.';
      setCreateError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setDeleteError('');
    try {
      await deleteCourse(confirm.id);
      setConfirm(null);
      await Promise.all([fetchStats(), fetchCourses(filter, search)]);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 1026) {
        setDeleteError('Cannot delete — students enrolled. Contact Admin.');
      } else {
        setDeleteError('Delete failed. Please try again.');
      }
    }
  };

  const handleSubmit = async (course) => {
    try {
      await submitCourse(course.id);
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, status: 'PENDING', rejectedReason: null } : c
        )
      );
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 1023) {
        setErrorModal({
          title:   'Không thể gửi duyệt',
          message: 'Khóa học không ở trạng thái hợp lệ để gửi duyệt.',
        });
      } else if (code === 1024) {
        setErrorModal({
          title:   'Thiếu nội dung',
          message: 'Khóa học cần có ít nhất 1 chương và 1 bài học trước khi gửi duyệt.',
        });
      } else {
        console.error('submitCourse error:', err);
      }
    }
  };

  const handleCancelPending = async () => {
    if (!cancelConfirm) return;
    try {
      await cancelPendingCourse(cancelConfirm.id);
      setCourses((prev) =>
        prev.map((c) =>
          c.id === cancelConfirm.id ? { ...c, status: 'DRAFT' } : c
        )
      );
      setCancelConfirm(null);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === 1025) {
        setErrorModal({
          title:   'Không thể hủy',
          message: 'Khóa học không ở trạng thái chờ duyệt.',
        });
      } else {
        console.error('cancelPendingCourse error:', err);
      }
    }
  };

  const handleUnpublish = (course) => {
    setUnpublishConfirm(course);
  };

  const handleUnpublishConfirm = async () => {
    if (!unpublishConfirm) return;
    try {
      await unpublishCourse(unpublishConfirm.id);
      setCourses((prev) =>
        prev.map((c) =>
          c.id === unpublishConfirm.id ? { ...c, status: 'UNLISTED' } : c
        )
      );
      setUnpublishConfirm(null);
    } catch (err) {
      console.error('unpublishCourse error:', err);
    }
  };

  const handleRepublish = (course) => {
    setRepublishConfirm(course);
  };

  const handleRepublishConfirm = async () => {
    if (!republishConfirm) return;
    try {
      await republishCourse(republishConfirm.id);
      setCourses((prev) =>
        prev.map((c) =>
          c.id === republishConfirm.id ? { ...c, status: 'PUBLISHED' } : c
        )
      );
      setRepublishConfirm(null);
    } catch (err) {
      console.error('republishCourse error:', err);
    }
  };

  return {
    courses,
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
  };
}