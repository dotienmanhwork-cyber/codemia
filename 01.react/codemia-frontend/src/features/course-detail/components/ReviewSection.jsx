// features/course-detail/components/ReviewSection.jsx
import { useState, useEffect } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import {
  getCourseReviews,
  getMyReview,
  submitReview,
  updateReview,
  deleteReview,
} from "../api/review.api";

// ─── Error code → message ──────────────────────────────────────────────────────
const API_ERROR_MAP = {
  1013: "Bạn chưa đăng ký khóa học này.",
  1027: "Bạn cần hoàn thành 100% khóa học để viết đánh giá.",
  1028: "Bạn đã đánh giá khóa học này rồi.",
};

function getApiError(err) {
  const code = err?.response?.data?.code ?? err?.code;
  return API_ERROR_MAP[code] ?? "Có lỗi xảy ra, vui lòng thử lại.";
}

// ─── StarRating ────────────────────────────────────────────────────────────────
function StarRating({ value = 0, onChange, size = 18 }) {
  const [hovered, setHovered] = useState(0);
  const interactive = !!onChange;
  const display = hovered || value;

  return (
    <div
      className="flex gap-0.5"
      style={{ cursor: interactive ? "pointer" : "default" }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={star <= display ? "#F59E0B" : "none"}
          stroke={star <= display ? "#F59E0B" : "#D1D5DB"}
          strokeWidth={1.5}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange(star)}
          style={{ flexShrink: 0 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      ))}
    </div>
  );
}

