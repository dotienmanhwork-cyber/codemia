import { useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { authApi } from "../api/auth.api";

// ─── Design tokens (đồng bộ DESIGN.md) ───────────────────────────────────────
const C = {
  secondary:    "#8c06d8",
  accentHover:  "#5624D0",
  outline:      "#c5c6ca",
  outlineFocus: "#8c06d8",
  onVariant:    "#44474a",
  surface:      "#fcf8f8",
  surfaceHigh:  "#ebe7e7",
  error:        "#ba1a1a",
  primary:      "#181a1c",
  success:      "#1E7E34",
  warning:      "#B4690E",
};

// ─── Password Strength Indicator ──────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  const levels = [
    { label: "Rất yếu",    color: C.error   },
    { label: "Yếu",        color: C.warning  },
    { label: "Trung bình", color: "#d4a800" },
    { label: "Mạnh",       color: C.success  },
  ];
  const level = levels[score - 1] || levels[0];

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i < score ? level.color : C.surfaceHigh }}
          />
        ))}
      </div>
      <p className="text-[12px] font-medium" style={{ color: level.color }}>
        {level.label}
      </p>
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function InputField({ label, type = "text", placeholder, value, onChange, error, suffix, hint, autoComplete }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[14px] font-semibold" style={{ color: C.primary }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete || "off"}
          className="w-full rounded-xl px-4 py-3 text-[15px] outline-none border transition-all duration-200
            [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
          style={{
            backgroundColor: "#fff",
            borderColor: error ? C.error : C.outline,
            color: C.primary,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = error ? C.error : C.outlineFocus;
            e.target.style.boxShadow   = `0 0 0 3px ${error ? "#ba1a1a22" : "#8c06d822"}`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? C.error : C.outline;
            e.target.style.boxShadow   = "none";
          }}
        />
        {suffix && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: C.onVariant }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.secondary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.onVariant)}
            onClick={suffix.onClick}
          >
            {suffix.icon}
          </button>
        )}
      </div>
      {hint && !error && hint}
      {error && (
        <p className="text-[12px]" style={{ color: C.error }}>{error}</p>
      )}
    </div>
  );
}

