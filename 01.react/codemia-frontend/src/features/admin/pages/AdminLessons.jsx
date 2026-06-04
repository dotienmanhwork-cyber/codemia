// src/features/admin/pages/AdminLessons.jsx
import { useState, useMemo, useContext } from 'react';
import { DashboardSearchContext } from '@/layouts/DashboardLayout';
import PageHeader  from '../../../shared/components/dashboard-ui/PageHeader';
import SearchBar   from '../../../shared/components/dashboard-ui/SearchBar';
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge';
import Pagination  from '../../../shared/components/dashboard-ui/Pagination';
import ConfirmModal from '../../../shared/components/dashboard-ui/ConfirmModal';
import FormModal   from '../../../shared/components/dashboard-ui/FormModal';

/* ── Mock data ── */
const MOCK_LESSONS = [
  { id: 1,  title: 'Introduction to React Hooks',   course: 'Advanced React Patterns', type: 'video',    duration: '14m', order: 1  },
  { id: 2,  title: 'useState & useEffect Deep Dive', course: 'Advanced React Patterns', type: 'video',    duration: '22m', order: 2  },
  { id: 3,  title: 'Custom Hooks Workshop',          course: 'Advanced React Patterns', type: 'exercise', duration: '—',   order: 3  },
  { id: 4,  title: 'Design Thinking Overview',       course: 'UI/UX Fundamentals',      type: 'video',    duration: '18m', order: 1  },
  { id: 5,  title: 'Wireframing Basics',             course: 'UI/UX Fundamentals',      type: 'video',    duration: '20m', order: 2  },
  { id: 6,  title: 'Color & Typography Quiz',        course: 'UI/UX Fundamentals',      type: 'exercise', duration: '—',   order: 3  },
  { id: 7,  title: 'Pandas Essentials',              course: 'Python for Data Science',  type: 'video',    duration: '25m', order: 1  },
  { id: 8,  title: 'Data Visualization',             course: 'Python for Data Science',  type: 'video',    duration: '30m', order: 2  },
  { id: 9,  title: 'Type Annotations Basics',        course: 'TypeScript Deep Dive',     type: 'video',    duration: '17m', order: 1  },
  { id: 10, title: 'Generics & Utility Types',       course: 'TypeScript Deep Dive',     type: 'video',    duration: '28m', order: 2  },
];

const PAGE_SIZE = 7;
const typeVariant = { video: 'blue', exercise: 'purple' };
const typeIcon    = { video: 'player-play', exercise: 'code' };

const ActBtn = ({ children, variant = 'ghost', onClick }) => {
  const s = {
    ghost: { background: 'var(--surface)', color: 'var(--ink-2)', border: '0.5px solid var(--border)' },
    red:   { background: 'var(--red-bg)', color: 'var(--red)',   border: '0.5px solid var(--red-bg)'  },
  };
  const h = { ghost: 'var(--border-faint)', red: '#ffc8c4' };
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11, fontWeight: 600, padding: '4px 10px',
        borderRadius: 'var(--radius-xs)', cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.12s', ...s[variant],
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = h[variant]}
      onMouseLeave={(e) => e.currentTarget.style.background = s[variant].background}
    >
      {children}
    </button>
  );
};

/* ── Field component for form ── */
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>{label}</label>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      height: 34, border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '0 10px',
      fontSize: 13, color: 'var(--ink)', outline: 'none',
      fontFamily: 'inherit', background: 'var(--bg)',
      transition: 'border-color 0.15s',
    }}
    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(140,6,216,0.08)'; }}
    onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
  />
);

