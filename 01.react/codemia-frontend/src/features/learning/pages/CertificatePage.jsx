// features/learning/pages/CertificatePage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCertificate } from "../api/learning.api";

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm text-gray-400">Đang tải chứng chỉ...</p>
    </div>
  );
}

// ─── Error message map ────────────────────────────────────────────────────────
const ERROR_MSG = {
  1013: "Bạn chưa đăng ký khóa học này.",
  1027: "Bạn cần hoàn thành 100% khóa học để nhận chứng chỉ.",
  1004: "Vui lòng đăng nhập để xem chứng chỉ.",
};

// ─── Certificate Card ─────────────────────────────────────────────────────────
function CertificateCard({ cert, printRef }) {
  const issuedDate = cert.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : new Date(cert.enrolledAt).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "long", year: "numeric",
      });

  return (
    <div
      ref={printRef}
      className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
      style={{ fontFamily: "Inter, Georgia, serif" }}
    >
      {/* Gradient top bar */}
      <div
        className="h-2 w-full"
        style={{ background: "linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #8C06D8 100%)" }}
      />

      {/* Decorative border */}
      <div className="absolute inset-3 border-2 rounded-xl pointer-events-none" style={{ borderColor: "#E9D5FF" }} />

      {/* Content */}
      <div className="px-12 py-10 flex flex-col items-center text-center">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366F1, #8C06D8)" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: "#8C06D8" }}>
            Codemia
          </span>
        </div>

        {/* Badge icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: "linear-gradient(135deg, #EDE9FE, #F3DAFF)" }}
        >
          <svg className="w-10 h-10" style={{ color: "#8C06D8" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>

        {/* Title */}
        <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-1">
          Chứng chỉ hoàn thành
        </p>
        <p className="text-sm text-gray-400 mb-6">Chứng nhận rằng</p>

        {/* Student name */}
        <h1
          className="text-3xl font-bold mb-1"
          style={{ color: "#8C06D8" }}
        >
          {cert.studentName}
        </h1>
        <p className="text-sm text-gray-400 mb-8">{cert.studentEmail}</p>

        {/* Divider */}
        <div className="w-16 h-0.5 rounded-full mb-6" style={{ background: "#E9D5FF" }} />

        {/* Course info */}
        <p className="text-sm text-gray-500 mb-2">Đã hoàn thành khóa học</p>
        <h2 className="text-xl font-bold text-gray-900 leading-snug mb-6 px-4">
          {cert.courseName}
        </h2>

        {/* Teacher + Issued date */}
        <div className="flex items-center gap-6 text-sm text-gray-500 mb-8">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Giảng viên</p>
            <p className="font-semibold text-gray-700">{cert.teacherName}</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Ngày cấp chứng chỉ</p>
            <p className="font-semibold text-gray-700">{issuedDate}</p>
          </div>
        </div>

        {/* Verify section */}
        <div className="w-full bg-gray-50 rounded-xl px-5 py-4 border border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-1">Mã xác thực chứng chỉ</p>
          <p className="text-xs font-mono text-gray-600 break-all">{cert.verifyCode}</p>
          <p className="text-xs text-gray-400 mt-1 break-all">{cert.verifyUrl}</p>
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #8C06D8 100%)" }}
      />
    </div>
  );
}

// ─── CertificatePage ──────────────────────────────────────────────────────────
export default function CertificatePage() {
  const { courseSlug: courseIdentifier } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const res = await getCertificate(courseIdentifier);
        if (res.code === 1000) {
          setCert(res.result);
        } else {
          setError(ERROR_MSG[res.code] ?? "Không thể tải chứng chỉ.");
        }
      } catch (err) {
        const code = err?.response?.data?.code;
        setError(ERROR_MSG[code] ?? "Không thể tải chứng chỉ. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    if (courseIdentifier) fetchCert();
  }, [courseIdentifier]);

  const handlePrint = () => window.print();

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Print styles — ẩn nút action, chỉ in certificate */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-area { box-shadow: none !important; }
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center py-10 px-4"
        style={{ background: "#F5F3FF", fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {/* ── Action bar ── */}
        <div className="no-print flex items-center gap-3 mb-8 w-full max-w-2xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>

          <div className="flex-1" />

          {cert && (
            <>
              <button
                onClick={() => navigate(`/my-certificates`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:bg-purple-50"
                style={{ color: "#8C06D8", borderColor: "#E9D5FF" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Chứng chỉ của tôi
              </button>

              <button
                onClick={() => navigate(`/courses/${courseIdentifier}`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:bg-purple-50"
                style={{ color: "#8C06D8", borderColor: "#E9D5FF" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                Viết đánh giá
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#8C06D8" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Tải về / In
              </button>
            </>
          )}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#FEE2E2" }}
            >
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-1">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 text-sm font-semibold hover:underline"
              style={{ color: "#8C06D8" }}
            >
              ← Quay lại
            </button>
          </div>
        ) : (
          <div className="print-area w-full flex justify-center">
            <CertificateCard cert={cert} printRef={printRef} />
          </div>
        )}
      </div>
    </>
  );
}