// ─── Social Button ────────────────────────────────────────────────────────────
function SocialBtn({ icon, label }) {
  return (
    <button
      type="button"
      className="flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-xl border text-[14px] font-medium transition-all duration-200"
      style={{ backgroundColor: "#fff", borderColor: C.outline, color: C.primary }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor     = C.secondary;
        e.currentTarget.style.backgroundColor = "#faf5ff";
        e.currentTarget.style.boxShadow       = `0 0 0 2px ${C.secondary}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor     = C.outline;
        e.currentTarget.style.backgroundColor = "#fff";
        e.currentTarget.style.boxShadow       = "none";
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ─── RegisterForm ─────────────────────────────────────────────────────────────
export function RegisterForm({ onSwitch }) {
  const [form, setForm] = useState({
    fullName: "",
    email:    "",
    password: "",
    confirm:  "",
  });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed,      setAgreed]      = useState(false);
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage,   setErrorMessage]   = useState("");

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Xóa lỗi khi bắt đầu gõ lại
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    setErrorMessage("");
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.fullName.trim())
      errs.fullName = "Vui lòng nhập họ và tên.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email không hợp lệ.";
    if (form.password.length < 6)
      errs.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    if (form.confirm !== form.password)
      errs.confirm = "Mật khẩu xác nhận không khớp.";
    if (!agreed)
      errs.agreed = "Bạn cần đồng ý với điều khoản để tiếp tục.";
    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setSuccessMessage("");
      setErrorMessage("");
      return;
    }
    setErrors({});
    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await authApi.register({
        fullName: form.fullName,
        email:    form.email,
        password: form.password,
      });

      console.log("Response từ Backend:", response);

      if (response.code === 1000 || response.code === 0) {
        setSuccessMessage("Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
        setErrorMessage("");
        setTimeout(() => {
          if (onSwitch) onSwitch();
        }, 1500);
      } else if (response.code === 1001) {
        setErrorMessage("Email đã được đăng ký!");
        setSuccessMessage("");
      } else {
        setErrorMessage(response.message || "Đăng ký thất bại!");
        setSuccessMessage("");
      }
    } catch (error) {
      console.error("Lỗi Frontend:", error);
      const errorCode = error.response?.data?.code;
      const errorMsg = error.response?.data?.message;

      if (errorCode === 1001 || errorMsg?.includes("User already existed") || errorMsg?.includes("already existed")) {
        setErrorMessage("Email đã được đăng ký!");
      } else {
        setErrorMessage(errorMsg || "Lỗi kết nối: " + error.message);
      }
      setSuccessMessage("");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* Heading */}
      <div className="mb-3">
        <h1
          className="font-bold leading-tight mb-1.5"
          style={{ fontSize: 26, color: C.primary }}
        >
          Đăng ký tài khoản
        </h1>
        <p className="text-[15px]" style={{ color: C.onVariant }}>
          Bắt đầu hành trình học tập cùng Codemia
        </p>
      </div>

      {/* Custom Success Banner */}
      {successMessage && (
        <div
          className="rounded-xl px-4 py-3 text-[14px] flex items-center gap-2.5 transition-all duration-300"
          style={{ backgroundColor: "#eafaf1", border: `1px solid ${C.success}`, color: C.success }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Custom Error Banner */}
      {errorMessage && (
        <div
          className="rounded-xl px-4 py-3 text-[14px] flex items-center gap-2.5 transition-all duration-300 animate-pulse"
          style={{ backgroundColor: "#fff0f0", border: `1px solid ${C.error}`, color: C.error }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

        {/* Họ và tên */}
        <InputField
          label="Họ và tên"
          type="text"
          placeholder="Nguyễn Văn A"
          value={form.fullName}
          onChange={set("fullName")}
          error={errors.fullName}
          autoComplete="name"
        />

        {/* Email */}
        <InputField
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          autoComplete="email"
        />

        {/* Mật khẩu */}
        <InputField
          label="Mật khẩu"
          type={showPass ? "text" : "password"}
          placeholder="••••••••"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          autoComplete="new-password"
          suffix={{
            icon: showPass ? <EyeOff size={18} /> : <Eye size={18} />,
            onClick: () => setShowPass((v) => !v),
          }}
          hint={<PasswordStrength password={form.password} />}
        />

        {/* Xác nhận mật khẩu */}
        <InputField
          label="Xác nhận mật khẩu"
          type={showConfirm ? "text" : "password"}
          placeholder="••••••••"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
          autoComplete="new-password"
          suffix={{
            icon: showConfirm ? <EyeOff size={18} /> : <Eye size={18} />,
            onClick: () => setShowConfirm((v) => !v),
          }}
        />

        {/* Terms & Conditions */}
        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded cursor-pointer shrink-0"
              style={{ accentColor: C.secondary }}
            />
            <span className="text-[14px] leading-snug" style={{ color: C.onVariant }}>
              Tôi đồng ý với{" "}
              <a
                href="#"
                className="font-semibold transition-colors"
                style={{ color: C.secondary }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.accentHover)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
              >
                Điều khoản
              </a>{" "}
              và{" "}
              <a
                href="#"
                className="font-semibold transition-colors"
                style={{ color: C.secondary }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.accentHover)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
              >
                Chính sách bảo mật
              </a>
            </span>
          </label>
          {errors.agreed && (
            <p className="text-[12px] pl-6" style={{ color: C.error }}>
              {errors.agreed}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-[15px] font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 mt-1"
          style={{
            backgroundColor: loading ? "#b56ad4" : C.secondary,
            cursor:    loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : `0 4px 14px ${C.secondary}44`,
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = C.accentHover; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = C.secondary;   }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10"/>
              </svg>
              Đang tạo tài khoản...
            </span>
          ) : (
            <><UserPlus size={18} /> Đăng ký</>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-1">
        <div className="flex-1 h-px" style={{ backgroundColor: C.outline }} />
        <span className="text-[13px] whitespace-nowrap" style={{ color: C.onVariant }}>
          Hoặc tiếp tục với
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: C.outline }} />
      </div>

      {/* Social Buttons */}
      <div className="flex gap-3">
        <SocialBtn
          label="Google"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          }
        />
        <SocialBtn
          label="GitHub"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill={C.primary}>
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
          }
        />
      </div>

      {/* Switch to Login */}
      <p className="text-center text-[14px] mt-2" style={{ color: C.onVariant }}>
        Đã có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold transition-colors"
          style={{ color: C.secondary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.accentHover)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
        >
          Đăng nhập
        </button>
      </p>
    </div>
  );
}