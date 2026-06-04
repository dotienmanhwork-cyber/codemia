// src/features/checkout/pages/CartPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { orderApi } from "../api/order.api";
import { useAuth } from "../../../shared/context/AuthContext";
import toast from "react-hot-toast";
import {
  Trash2,
  Tag,
  Lock,
  ArrowRight,
  Percent,
  ShoppingBag,
  Award,
  Check,
  ShieldCheck
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────────── */
const formatVND = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);



// Deterministic slugify helper to generate valid course slugs from titles
const slugify = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^a-z0-9\s-]|[\t\n\r])/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

function StarRating({ value = 0 }) {
  const fullStars = Math.floor(value);
  const hasHalf = value % 1 >= 0.25 && value % 1 <= 0.75;
  const starsArray = [];
  
  for (let s = 1; s <= 5; s++) {
    if (s <= fullStars) {
      starsArray.push("full");
    } else if (s === fullStars + 1 && hasHalf) {
      starsArray.push("half");
    } else {
      starsArray.push("empty");
    }
  }

  return (
    <span className="flex items-center gap-0.5">
      {starsArray.map((type, idx) => (
        <span key={idx} className="relative inline-flex items-center text-amber-500">
          {type === "full" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.8">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )}
          {type === "empty" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )}
          {type === "half" && (
            <svg width="12" height="12" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth="1.8" className="relative">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" />
              <svg width="12" height="12" viewBox="0 0 24 24" className="absolute top-0 left-0 overflow-hidden w-1/2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.8" />
              </svg>
            </svg>
          )}
        </span>
      ))}
    </span>
  );
}

