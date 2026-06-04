import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { authApi } from "../api/auth.api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/context/AuthContext";

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
};

// ─── Input Field ──────────────────────────────────────────────────────────────
function InputField({ label, type = "text", placeholder, value, onChange, error, suffix, autoComplete }) {
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

// ─── LoginForm ────────────────────────────────────────────────────────────────
export default function LoginForm({ onSwitch }) {
  const [form,         setForm]         = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors,       setErrors]       = useState({});
  const [loading,      setLoading]      = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email không hợp lệ.";
    if (!form.password)
      errs.password = "Vui lòng nhập mật khẩu.";
    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const response = await authApi.login({
        email:    form.email,
        password: form.password,
      });

      console.log("👉 Dữ liệu Backend trả về:", response);

      if (response.code === 0) {
        const token    = response.result?.token;
        const userData = response.result?.user;
        console.log("token:", token);
        console.log("userData:", userData);

        if (token) {
          login(userData, token);
          navigate("/");
        } else {
          setErrors({ general: "Đăng nhập thành công nhưng không tìm thấy Token!" });
        }
      } else {
        setErrors({ general: "Backend báo lỗi: " + (response.message || JSON.stringify(response)) });
      }
    } catch (error) {
      console.error("👉 Lỗi văng ra (Catch):", error);
      setErrors({ general: error.response?.data?.message || error.message });
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
          Chào mừng trở lại
        </h1>
        <p className="text-[15px]" style={{ color: C.onVariant }}>
          Đăng nhập để tiếp tục hành trình học tập của bạn
        </p>
      </div>

      {/* General Error Banner */}
      {errors.general && (
        <div
          className="rounded-xl px-4 py-3 text-[14px]"
          style={{ backgroundColor: "#fff0f0", border: `1px solid ${C.error}`, color: C.error }}
        >
          {errors.general}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

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
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[14px] font-semibold" style={{ color: C.primary }}>
              Mật khẩu
            </label>
            <a
              href="#"
              className="text-[13px] font-semibold transition-colors"
              style={{ color: C.secondary }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.accentHover)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
            >
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              autoComplete="current-password"
              className="w-full rounded-xl px-4 py-3 text-[15px] outline-none border transition-all duration-200
                [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
              style={{
                backgroundColor: "#fff",
                borderColor: errors.password ? C.error : C.outline,
                color: C.primary,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.password ? C.error : C.outlineFocus;
                e.target.style.boxShadow   = `0 0 0 3px ${errors.password ? "#ba1a1a22" : "#8c06d822"}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.password ? C.error : C.outline;
                e.target.style.boxShadow   = "none";
              }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: C.onVariant }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.secondary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.onVariant)}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[12px]" style={{ color: C.error }}>{errors.password}</p>
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
              Đang đăng nhập...
            </span>
          ) : (
            <><LogIn size={18} /> Đăng nhập</>
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

      {/* Switch to Register */}
      <p className="text-center text-[14px] mt-2" style={{ color: C.onVariant }}>
        Chưa có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold transition-colors"
          style={{ color: C.secondary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.accentHover)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
        >
          Đăng ký miễn phí
        </button>
      </p>
    </div>
  );
}