/* ══════════════════════════════════════════════
   AdminLessons
══════════════════════════════════════════════ */
export default function AdminLessons() {
  const [lessons,  setLessons]  = useState(MOCK_LESSONS);
  const { keyword: search, setKeyword: setSearch } = useContext(DashboardSearchContext);
  const [page,     setPage]     = useState(1);
  const [confirm,  setConfirm]  = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [draft,    setDraft]    = useState({ title: '', course: '', type: 'video', duration: '' });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return lessons.filter(
      (l) => l.title.toLowerCase().includes(q) || l.course.toLowerCase().includes(q)
    );
  }, [lessons, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openAdd() {
    setEditing(null);
    setDraft({ title: '', course: '', type: 'video', duration: '' });
    setFormOpen(true);
  }

  function openEdit(lesson) {
    setEditing(lesson);
    setDraft({ title: lesson.title, course: lesson.course, type: lesson.type, duration: lesson.duration });
    setFormOpen(true);
  }

  function handleSave() {
    if (!draft.title.trim() || !draft.course.trim()) return;
    if (editing) {
      setLessons((prev) => prev.map((l) => l.id === editing.id ? { ...l, ...draft } : l));
    } else {
      setLessons((prev) => [...prev, { id: Date.now(), ...draft, order: prev.length + 1 }]);
    }
    setFormOpen(false);
  }

  function handleDelete() {
    setLessons((prev) => prev.filter((l) => l.id !== confirm.id));
    setConfirm(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        title="Bài học"
        subtitle="Quản lý tất cả bài học trong từng khóa học."
        action={
          <button
            onClick={openAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 15px', background: 'var(--ink)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2d2f31'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--ink)'}
          >
            <i className="ti ti-plus" style={{ fontSize: 14 }} />
            Thêm bài học
          </button>
        }
      />

      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
      }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '0.5px solid var(--border)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {filtered.length} bài học
          </span>
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Tìm tên bài học, khóa học…"
            width={240}
          />
        </div>

        <table className="dt">
          <thead>
            <tr>
              <th>#</th>
              <th>Bài học</th>
              <th>Khóa học</th>
              <th>Loại</th>
              <th>Thời lượng</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '32px 16px' }}>
                  Không tìm thấy bài học nào
                </td>
              </tr>
            )}
            {paged.map((l) => (
              <tr key={l.id}>
                <td style={{ color: 'var(--ink-3)', fontSize: 12 }}>{l.order}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <i
                      className={`ti ti-${typeIcon[l.type]}`}
                      style={{ fontSize: 14, color: 'var(--ink-3)', flexShrink: 0 }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{l.title}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--ink-2)', fontSize: 12.5 }}>{l.course}</td>
                <td>
                  <StatusBadge
                    label={l.type === 'video' ? 'Video' : 'Bài tập'}
                    variant={typeVariant[l.type]}
                  />
                </td>
                <td style={{ color: 'var(--ink-3)', fontSize: 12.5 }}>{l.duration}</td>
                <td>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <ActBtn variant="ghost" onClick={() => openEdit(l)}>Chỉnh sửa</ActBtn>
                    <ActBtn variant="red"   onClick={() => setConfirm(l)}>Xóa</ActBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* Form modal */}
      <FormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSave}
        title={editing ? 'Chỉnh sửa bài học' : 'Thêm bài học'}
        submitLabel={editing ? 'Lưu thay đổi' : 'Thêm bài học'}
      >
        <Field label="Tên bài học">
          <Input
            value={draft.title}
            onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
            placeholder="Ví dụ: Giới thiệu về React Hooks"
          />
        </Field>
        <Field label="Khóa học">
          <Input
            value={draft.course}
            onChange={(v) => setDraft((d) => ({ ...d, course: v }))}
            placeholder="Ví dụ: Các mẫu thiết kế React nâng cao"
          />
        </Field>
        <Field label="Loại">
          <div style={{ display: 'flex', gap: 8 }}>
            {['video', 'exercise'].map((t) => (
              <button
                key={t}
                onClick={() => setDraft((d) => ({ ...d, type: t }))}
                style={{
                  flex: 1, padding: '7px 0',
                  borderRadius: 'var(--radius-sm)',
                  border: `0.5px solid ${draft.type === t ? 'var(--purple)' : 'var(--border)'}`,
                  background: draft.type === t ? 'var(--purple-light)' : 'var(--surface)',
                  color: draft.type === t ? 'var(--purple-dim)' : 'var(--ink-2)',
                  fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.12s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <i className={`ti ti-${typeIcon[t]}`} style={{ fontSize: 13 }} />
                {t === 'video' ? 'Video' : 'Bài tập'}
              </button>
            ))}
          </div>
        </Field>
        {draft.type === 'video' && (
          <Field label="Thời lượng">
            <Input
              value={draft.duration}
              onChange={(v) => setDraft((d) => ({ ...d, duration: v }))}
              placeholder="Ví dụ: 14 phút"
            />
          </Field>
        )}
      </FormModal>

      {/* Confirm delete */}
      {confirm && (
        <ConfirmModal
          open
          onClose={() => setConfirm(null)}
          onConfirm={handleDelete}
          title={`Xóa "${confirm.title}"?`}
          description="Bài học này sẽ bị xóa vĩnh viễn khỏi khóa học."
          confirmLabel="Xóa bài học"
          danger
        />
      )}
    </div>
  );
}
