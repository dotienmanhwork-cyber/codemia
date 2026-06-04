// src/features/teacher/components/TeacherCourseTable.jsx
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/shared/components/dashboard-ui/StatusBadge';
import Pagination  from '@/shared/components/dashboard-ui/Pagination';
import { formatVND } from '@/shared/utils/format';

/* ─── Constants ─────────────────────────────── */
const STATUS_LABEL = {
  PUBLISHED: 'Đã xuất bản',
  UNLISTED:  'Đã ẩn',
  DRAFT:     'Bản nháp',
  PENDING:   'Chờ duyệt',
  REJECTED:  'Bị từ chối',
  SUSPENDED: 'Bị khóa bởi admin',
};

const STATUS_VARIANT = {
  PUBLISHED: 'green',
  UNLISTED:  'neutral',
  DRAFT:     'neutral',
  PENDING:   'amber',
  REJECTED:  'rejected',
  SUSPENDED: 'red',
};

/* ─── Action button ──────────────────────────── */
const BTN_STYLE = {
  ghost:  { bg: 'var(--surface)',      color: 'var(--ink-2)',      border: '0.5px solid var(--border)',        hover: 'var(--border-faint)' },
  purple: { bg: 'var(--purple-light)', color: 'var(--purple-dim)', border: '0.5px solid var(--purple-light)',  hover: '#e8c6ff'             },
  blue:   { bg: 'var(--blue-bg)',      color: 'var(--blue)',       border: '0.5px solid var(--blue-bg)',       hover: '#cce2f7'             },
  red:    { bg: 'var(--red-bg)',       color: 'var(--red)',        border: '0.5px solid var(--red-bg)',        hover: '#ffc8c4'             },
  orange: { bg: '#fff7ed',             color: '#c2410c',           border: '0.5px solid #fed7aa',              hover: '#ffedd5'             },
};

function ActBtn({ children, variant = 'ghost', onClick, title, disabled = false }) {
  const s = BTN_STYLE[variant];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={title}
      disabled={disabled}
      style={{
        fontSize: 11, fontWeight: 600, padding: '4px 10px', minHeight: 28,
        borderRadius: 'var(--radius-xs)', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', transition: 'all 0.12s',
        background: s.bg, color: s.color, border: s.border,
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = s.hover; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = s.bg;   }}
    >
      {children}
    </button>
  );
}

/* ─── Helpers ────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function fmtRevenue(val) {
  if (val == null) return formatVND(0);
  return formatVND(Number(val));
}

function fmtPrice(val) {
  if (val == null || Number(val) === 0) return 'Miễn phí';
  return formatVND(Number(val));
}

/* ─── Empty / Loading rows ───────────────────── */
function PlaceholderRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '36px 16px', fontSize: 13 }}>
        {text}
      </td>
    </tr>
  );
}