// ─── ReviewCard ────────────────────────────────────────────────────────────────
function ReviewCard({ review, isOwn, onEdit, onDelete }) {
  return (
    <div className="flex gap-3 py-5 border-b border-gray-100 last:border-0">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {review.studentAvatar ? (
          <img src={review.studentAvatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-purple-600">
            {(review.studentName || "?")[0].toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <span className="font-semibold text-gray-800 text-sm">{review.studentName}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating value={review.rating} size={13} />
              <span className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                })}
              </span>
            </div>
          </div>
          {isOwn && (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={onEdit}
                className="text-xs font-medium transition-colors"
                style={{ color: "#8C06D8" }}
              >
                Sửa
              </button>
              <button
                onClick={onDelete}
                className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          )}
        </div>

        {review.comment && (
          <p className="text-sm text-gray-600 leading-relaxed mt-2">{review.comment}</p>
        )}

        {/* Teacher reply */}
        {review.teacherReply && (
          <div className="mt-3 pl-3 border-l-2 border-purple-200 bg-purple-50 rounded-r-lg p-3">
            <p className="text-xs font-semibold mb-1" style={{ color: "#8C06D8" }}>
              Phản hồi từ giảng viên
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">{review.teacherReply}</p>
            {review.repliedAt && (
              <p className="text-xs text-gray-400 mt-1">
                {new Date(review.repliedAt).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ReviewForm ────────────────────────────────────────────────────────────────
function ReviewForm({ courseSlug, initialData, onSuccess, onCancel }) {
  const [rating, setRating] = useState(initialData?.rating ?? 0);
  const [comment, setComment] = useState(initialData?.comment ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initialData?.id;

  const handleSubmit = async () => {
    if (!rating) {
      setError("Vui lòng chọn số sao trước khi gửi.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = { rating, comment: comment.trim() };
      const res = isEdit
        ? await updateReview(courseSlug, initialData.id, payload)
        : await submitReview(courseSlug, payload);

      if (res.code === 1000) {
        onSuccess(res.result);
      } else {
        setError(API_ERROR_MAP[res.code] ?? "Có lỗi xảy ra.");
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-6">
      <h3 className="font-semibold text-gray-800 mb-4 text-sm">
        {isEdit ? "Chỉnh sửa đánh giá của bạn" : "Viết đánh giá của bạn"}
      </h3>

      {/* Star picker */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Xếp hạng *</p>
        <StarRating value={rating} onChange={setRating} size={28} />
        {rating > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            {["", "Tệ", "Không tốt", "Bình thường", "Tốt", "Xuất sắc"][rating]}
          </p>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Chia sẻ trải nghiệm của bạn về khóa học này... (không bắt buộc)"
        rows={3}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none transition focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
      />

      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "#8C06D8" }}
        >
          {loading ? "Đang gửi..." : isEdit ? "Lưu thay đổi" : "Gửi đánh giá"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ReviewSection (main export) ──────────────────────────────────────────────
/**
 * @param {string}  courseSlug
 * @param {boolean} enrolled       — từ CourseResponse.enrolled
 * @param {number}  averageRating  — có thể null
 * @param {number}  reviewCount    — có thể null
 */
export default function ReviewSection({ courseSlug, enrolled, averageRating, reviewCount }) {
  const { user, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(undefined); // undefined = chưa fetch, null = đã fetch nhưng chưa review
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch reviews + my review
  useEffect(() => {
    fetchReviews();
  }, [courseSlug]);

  useEffect(() => {
    if (isAuthenticated && enrolled) fetchMyReview();
    else setMyReview(null);
  }, [courseSlug, isAuthenticated, enrolled]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await getCourseReviews(courseSlug);
      setReviews(res.result ?? []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReview = async () => {
    try {
      const res = await getMyReview(courseSlug);
      setMyReview(res.result ?? null);
    } catch {
      setMyReview(null);
    }
  };

  // Cập nhật list sau khi submit / edit
  const handleReviewSuccess = (savedReview) => {
    setMyReview(savedReview);
    setEditMode(false);
    setReviews((prev) => {
      const exists = prev.find((r) => r.id === savedReview.id);
      return exists
        ? prev.map((r) => (r.id === savedReview.id ? savedReview : r))
        : [savedReview, ...prev];
    });
  };

  const handleDelete = async () => {
    if (!myReview) return;
    try {
      await deleteReview(courseSlug, myReview.id);
      setReviews((prev) => prev.filter((r) => r.id !== myReview.id));
      setMyReview(null);
      setConfirmDelete(false);
    } catch {
      alert("Không thể xóa đánh giá, vui lòng thử lại.");
    }
  };

  // Computed
  const displayRating = averageRating;
  const displayCount = reviewCount ?? reviews.length;
  const canSubmitNew = isAuthenticated && enrolled && myReview === null && !editMode;

  return (
    <section className="mt-10 pt-8 border-t border-gray-100">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Đánh giá từ học viên</h2>
        {displayRating != null && (
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-amber-500">
              {Number(displayRating).toFixed(1)}
            </span>
            <StarRating value={Math.round(displayRating)} size={15} />
            <span className="text-sm text-gray-400">({displayCount} đánh giá)</span>
          </div>
        )}
        {!displayRating && !loading && (
          <span className="text-sm text-gray-400">Chưa có đánh giá</span>
        )}
      </div>

      {/* ── My review box (đã review, không ở editMode) ── */}
      {myReview && !editMode && (
        <div className="mb-5 p-4 bg-purple-50 border border-purple-100 rounded-xl">
          <p className="text-xs font-semibold mb-3" style={{ color: "#8C06D8" }}>
            Đánh giá của bạn
          </p>
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">Xác nhận xóa đánh giá?</p>
              <button
                onClick={handleDelete}
                className="text-sm font-semibold text-red-500 hover:text-red-700"
              >
                Xóa
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Hủy
              </button>
            </div>
          ) : (
            <ReviewCard
              review={myReview}
              isOwn
              onEdit={() => setEditMode(true)}
              onDelete={() => setConfirmDelete(true)}
            />
          )}
        </div>
      )}

      {/* ── Edit form ── */}
      {editMode && myReview && (
        <ReviewForm
          courseSlug={courseSlug}
          initialData={myReview}
          onSuccess={handleReviewSuccess}
          onCancel={() => setEditMode(false)}
        />
      )}

      {/* ── Submit form (chưa review) ── */}
      {canSubmitNew && (
        <ReviewForm
          courseSlug={courseSlug}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* ── Info notices ── */}
      {!isAuthenticated && (
        <div className="mb-5 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
          <a href="/login" className="font-semibold hover:underline" style={{ color: "#8C06D8" }}>
            Đăng nhập
          </a>{" "}
          để viết đánh giá cho khóa học.
        </div>
      )}
      {isAuthenticated && !enrolled && (
        <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700 text-center">
          Đăng ký và hoàn thành 100% khóa học để có thể đánh giá.
        </div>
      )}

      {/* ── Review list ── */}
      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Đang tải đánh giá...
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center text-gray-400 text-sm">
          Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ!
        </div>
      ) : (
        <div>
          {reviews
            .filter((r) => r.id !== myReview?.id)  // ẩn review của mình (đã hiển thị ở box trên)
            .map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                isOwn={false}
              />
            ))}
        </div>
      )}
    </section>
  );
}