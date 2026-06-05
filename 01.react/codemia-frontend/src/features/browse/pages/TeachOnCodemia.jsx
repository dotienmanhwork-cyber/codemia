import { useState, useEffect, useRef } from "react";
import { userApi } from "../../../shared/api/user.api";
import { useAuth } from "../../../shared/context/AuthContext";
import { useCloudinaryPdfUpload } from "../../../shared/hooks/useCloudinaryPdfUpload";
import heroBanner from "../assets/heroBanner.webp";

const PURPLE = "#8c06d8";
const PURPLE_DARK = "#6a04a4";
const PURPLE_LIGHT = "#f3e6fd";
const PURPLE_MID = "#c77ef0";

const steps = [
  { icon: "✏️", title: "Gửi đơn", desc: "Điền lý do bạn muốn trở thành giảng viên. Tối thiểu 20 ký tự, tối đa 1000 ký tự." },
  { icon: "🔍", title: "Xét duyệt", desc: "Đội ngũ Codemia sẽ review đơn của bạn trong vòng 3–5 ngày làm việc." },
  { icon: "🚀", title: "Bắt đầu dạy", desc: "Sau khi được duyệt, bạn có thể tạo khoá học và tiếp cận hàng nghìn học viên." },
];

const benefits = [
  { icon: "💰", title: "Thu nhập thụ động", desc: "Tạo khoá học một lần, nhận doanh thu mãi mãi từ học viên trên toàn quốc." },
  { icon: "🌍", title: "Tiếp cận rộng", desc: "Hàng chục nghìn học viên đang chờ đợi kiến thức từ bạn." },
  { icon: "🛠️", title: "Công cụ mạnh mẽ", desc: "Hệ thống bài tập lập trình, auto-grading, và dashboard phân tích học viên." },
  { icon: "🤝", title: "Hỗ trợ 24/7", desc: "Đội ngũ Codemia luôn sẵn sàng hỗ trợ bạn xây dựng nội dung chất lượng." },
];