/* ─── CartItem ─────────────────────────────────────────────── */
function CartItem({ item, checked, onToggle, onRemove, removing }) {
  const rating      = item.courseRating;
  const ratingCount = item.courseRatingCount;
  const instructor  = item.instructorName || "Giảng viên Codemia";
  const isBestseller = item.isBestseller;

  const slug = slugify(item.courseTitle);

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 md:p-6 bg-white hover:bg-gray-50/30 transition-all duration-200">
      
      {/* Checkbox & Thumbnail Container */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Custom Checkbox */}
        <button
          onClick={() => onToggle(item.id)}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${
            checked 
              ? "bg-[#8c06d8] border-[#8c06d8] text-white shadow-sm" 
              : "bg-white border-gray-300 hover:border-gray-400"
          }`}
        >
          {checked && <Check size={13} strokeWidth={3} />}
        </button>

        {/* Course Thumbnail */}
        <Link to={`/courses/${slug}`} className="block relative group overflow-hidden rounded-lg border border-gray-100 flex-shrink-0">
          <img
            src={item.courseThumbnailUrl || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=60"}
            alt={item.courseTitle}
            className="w-28 h-18 md:w-32 md:h-20 object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=60"; }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        </Link>
      </div>

      {/* Course Info Middle Section */}
      <div className="flex-grow min-w-0 flex flex-col justify-between">
        <div>
          {/* Title */}
          <Link to={`/courses/${slug}`} className="block text-[15px] font-bold text-gray-900 leading-snug hover:text-[#8c06d8] transition-colors mb-1">
            {item.courseTitle}
          </Link>
          
          {/* Author */}
          <p className="text-xs text-gray-500 mb-1.5">
            Bởi <span className="font-medium text-gray-700">{instructor}</span>
          </p>

          {/* Badges + Rating */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {/* Rating block */}
            {rating !== null && rating !== undefined && rating > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[12.5px] font-bold text-amber-700 mt-0.5">
                  {rating.toFixed(1).replace(".", ",")}
                </span>
                <StarRating value={rating} />
                {ratingCount !== null && ratingCount !== undefined && (
                  <span className="text-xs text-gray-500">
                    ({ratingCount.toLocaleString("vi-VN")} xếp hạng)
                  </span>
                )}
              </div>
            )}
            
            {/* Bestseller badge */}
            {isBestseller && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Bán chạy nhất
              </span>
            )}

            {/* Cao cấp Badge */}
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10.5px] font-bold bg-purple-50 text-[#8c06d8] border border-purple-200">
              <Award size={11} className="stroke-[#8c06d8]" /> Cao cấp
            </span>
          </div>
        </div>

      </div>

      {/* Right Section: Actions & Price */}
      <div className="flex md:flex-col flex-row justify-between md:items-end border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 gap-4 flex-shrink-0 min-w-[130px]">
        {/* Price display */}
        <div className="flex md:flex-col flex-row items-baseline md:items-end justify-between md:justify-start gap-1.5 order-1 md:order-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-[#8c06d8]">
            <span className="text-[16px] md:text-[17px] font-extrabold tracking-tight">
              {formatVND(item.coursePrice)}
            </span>
            <Tag size={13} className="stroke-[#8c06d8] fill-purple-100" />
          </div>
          
          {item.courseOriginalPrice && item.courseOriginalPrice > item.coursePrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatVND(item.courseOriginalPrice)}
            </span>
          )}
        </div>

        {/* Actions (Delete) */}
        <div className="flex md:flex-col flex-row gap-x-4 gap-y-1 items-start md:items-end order-2 md:order-1">
          <button
            onClick={() => onRemove(item.id)}
            disabled={removing === item.id}
            className="text-xs text-[#8c06d8] hover:text-red-600 font-semibold cursor-pointer transition-colors flex items-center gap-1 py-1"
          >
            {removing === item.id ? (
              <span className="animate-spin rounded-full h-3 w-3 border-2 border-[#8c06d8] border-t-transparent" />
            ) : (
              "Xóa"
            )}
          </button>
        </div>
      </div>

    </div>
  );
}

/* ─── SelectAllBar ─────────────────────────────────────────── */
function SelectAllBar({ allChecked, someChecked, onToggleAll, total, selected }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleAll}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${
            allChecked
              ? "bg-[#8c06d8] border-[#8c06d8] text-white"
              : someChecked
              ? "bg-purple-100 border-[#8c06d8] text-[#8c06d8]"
              : "bg-white border-gray-300 hover:border-gray-400"
          }`}
        >
          {allChecked ? (
            <Check size={13} strokeWidth={3} />
          ) : someChecked ? (
            <span className="w-2.5 h-0.5 bg-[#8c06d8] rounded" />
          ) : null}
        </button>
        <span className="text-sm font-semibold text-gray-700">
          Chọn tất cả ({total} khóa học)
        </span>
      </div>

      {selected > 0 && selected < total && (
        <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-[#8c06d8] rounded-full border border-purple-100/60">
          Đã chọn {selected}
        </span>
      )}
    </div>
  );
}

/* ─── EmptyCart ─────────────────────────────────────────────── */
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-gray-100 shadow-sm max-w-lg mx-auto mt-6">
      <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-6 border border-purple-100/60 animate-bounce-slow">
        <ShoppingBag size={36} className="text-[#8c06d8]" />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Giỏ hàng của bạn đang trống</h2>
      <p className="text-sm md:text-base text-gray-500 max-w-sm mb-8 leading-relaxed">
        Có vẻ như bạn chưa chọn khóa học nào. Hãy tiếp tục khám phá các khóa học công nghệ hàng đầu trên Codemia!
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center px-8 py-3.5 bg-[#8c06d8] hover:bg-purple-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5"
      >
        Khám phá khóa học ngay
      </Link>
    </div>
  );
}

