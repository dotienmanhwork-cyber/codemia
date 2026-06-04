// src/features/teacher/components/CreateCourseModal.jsx
import { useState } from 'react';
import FormModal from '../../../shared/components/dashboard-ui/FormModal';

/* Danh mục cứng — thay bằng GET /categories khi BE có endpoint */
const CATEGORIES = [
  { id: 1, name: 'Frontend' },
  { id: 2, name: 'Backend'  },
  { id: 3, name: 'Data'     },
  { id: 4, name: 'DevOps'   },
  { id: 5, name: 'Mobile'   },
  { id: 6, name: 'Database' },
];

const INIT_FORM = { title: '', categoryId: 1, price: '', description: '' };

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

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>{label}</label>
      {children}
    </div>
  );
}

/**
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Function} onSubmit - (data: { title, categoryId, price, description }) => Promise
 */
export default function CreateCourseModal({ open, onClose, onSubmit }) {
  const [form, setForm]       = useState(INIT_FORM);
  const [saving, setSaving]   = useState(false);

  function handleClose() {
    setForm(INIT_FORM);
    onClose();
  }

  async function handleSubmit() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title:       form.title.trim(),
        categoryId:  Number(form.categoryId),
        price:       Number(form.price) || 0,
        description: form.description.trim(),
      });
      setForm(INIT_FORM); // reset sau khi thành công
    } finally {
      setSaving(false);
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title="Tạo khóa học mới"
      onSubmit={handleSubmit}
      submitLabel={saving ? 'Đang tạo…' : 'Tạo khóa học'}
      width={500}
    >
      <Field label="Tên khóa học *">
        <input
          style={inputStyle}
          placeholder="Ví dụ: React Mastery: Từ Cơ Bản Đến Nâng Cao"
          value={form.title}
          onChange={set('title')}
        />
      </Field>

      <Field label="Danh mục">
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={form.categoryId}
          onChange={set('categoryId')}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Giá (VND)">
        <input
          style={inputStyle}
          placeholder="Ví dụ: 299000"
          type="number"
          min="0"
          step="1000"
          value={form.price}
          onChange={set('price')}
        />
      </Field>

      <Field label="Mô tả ngắn">
        <textarea
          style={{ ...inputStyle, height: 80, padding: '8px 12px', resize: 'vertical', lineHeight: 1.5 }}
          placeholder="Mô tả ngắn về nội dung khóa học…"
          value={form.description}
          onChange={set('description')}
        />
      </Field>
    </FormModal>
  );
}