export default function TeacherCourseTable({
  courses,
  loading,
  page,
  totalPages,
  onPageChange,
  onSubmit,
  onDelete,
  onRejectedClick,
  onCancelPending,
  onUnpublish,
  onRepublish,
}) {
  const navigate = useNavigate();

  return (
    <>
      <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <table className="dt min-w-[480px]">
          <thead>
            <tr>
              <th>Khóa học</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Bài học</th>
              <th>Học viên</th>
              <th>Đánh giá</th>
              <th>Doanh thu</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && <PlaceholderRow colSpan={9} text="Đang tải…" />}

            {!loading && courses.length === 0 && (
              <PlaceholderRow colSpan={9} text="Không tìm thấy khóa học nào" />
            )}

            {!loading && courses.map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                    Đã tạo {fmtDate(c.createdAt)}
                  </div>
                </td>

                <td>
                  <StatusBadge label={c.categoryName ?? '—'} variant="blue" />
                </td>

                <td style={{ fontSize: 13, fontWeight: 600, color: Number(c.price) === 0 ? 'var(--green)' : 'var(--ink-2)' }}>
                  {fmtPrice(c.price)}
                </td>

                <td style={{ color: 'var(--ink-2)', fontSize: 13 }}>
                  {c.totalLessons ?? 0} bài học
                </td>

                <td style={{ color: 'var(--ink-2)', fontSize: 13 }}>
                  {(c.totalStudents ?? 0).toLocaleString('vi-VN')}
                </td>

                <td style={{ color: 'var(--amber)', fontSize: 13 }}>
                  {c.rating ? `★ ${c.rating}` : '—'}
                </td>

                <td style={{ fontWeight: 600, color: 'var(--green)', fontSize: 13 }}>
                  {fmtRevenue(c.revenue)}
                </td>

                <td>
                  {c.status === 'REJECTED' ? (
                    <StatusBadge
                      label="Từ chối ›"
                      variant="rejected"
                      clickable
                      onClick={() => onRejectedClick(c)}
                    />
                  ) : (
                    <StatusBadge
                      label={STATUS_LABEL[c.status] ?? c.status}
                      variant={STATUS_VARIANT[c.status] ?? 'neutral'}
                    />
                  )}
                </td>

                <td>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(c.status === 'DRAFT' || c.status === 'REJECTED') && (
                      <ActBtn
                        variant="purple"
                        onClick={() => onSubmit(c)}
                        title={c.status === 'REJECTED' ? 'Gửi duyệt lại' : 'Gửi để duyệt'}
                      >
                        <i className="ti ti-send" style={{ fontSize: 11, marginRight: 3 }} />
                        {c.status === 'REJECTED' ? 'Gửi lại' : 'Gửi duyệt'}
                      </ActBtn>
                    )}

                    {c.status === 'PENDING' && (
                      <ActBtn
                        variant="orange"
                        onClick={() => onCancelPending(c)}
                        title="Hủy yêu cầu duyệt — chuyển về Bản nháp"
                      >
                        <i className="ti ti-x" style={{ fontSize: 11, marginRight: 3 }} />
                        Hủy duyệt
                      </ActBtn>
                    )}

                    {c.status === 'PUBLISHED' && (
                      <ActBtn
                        variant="ghost"
                        onClick={() => onUnpublish(c)}
                        title="Ẩn khỏi danh mục — học viên cũ vẫn học được"
                      >
                        <i className="ti ti-eye-off" style={{ fontSize: 11, marginRight: 3 }} />
                        Ẩn khóa học
                      </ActBtn>
                    )}

                    {c.status === 'UNLISTED' && (
                      <ActBtn
                        variant="blue"
                        onClick={() => onRepublish(c)}
                        title="Xuất bản lại — không cần duyệt"
                      >
                        <i className="ti ti-eye" style={{ fontSize: 11, marginRight: 3 }} />
                        Xuất bản lại
                      </ActBtn>
                    )}

                    <ActBtn
                      variant="purple"
                      onClick={() => navigate(`/teacher/courses/${c.id}/edit`)}
                      disabled={c.status === 'PENDING'}
                      title={c.status === 'PENDING' ? 'Không thể chỉnh sửa khi đang chờ duyệt' : 'Chỉnh sửa khóa học'}
                    >
                      <i className="ti ti-edit" style={{ fontSize: 11, marginRight: 3 }} />
                      Chỉnh sửa
                    </ActBtn>

                    <ActBtn
                      variant="ghost"
                      onClick={() => navigate(`/teacher/students?courseId=${c.id}`)}
                      title="Xem danh sách học viên"
                    >
                      <i className="ti ti-users" style={{ fontSize: 11, marginRight: 3 }} />
                      Học viên
                    </ActBtn>

                    {/* Xóa — disabled khi đã có student enroll, chỉ admin mới xóa được lúc đó */}
                    <ActBtn
                      variant="red"
                      onClick={() => onDelete(c)}
                      disabled={(c.totalStudents ?? 0) > 0}
                      title={
                        (c.totalStudents ?? 0) > 0
                          ? `Không thể xóa — đã có ${c.totalStudents} học viên đăng ký`
                          : 'Xóa khóa học'
                      }
                    >
                      <i className="ti ti-trash" style={{ fontSize: 11 }} />
                    </ActBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </>
  );
}