/* ─── LoadingSkeleton ─────────────────────────────────────────── */
function Skeleton({ className }) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-[85vh] bg-gray-50/50 py-12 px-4 md:px-8">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 flex gap-4">
                <Skeleton className="h-5 w-5 flex-shrink-0" />
                <Skeleton className="h-16 w-28 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function CartPage() {
  const [items, setItems]       = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading]   = useState(true);
  const [removing, setRemoving] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError]       = useState("");
  const { isAuthenticated }     = useAuth();
  const navigate                = useNavigate();

  useEffect(() => { if (!isAuthenticated) navigate("/login"); }, [isAuthenticated, navigate]);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderApi.getMyCart();
      setItems(data);
      setSelected(new Set(data.map(i => i.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleToggle    = (id) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  
  const handleToggleAll = () => setSelected(
    selected.size === items.length ? new Set() : new Set(items.map(i => i.id))
  );

  const handleRemove    = async (id) => {
    try {
      setRemoving(id);
      await orderApi.removeCartItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      toast.success("Đã xóa khóa học khỏi giỏ hàng!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể xóa khóa học, vui lòng thử lại.");
    } finally {
      setRemoving(null);
    }
  };

  const handleCheckout  = async () => {
    try {
      setError(""); setChecking(true);
      const url = await orderApi.checkout();
      window.location.href = url;
    } catch (err) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra khi tạo thanh toán, vui lòng thử lại.");
    } finally { setChecking(false); }
  };

  const selectedItems     = items.filter(i => selected.has(i.id));
  const total             = selectedItems.reduce((s, i) => s + i.coursePrice, 0);
  const originalTotal     = selectedItems.reduce((s, i) =>
    s + (i.courseOriginalPrice || i.coursePrice), 0);
  const savedAmount       = originalTotal - total;
  const allChecked        = items.length > 0 && selected.size === items.length;
  const someChecked       = selected.size > 0 && selected.size < items.length;
  const noSelection       = selected.size === 0;
  const discountPercent   = originalTotal > 0 ? Math.round(((originalTotal - total) / originalTotal) * 100) : 0;

  if (loading) return <LoadingSkeleton />;

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-slow {
          animation: float 3.5s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>

      <div className="min-h-[85vh] bg-gray-50/50 py-12 px-4 md:px-8 font-sans">
        <div className="max-w-[1000px] mx-auto">
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-8 border-b border-gray-200/80 pb-5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Giỏ hàng
            </h1>
            {items.length > 0 && (
              <span className="bg-purple-100 text-[#8c06d8] text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
                {items.length} khóa học
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Column: Cart items list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <SelectAllBar
                    allChecked={allChecked}
                    someChecked={someChecked}
                    onToggleAll={handleToggleAll}
                    total={items.length}
                    selected={selected.size}
                  />
                  
                  <div className="divide-y divide-gray-100/80">
                    {items.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        checked={selected.has(item.id)}
                        onToggle={handleToggle}
                        onRemove={handleRemove}
                        removing={removing}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Checkout Summary */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-6">
                
                {/* Dynamic Price Section */}
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Tổng tiền thanh toán:
                  </p>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                      {noSelection ? "0 đ" : formatVND(total)}
                    </h2>
                    
                    {!noSelection && originalTotal > total && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-sm text-gray-400 line-through">
                          {formatVND(originalTotal)}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-0.5">
                          Giảm {discountPercent}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtotals detail */}
                {!noSelection && (
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Giá gốc ({selectedItems.length} khóa học):</span>
                      <span className="line-through">{formatVND(originalTotal)}</span>
                    </div>
                    {savedAmount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600">
                        <span>Tiết kiệm hệ thống:</span>
                        <span>-{formatVND(savedAmount)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="h-px bg-gray-100 mb-6" />

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 text-xs mb-4">
                    <span className="font-bold flex-shrink-0">⚠️ Lỗi:</span>
                    <span className="flex-1">{error}</span>
                  </div>
                )}

                {/* Payment button */}
                <button
                  onClick={handleCheckout}
                  disabled={noSelection || checking}
                  className={`w-full py-4 px-6 text-white font-bold text-base rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg ${
                    noSelection || checking
                      ? "bg-purple-300 cursor-not-allowed shadow-none"
                      : "bg-[#8c06d8] hover:bg-purple-900 shadow-purple-100 hover:shadow-purple-200 hover:-translate-y-0.5 cursor-pointer"
                  }`}
                >
                  {checking ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Đang xử lý thanh toán...
                    </>
                  ) : (
                    <>
                      Tiến hành thanh toán
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-gray-400 mt-3.5 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={12} className="stroke-gray-400" />
                  Bạn sẽ không bị tính phí ngay bây giờ
                </p>

              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}