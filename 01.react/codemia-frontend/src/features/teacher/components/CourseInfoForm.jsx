// src/features/teacher/components/CourseInfoForm.jsx
import { useRef, useState } from "react";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";

/* ── Flatten category tree → flat array for <select> ── */
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

const inputStyle = {
  width: '100%',
  height: 36,
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '0 12px',
  fontSize: 13,
  color: 'var(--ink)',
  background: 'var(--bg)',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

function Field({ label, required, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
        {label}
        {required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)' }}>{hint}</p>
      )}
    </div>
  );
}

function FocusInput({ style, ...props }) {
  return (
    <input
      style={{ ...inputStyle, ...style }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--purple)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(140,6,216,0.08)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      {...props}
    />
  );
}

/* ── Thumbnail Upload Field ── */
function ThumbnailUpload({ value, onChange }) {
  const fileRef = useRef();
  const { uploading, upload } = useCloudinaryUpload();
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState('');

  const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_MB = 5;

  async function handleFile(file) {
    setLocalError('');
    if (!file) return;

    if (!ACCEPT.includes(file.type)) {
      setLocalError('Chỉ chấp nhận ảnh JPG, PNG, WEBP');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setLocalError(`Ảnh phải có dung lượng dưới ${MAX_MB}MB`);
      return;
    }

    try {
      const url = await upload(file);
      onChange('thumbnailUrl', url);
    } catch (e) {
      setLocalError(e.message || 'Tải lên thất bại, vui lòng thử lại');
    }
  }

  function onInputChange(e) {
    handleFile(e.target.files[0]);
    // reset input để có thể chọn lại cùng file
    e.target.value = '';
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  const hasThumbnail = Boolean(value);

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

      {/* Thumbnail preview — cố định 160×90px (16:9) */}
      <div
        onClick={() => !uploading && fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          position: 'relative',
          flexShrink: 0,
          width: 160,
          height: 90,
          borderRadius: 'var(--radius-sm)',
          border: dragOver
            ? '1.5px dashed var(--purple)'
            : hasThumbnail
              ? '0.5px solid var(--border)'
              : '1.5px dashed var(--border)',
          background: dragOver
            ? 'rgba(140,6,216,0.04)'
            : hasThumbnail
              ? 'transparent'
              : 'var(--bg)',
          cursor: uploading ? 'wait' : 'pointer',
          overflow: 'hidden',
          transition: 'border-color 0.15s, background 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {hasThumbnail ? (
          <>
            <img
              src={value}
              alt="Thumbnail"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              className="thumbnail-hover-overlay"
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 5,
                opacity: 0,
                transition: 'opacity 0.18s',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
            >
              <i className="ti ti-camera" style={{ fontSize: 14 }} />
              Thay đổi ảnh
            </div>
          </>
        ) : uploading ? (
          <>
            <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 18, color: 'var(--purple)' }} />
            <span style={{ fontSize: 11, color: 'var(--ink-2)' }}>Đang tải…</span>
          </>
        ) : (
          <>
            <i className="ti ti-photo-up" style={{ fontSize: 20, color: 'var(--ink-3)' }} />
            <span style={{ fontSize: 10.5, color: 'var(--ink-3)', textAlign: 'center', padding: '0 8px' }}>
              Kéo thả hoặc click để chọn ảnh
            </span>
          </>
        )}
      </div>

      {/* Right side: hint + actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 2 }}>
        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          JPG, PNG, WEBP · Tỉ lệ 16:9<br />
          Khuyên dùng 1280×720px · Tối đa 5MB
        </p>

        <button
          type="button"
          onClick={() => !uploading && fileRef.current.click()}
          disabled={uploading}
          style={{
            alignSelf: 'flex-start',
            padding: '4px 10px',
            fontSize: 11.5, fontWeight: 600,
            color: 'var(--ink-2)',
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: uploading ? 0.5 : 1,
          }}
        >
          <i className="ti ti-upload" style={{ fontSize: 11, marginRight: 4 }} />
          {uploading ? 'Đang tải lên…' : 'Chọn ảnh'}
        </button>

        {hasThumbnail && !uploading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange('thumbnailUrl', ''); }}
            style={{
              alignSelf: 'flex-start',
              padding: '4px 10px',
              fontSize: 11.5, fontWeight: 600,
              color: 'var(--red)',
              background: 'var(--red-bg)',
              border: '0.5px solid var(--red-border, #fecaca)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <i className="ti ti-trash" style={{ fontSize: 11, marginRight: 4 }} />
            Xóa ảnh
          </button>
        )}

        {localError && (
          <p style={{
            margin: 0, fontSize: 11.5, color: '#dc2626',
            background: '#fef2f2', border: '0.5px solid #fecaca',
            borderRadius: 'var(--radius-sm)', padding: '5px 9px',
          }}>
            {localError}
          </p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT.join(',')}
        style={{ display: 'none' }}
        onChange={onInputChange}
      />
    </div>
  );
}

/**
 * Props:
 *   form        - { title, categoryId, price, description, thumbnailUrl }
 *   onChange    - (field, value) => void
 *   onSave      - () => void
 *   saving      - boolean
 *   saveError   - string
 *   status      - string (DRAFT | PENDING | PUBLISHED | REJECTED)
 *   onSubmit    - () => void
 *   submitting  - boolean
 *   categories  - category tree array từ BE
 */
export default function CourseInfoForm({
  form,
  onChange,
  onSave,
  saving,
  saveError = '',
  status,
  onSubmit,
  submitting,
  categories = [],
  isDirty = true,
}) {
  const canSubmit    = status === 'DRAFT' || status === 'REJECTED';
  const isPending    = status === 'PENDING';
  const isPublished  = status === 'PUBLISHED';
  const saveBtnDisabled = saving || isPending || !isDirty;

  const flatCategories = flattenCategories(categories);

  const statusMeta = {
    DRAFT:     { label: 'Bản nháp',       color: 'var(--ink-3)',  bg: 'var(--border-faint)' },
    PENDING:   { label: 'Chờ duyệt',     color: 'var(--amber)',  bg: '#fff8e1' },
    PUBLISHED: { label: 'Đã xuất bản',   color: 'var(--green)',  bg: 'var(--green-bg)' },
    REJECTED:  { label: 'Bị từ chối',    color: 'var(--red)',    bg: 'var(--red-bg)' },
  };

  const sm = statusMeta[status] ?? statusMeta.DRAFT;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 16px',
        borderBottom: '0.5px solid var(--border)',
      }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
          Thông tin khóa học
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          padding: '3px 10px', borderRadius: 20,
          color: sm.color, background: sm.bg,
        }}>
          {sm.label}
        </span>
      </div>

      {/* Warning banner — chỉ hiện khi PUBLISHED */}
      {isPublished && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 9,
          padding: '10px 16px',
          background: '#fffbeb',
          borderBottom: '0.5px solid #fde68a',
        }}>
          <i className="ti ti-alert-triangle" style={{
            fontSize: 15, color: '#d97706', marginTop: 1, flexShrink: 0,
          }} aria-hidden="true" />
          <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
            Khóa học này đang hoạt động.{' '}
            {isDirty
              ? <>Lưu thay đổi về <strong style={{ fontWeight: 700 }}>tiêu đề, giá hoặc mô tả</strong> sẽ đưa khóa học về <strong style={{ fontWeight: 700 }}>chờ duyệt</strong> và tạm ẩn khỏi danh mục. Đổi ảnh bìa sẽ lưu ngay mà không cần duyệt lại.</>
              : 'Thay đổi về tiêu đề, giá hoặc mô tả sẽ đưa khóa học trở lại trạng thái chờ duyệt. Thay đổi ảnh bìa không cần xét duyệt lại.'
            }
          </p>
        </div>
      )}

      {/* Form body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Thumbnail */}
        <Field
          label="Ảnh bìa"
          hint="Hiển thị trên danh sách khóa học và trang chi tiết. Khuyên dùng 1280×720px."
        >
          <ThumbnailUpload value={form.thumbnailUrl} onChange={onChange} />
        </Field>

        {/* Divider */}
        <div style={{ borderTop: '0.5px solid var(--border)', margin: '2px 0' }} />

        {/* Tên khóa học */}
        <Field label="Tên khóa học" required>
          <FocusInput
            value={form.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Ví dụ: Làm chủ React: Từ cơ bản đến nâng cao"
          />
        </Field>

        {/* Danh mục */}
        <Field label="Danh mục" required>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.categoryId}
            onChange={(e) => onChange('categoryId', e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--purple)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(140,6,216,0.08)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="">-- Chọn danh mục --</option>
            {flatCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </Field>

        {/* Giá */}
        <Field label="Giá (VND)">
          <FocusInput
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => onChange('price', e.target.value)}
            placeholder="Ví dụ: 299000 — để trống nếu miễn phí"
          />
        </Field>

        {/* Mô tả */}
        <Field label="Mô tả ngắn">
          <textarea
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Mô tả ngắn gọn về khóa học…"
            rows={4}
            style={{
              ...inputStyle,
              height: 'auto',
              padding: '8px 12px',
              resize: 'vertical',
              lineHeight: 1.6,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--purple)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(140,6,216,0.08)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </Field>

        {/* Lỗi từ BE */}
        {saveError && (
          <p style={{
            fontSize: 12, color: '#dc2626',
            background: '#fef2f2', border: '0.5px solid #fecaca',
            borderRadius: 'var(--radius-sm)', padding: '8px 12px', margin: 0,
          }}>
            {saveError}
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 p-3 border-t border-[var(--border)] flex-wrap max-[767px]:justify-end">
        {isPending ? (
          <span className="text-xs text-[var(--ink-3)] flex-1 min-w-0 max-[767px]:hidden" style={{ color: 'var(--amber)' }}>
            <i className="ti ti-clock" style={{ marginRight: 4 }} />
            Đang chờ admin xét duyệt…
          </span>
        ) : canSubmit ? (
          <span className="text-xs text-[var(--ink-3)] flex-1 min-w-0 max-[767px]:hidden">
            Thêm ít nhất 1 chương và 1 bài học trước khi gửi duyệt.
          </span>
        ) : (
          <span />
        )}

        <div className="flex gap-2 shrink-0 max-[479px]:w-full max-[479px]:[&_button]:flex-1 max-[479px]:[&_button]:justify-center">
          <button
            onClick={onSave}
            disabled={saveBtnDisabled}
            style={{
              padding: '7px 14px',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              color: 'var(--ink-2)',
              fontSize: 12.5, fontWeight: 600,
              cursor: saveBtnDisabled ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: saveBtnDisabled ? 0.5 : 1,
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => { if (!saveBtnDisabled) e.currentTarget.style.background = 'var(--border-faint)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
          >
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>

          {canSubmit && (
            <button
              onClick={onSubmit}
              disabled={submitting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--purple)',
                color: '#fff',
                fontSize: 12.5, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: submitting ? 0.6 : 1,
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = 'var(--purple-dim)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--purple)'; }}
            >
              <i className="ti ti-send" style={{ fontSize: 12 }} />
              {submitting ? 'Đang gửi…' : (status === 'REJECTED' ? 'Gửi lại' : 'Gửi để duyệt')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}