const stats = [
  { value: "50K+", label: "Học viên" },
  { value: "200+", label: "Khoá học" },
  { value: "4.8★", label: "Đánh giá TB" },
  { value: "98%", label: "Hài lòng" },
];

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconUpload = ({ size = 32, color = PURPLE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const IconFilePdf = ({ size = 32, color = PURPLE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="9" y2="17" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="15" y1="14" x2="15" y2="17" />
  </svg>
);

const IconCheck = ({ size = 28, color = PURPLE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconAlert = ({ size = 28, color = "#e74c3c" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconX = ({ size = 14, color = "#aaa" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── CV Drag & Drop Zone ───────────────────────────────────────────────────────
function CvUploadZone({ cvFile, onFileSelect, onFileRemove, uploading, uploadError }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  }

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    // reset input để user có thể chọn lại cùng file
    e.target.value = "";
  }

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Xác định trạng thái zone
  const isError = !!uploadError;
  const hasFile = !!cvFile && !isError;

  const zoneBorder = isError
    ? "1.5px dashed #e74c3c"
    : dragging
      ? `2px dashed ${PURPLE}`
      : hasFile
        ? `1.5px solid ${PURPLE}`
        : "1.5px dashed #ddd";

  const zoneBg = isError
    ? "#fdf0f0"
    : dragging
      ? PURPLE_LIGHT
      : hasFile
        ? "#f9f2fe"
        : "#fafafa";

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        CV đính kèm <span style={{ color: "#e74c3c", fontWeight: 600 }}>*</span> <span style={{ color: "#bbb", fontWeight: 400, textTransform: "none" }}>(PDF · tối đa 5 MB)</span>
      </label>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-label="Vùng kéo thả CV PDF"
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={e => e.key === "Enter" && !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (!uploading) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={uploading ? undefined : handleDrop}
        style={{
          marginTop: 8,
          border: zoneBorder,
          borderRadius: 12,
          background: zoneBg,
          padding: "1.25rem 1rem",
          textAlign: "center",
          cursor: uploading ? "default" : "pointer",
          transition: "border-color 0.2s, background 0.2s",
          outline: "none",
        }}
      >
        {/* Trạng thái: lỗi */}
        {isError && (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <IconAlert size={28} />
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#c0392b" }}>
              {uploadError}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#e74c3c" }}>
              <span style={{ color: PURPLE, fontWeight: 600 }}>Chọn file khác</span>
            </p>
          </>
        )}

        {/* Trạng thái: đang upload */}
        {uploading && (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                <path d="M12 2a10 10 0 0 1 10 10" style={{ animation: "cvSpin 0.9s linear infinite" }} />
              </svg>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 14, color: "#555" }}>Đang tải lên Cloudinary...</p>
            <div style={{ height: 4, borderRadius: 2, background: "#e8d5f9", overflow: "hidden", maxWidth: 200, margin: "0 auto" }}>
              <div style={{
                height: "100%", width: "50%", borderRadius: 2,
                background: PURPLE,
                animation: "cvUploadSlide 1.4s ease-in-out infinite",
              }} />
            </div>
          </>
        )}

        {/* Trạng thái: đã chọn file (và không uploading, không lỗi) */}
        {hasFile && !uploading && (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <IconCheck size={28} />
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#fff", border: `1px solid ${PURPLE}33`,
              borderRadius: 8, padding: "7px 12px",
              fontSize: 13, color: "#333",
            }}>
              <IconFilePdf size={16} />
              <span style={{ fontWeight: 500, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {cvFile.name}
              </span>
              <span style={{ color: "#aaa", flexShrink: 0 }}>· {formatSize(cvFile.size)}</span>
              <button
                onClick={e => { e.stopPropagation(); onFileRemove(); }}
                aria-label="Xoá file CV"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 0, lineHeight: 1,
                  display: "flex", alignItems: "center",
                }}
              >
                <IconX size={14} />
              </button>
            </div>
          </>
        )}

        {/* Trạng thái: mặc định */}
        {!isError && !uploading && !hasFile && (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <IconUpload size={30} color={dragging ? PURPLE : "#bbb"} />
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 500, color: dragging ? PURPLE : "#444" }}>
              {dragging ? "Thả file vào đây" : "Kéo thả CV vào đây"}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>
              hoặc <span style={{ color: PURPLE, fontWeight: 600 }}>chọn file từ máy tính</span>
            </p>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handleChange}
      />

      {/* Keyframe animation cho shimmer bar */}
      <style>{`
        @keyframes cvUploadSlide {
          0%   { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }
        @keyframes cvSpin {
          from { transform-origin: 12px 12px; transform: rotate(0deg); }
          to   { transform-origin: 12px 12px; transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Apply Form ────────────────────────────────────────────────────────────────
function ApplyForm({ onSuccess }) {
  const { user, isAuthenticated } = useAuth();
  const { uploading, uploadPdf, error: uploadError, clearError } = useCloudinaryPdfUpload();

  const [reason, setReason] = useState("");
  const [cvFile, setCvFile] = useState(null);   // File object người dùng chọn
  const [cvUrl, setCvUrl] = useState("");  // URL sau khi upload xong
  const [portfolioUrl, setPortfolioUrl] = useState("");  // Link GitHub hoặc portfolio
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const minLen = 20;
  const maxLen = 1000;
  const len = reason.trim().length;
  const valid = len >= minLen && len <= maxLen;

  // Khi user chọn / kéo thả file → validate + upload ngay
  async function handleFileSelect(file) {
    clearError();
    setCvUrl("");
    setCvFile(file);
    try {
      const url = await uploadPdf(file);
      setCvUrl(url);
    } catch {
      // uploadError đã được set bên trong hook
      // Giữ lại cvFile để hiển thị thông báo lỗi đúng trên zone
    }
  }

  function handleFileRemove() {
    setCvFile(null);
    setCvUrl("");
    clearError();
  }

  async function handleSubmit() {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (!valid) return;
    if (!cvUrl) { setError("Vui lòng đính kèm CV của bạn."); return; }
    if (!portfolioUrl.trim()) { setError("Vui lòng nhập link GitHub hoặc portfolio."); return; }

    setLoading(true);
    setError("");
    try {
      await userApi.requestTeacherUpgrade(reason.trim(), cvUrl, portfolioUrl.trim());
      onSuccess();
    } catch (e) {
      const code = e.response?.data?.code;
      if (code === 1020) {
        setError("Bạn đã có yêu cầu đang chờ xử lý.");
      } else {
        setError(e.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Nút submit bị disable khi: reason không hợp lệ, đang gửi,
  // đang upload, hoặc có file nhưng upload lỗi
  const submitDisabled = !valid || loading || uploading || !cvUrl || (cvFile && !cvUrl) || !portfolioUrl.trim();

  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${PURPLE}22`,
      borderRadius: 20,
      padding: "2rem 2.5rem",
      maxWidth: 560,
      margin: "0 auto",
      boxShadow: `0 4px 40px ${PURPLE}18`,
    }}>
      <h3 style={{ margin: "0 0 1.5rem", fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>
        Đăng ký trở thành giảng viên
      </h3>

      {/* Readonly user info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 6 }}>
        {[
          { label: "Họ tên", value: user?.fullName || "" },
          { label: "Email", value: user?.email || "" },
        ].map(({ label, value }) => (
          <div key={label}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {label}
            </label>
            <div style={{
              marginTop: 4, padding: "10px 14px",
              background: PURPLE_LIGHT, borderRadius: 10,
              fontSize: 14, color: "#555", border: `1px solid ${PURPLE}22`,
              minHeight: 40, display: "flex", alignItems: "center",
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "#aaa", marginTop: 0, marginBottom: 20 }}>
        Thông tin không chính xác?{" "}
        <a href="/profile" style={{ color: PURPLE, textDecoration: "none", fontWeight: 600 }}>
          Cập nhật hồ sơ →
        </a>
      </p>

      {/* Reason textarea */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Lý do bạn muốn dạy học
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={maxLen}
          rows={5}
          placeholder="Chia sẻ kinh nghiệm, kỹ năng, và lý do bạn muốn trở thành giảng viên trên Codemia..."
          style={{
            display: "block", width: "100%", marginTop: 6,
            padding: "12px 14px", borderRadius: 10,
            border: `1.5px solid ${len > 0 && !valid ? "#e74c3c" : len >= minLen ? PURPLE : "#ddd"}`,
            fontSize: 14, lineHeight: 1.6, resize: "vertical",
            fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 12, color: len < minLen ? "#e74c3c" : "#27ae60" }}>
            {len < minLen ? `Cần thêm ${minLen - len} ký tự nữa` : "✓ Đủ độ dài"}
          </span>
          <span style={{ fontSize: 12, color: "#999" }}>{len}/{maxLen}</span>
        </div>
      </div>

      {/* CV upload zone */}
      <CvUploadZone
        cvFile={cvFile}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        uploading={uploading}
        uploadError={uploadError}
      />

      {/* Portfolio / GitHub link */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Link GitHub / Portfolio <span style={{ color: "#e74c3c", fontWeight: 600 }}>*</span>
        </label>
        <input
          type="url"
          value={portfolioUrl}
          onChange={e => setPortfolioUrl(e.target.value)}
          placeholder="https://github.com/username hoặc https://portfolio.com"
          style={{
            display: "block", width: "100%", marginTop: 6,
            padding: "12px 14px", borderRadius: 10,
            border: `1.5px solid ${portfolioUrl.trim() ? PURPLE : "#ddd"}`,
            fontSize: 14, fontFamily: "inherit", outline: "none",
            boxSizing: "border-box", transition: "border-color 0.2s",
          }}
          onFocus={e => { e.target.style.borderColor = PURPLE; }}
          onBlur={e => { e.target.style.borderColor = portfolioUrl.trim() ? PURPLE : "#ddd"; }}
        />
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#aaa" }}>
          Admin sẽ xem xét profile GitHub hoặc portfolio của bạn.
        </p>
      </div>

      {/* Submit error */}
      {error && (
        <div style={{
          background: "#fdf0f0", border: "1px solid #e74c3c33",
          borderRadius: 8, padding: "10px 14px", marginBottom: 12,
          fontSize: 13, color: "#c0392b",
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitDisabled}
        style={{
          width: "100%", padding: "14px 0", marginTop: 4,
          background: submitDisabled ? "#ccc" : PURPLE,
          color: "#fff", border: "none", borderRadius: 12,
          fontSize: 16, fontWeight: 700,
          cursor: submitDisabled ? "not-allowed" : "pointer",
          transition: "background 0.2s",
          letterSpacing: 0.3,
        }}
        onMouseEnter={e => { if (!submitDisabled) e.target.style.background = PURPLE_DARK; }}
        onMouseLeave={e => { if (!submitDisabled) e.target.style.background = PURPLE; }}
      >
        {loading ? "Đang gửi..." : uploading ? "Đang tải CV..." : "Gửi đơn đăng ký →"}
      </button>

      <p style={{ textAlign: "center", fontSize: 12, color: "#aaa", marginTop: 12, marginBottom: 0 }}>
        Đội ngũ Codemia sẽ phản hồi trong 3–5 ngày làm việc
      </p>
    </div>
  );
}

function SuccessScreen({ onBack }) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e", marginBottom: 12 }}>
        Đơn đã được gửi!
      </h2>
      <p style={{ fontSize: 16, color: "#666", lineHeight: 1.7, marginBottom: 28 }}>
        Cảm ơn bạn đã đăng ký. Đội ngũ Codemia sẽ xem xét đơn của bạn và phản hồi trong{" "}
        <strong>3–5 ngày làm việc</strong>.
      </p>
      <button
        onClick={onBack}
        style={{
          padding: "12px 28px", borderRadius: 12,
          background: PURPLE_LIGHT, color: PURPLE,
          border: `1.5px solid ${PURPLE}44`, cursor: "pointer",
          fontSize: 15, fontWeight: 600,
        }}
      >← Quay lại trang chủ</button>
    </div>
  );
}

export default function TeachOnCodemia() {
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#1a1a2e",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
    }}>


      {/* Hero - Udemy style */}
      <section style={{
        background: "#f0f0f0",
        display: "flex",
        alignItems: "stretch",
        overflow: "hidden",
        minHeight: 520,
        position: "relative",
      }}>
        {/* Left: text */}
        <div style={{
          flex: "0 0 48%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "5rem 3rem 5rem 6rem",
          zIndex: 1,
        }}>
          <h1 style={{
            fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
            fontWeight: 900,
            color: "#1c1d1f",
            margin: "0 0 1.2rem",
            lineHeight: 1.15,
            letterSpacing: -1,
          }}>
            Chia sẻ kiến thức.<br />
            Tạo thu nhập<br />thụ động.
          </h1>

          <p style={{
            fontSize: 16,
            color: "#3e3e3e",
            lineHeight: 1.65,
            marginBottom: "2rem",
            maxWidth: 380,
            fontWeight: 400,
          }}>
            Trở thành giảng viên trên Codemia — nền tảng học lập trình hàng đầu Việt Nam.
          </p>

          <button
            onClick={() => document.getElementById("apply-form")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              padding: "16px 0",
              width: 280,
              borderRadius: 4,
              background: PURPLE,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 0.2,
              transition: "background 0.2s",
            }}
            onMouseEnter={e => { e.target.style.background = PURPLE_DARK; }}
            onMouseLeave={e => { e.target.style.background = PURPLE; }}
          >
            Bắt đầu ngay
          </button>
        </div>

        {/* Right: banner image — flush right, full height */}
        <div style={{
          position: "absolute",
          right: 0, top: 0, bottom: 0,
          width: "52%",
        }}>
          <img
            src={heroBanner}
            alt="Giảng viên Codemia"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "70% top",
              display: "block",
            }}
          />
        </div>
      </section>

      {/* Stats bar — separate purple section like Udemy */}
      <section style={{
        background: PURPLE,
        padding: "2.5rem 5rem",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.5rem",
      }}>
        {stats.map(({ value, label }, i) => (
          <div key={label} style={{
            display: "flex",
            alignItems: "center",
            gap: "1.2rem",
          }}>
            {i > 0 && (
              <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.25)" }} />
            )}
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4, fontWeight: 500 }}>{label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Benefits */}
      <section style={{ padding: "4rem 2rem", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 800, marginBottom: "2.5rem", color: "#1a1a2e" }}>
          Tại sao dạy trên Codemia?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          {benefits.map(({ icon, title, desc }) => (
            <div key={title} style={{
              padding: "1.5rem", borderRadius: 16,
              background: "#fff", border: "1px solid #eee",
              boxShadow: "0 2px 16px #0000060a",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${PURPLE}18`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 16px #0000060a"; }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: PURPLE_LIGHT, padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 800, marginBottom: "3rem", color: "#1a1a2e" }}>
            3 bước để bắt đầu
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {steps.map(({ icon, title, desc }, i) => (
              <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                <div style={{
                  width: 52, height: 52, flexShrink: 0,
                  borderRadius: "50%", background: PURPLE,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, boxShadow: `0 4px 16px ${PURPLE}44`,
                }}>
                  {icon}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4, color: "#1a1a2e" }}>
                    <span style={{ color: PURPLE, marginRight: 6 }}>Bước {i + 1}.</span>{title}
                  </div>
                  <div style={{ fontSize: 14, color: "#555", lineHeight: 1.65 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply form / Success */}
      <section id="apply-form" style={{ padding: "4rem 2rem", background: "#fafafa" }}>
        {submitted
          ? <SuccessScreen onBack={() => setSubmitted(false)} />
          : <ApplyForm onSuccess={() => setSubmitted(true)} />
        }
      </section>

      {/* Footer note */}
      <div style={{
        textAlign: "center", padding: "1.5rem",
        fontSize: 12, color: "#bbb", borderTop: "1px solid #eee",
        background: "#fff",
      }}>
        © 2025 Codemia · Nền tảng học lập trình Việt Nam
      </div>
    </div>
  );
}