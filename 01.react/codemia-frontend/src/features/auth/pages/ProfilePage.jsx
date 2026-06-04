import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../shared/context/AuthContext";
import { authApi } from "../api/auth.api";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";

// ─── Design tokens ─────────────────────────────────────────────
const T = {
  accent:       "#1a1a2e",
  accentHover:  "#2d2d4a",
  accentLight:  "#f0eff8",
  accentBorder: "#c8c5e0",
  ink:          "#111118",
  inkMid:       "#4a4a5a",
  inkLight:     "#9898a8",
  border:       "#e8e8ee",
  borderHover:  "#c8c5e0",
  surface:      "#ffffff",
  bg:           "#f5f5f7",
  success:      "#0f7a4e",
  successBg:    "#f0faf5",
  successBorder:"#a7dfca",
  error:        "#b5173a",
  errorBg:      "#fff5f7",
  errorBorder:  "#f5c2cc",
  font:         "'DM Sans', 'Segoe UI', system-ui, sans-serif",
};

// ─── SVG Icons ─────────────────────────────────────────────────
const EyeOpenIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const UserIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const LockIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CameraIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
    stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const BankIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-4 0v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/>
    <line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);

// ─── Shared inline style objects ───────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "10px 13px",
  boxSizing: "border-box",
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  fontSize: 14,
  fontFamily: T.font,
  color: T.ink,
  background: T.surface,
  outline: "none",
  transition: "border-color 0.18s, box-shadow 0.18s",
  letterSpacing: "0.01em",
};

const inputDisabledStyle = {
  ...inputStyle,
  background: T.bg,
  color: T.inkLight,
  cursor: "not-allowed",
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 500,
  color: T.inkLight,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 7,
  fontFamily: T.font,
};

// ─── Helpers ───────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: "1.35rem" }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && (
        <p style={{ margin: "5px 0 0", fontSize: 12, color: T.inkLight, fontFamily: T.font }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function FocusInput({ value, onChange, placeholder, readOnly, disabled, style: extraStyle }) {
  const [focused, setFocused] = useState(false);
  const base = disabled || readOnly ? inputDisabledStyle : inputStyle;
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...base,
        ...extraStyle,
        borderColor: focused ? T.accentBorder : T.border,
        boxShadow: focused ? `0 0 0 3px ${T.accentLight}` : "none",
      }}
    />
  );
}

function EyeBtn({ show, onToggle }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onToggle}
      type="button"
      tabIndex={-1}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
        background: hov ? T.bg : "none",
        border: "none", cursor: "pointer",
        color: hov ? T.inkMid : T.inkLight,
        padding: "4px 5px", display: "flex", alignItems: "center",
        borderRadius: 4, transition: "color 0.15s, background 0.15s",
      }}
    >
      {show ? <EyeOffIcon /> : <EyeOpenIcon />}
    </button>
  );
}

function PwField({ label, value, onChange, show, onToggle, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...inputStyle,
            paddingRight: 40,
            borderColor: focused ? T.accentBorder : T.border,
            boxShadow: focused ? `0 0 0 3px ${T.accentLight}` : "none",
            WebkitTextSecurity: show ? "none" : "disc",
            fontFamily: show ? T.font : "inherit",
          }}
        />
        <EyeBtn show={show} onToggle={onToggle} />
      </div>
    </Field>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 6, fontSize: 13,
      marginBottom: "1.2rem",
      background: type === "error" ? T.errorBg : T.successBg,
      color: type === "error" ? T.error : T.success,
      border: `1px solid ${type === "error" ? T.errorBorder : T.successBorder}`,
      fontFamily: T.font, letterSpacing: "0.01em",
    }}>
      {type === "error" ? "✕  " : "✓  "}{msg}
    </div>
  );
}

function AvatarSection({ avatar, setAvatar, user }) {
  const ref = useRef();
  const [hov, setHov] = useState(false);
  const [btnHov, setBtnHov] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const { uploading, upload } = useCloudinaryUpload();

  const initials = user?.fullName
    ? user.fullName.split(" ").slice(-2).map(s => s[0]).join("").toUpperCase()
    : "U";

  async function handleFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
    if (!ACCEPT.includes(file.type)) {
      setUploadError("Chỉ chấp nhận JPG, PNG, WEBP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Ảnh không được vượt quá 2MB");
      return;
    }

    setUploadError("");
    try {
      const url = await upload(file);
      setAvatar(url);
    } catch (err) {
      setUploadError(err.message || "Upload thất bại, thử lại nhé");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
      {/* Avatar circle */}
      <div
        onClick={() => !uploading && ref.current.click()}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: 72, height: 72, borderRadius: "50%",
          background: avatar ? "transparent" : T.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 500, color: "#fff",
          cursor: uploading ? "wait" : "pointer",
          overflow: "hidden", flexShrink: 0,
          position: "relative", border: `1px solid ${T.border}`,
          fontFamily: T.font,
        }}
      >
        {avatar
          ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initials}

        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.48)",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: uploading || hov ? 1 : 0,
          transition: "opacity 0.2s",
        }}>
          {uploading ? (
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              border: "2.5px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              animation: "spin 0.7s linear infinite",
            }} />
          ) : (
            <CameraIcon />
          )}
        </div>
      </div>

      {/* Button + hint */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          onClick={() => !uploading && ref.current.click()}
          disabled={uploading}
          onMouseEnter={() => setBtnHov(true)}
          onMouseLeave={() => setBtnHov(false)}
          style={{
            padding: "7px 15px", borderRadius: 6, background: "transparent",
            color: uploading ? T.inkLight : btnHov ? T.ink : T.inkMid,
            border: `1px solid ${btnHov && !uploading ? T.borderHover : T.border}`,
            fontSize: 13, fontWeight: 400,
            cursor: uploading ? "not-allowed" : "pointer",
            fontFamily: T.font, letterSpacing: "0.01em",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          {uploading ? "Đang tải lên…" : "Thay đổi ảnh"}
        </button>

        <p style={{ margin: 0, fontSize: 11.5, color: T.inkLight, fontFamily: T.font }}>
          JPG, PNG, WEBP — tối đa 2MB
        </p>

        {uploadError && (
          <p style={{
            margin: 0, fontSize: 12, color: T.error,
            background: T.errorBg, border: `1px solid ${T.errorBorder}`,
            borderRadius: 5, padding: "5px 10px", fontFamily: T.font,
          }}>
            {uploadError}
          </p>
        )}
      </div>

      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleFile}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Nav ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "profile",  icon: <UserIcon />, label: "Hồ sơ" },
  { key: "password", icon: <LockIcon />, label: "Mật khẩu" },
  { key: "bank",     icon: <BankIcon />, label: "Ngân hàng" },
];

function NavBtn({ item, active, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: 6, border: "none",
        background: active ? T.accentLight : hov ? T.bg : "transparent",
        color: active ? T.accent : hov ? T.ink : T.inkMid,
        fontSize: 13.5, fontWeight: active ? 500 : 400,
        fontFamily: T.font, cursor: "pointer",
        transition: "all 0.15s", textAlign: "left",
        letterSpacing: "0.01em", marginBottom: 2,
      }}
    >
      <span style={{ opacity: active ? 1 : 0.55, display: "flex", alignItems: "center" }}>
        {item.icon}
      </span>
      {item.label}
    </button>
  );
}

// ─── Save button ───────────────────────────────────────────────
function SaveBtn({ loading, disabled, onClick, label = "Lưu thay đổi" }) {
  const [hov, setHov] = useState(false);
  const off = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={off}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "10px 24px", borderRadius: 6,
        background: off ? T.inkLight : hov ? T.accentHover : T.accent,
        color: "#fff", border: "none",
        fontSize: 13.5, fontWeight: 500, fontFamily: T.font,
        cursor: off ? "not-allowed" : "pointer",
        transition: "background 0.18s",
        letterSpacing: "0.02em", opacity: off ? 0.5 : 1,
      }}
    >
      {loading ? "Đang lưu..." : label}
    </button>
  );
}

// ─── Section wrapper ──────────────────────────────────────────
const cardStyle = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: "2rem 2.5rem 2.5rem",
};

const dividerStyle = {
  height: 1,
  background: T.border,
  margin: "1.25rem 0 2rem",
};

// ─── Parse bankAccountInfo JSON an toàn ───────────────────────
function parseBankInfo(raw) {
  if (!raw) return { bankName: "", bankAccountNumber: "", bankAccountName: "" };
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return { bankName: "", bankAccountNumber: "", bankAccountName: "" };
  }
}

// ─── Main ─────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // ── Profile state ──
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio]           = useState(user?.bio || "");
  const [avatar, setAvatar]     = useState(user?.avatarUrl || "");
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMsg, setInfoMsg]   = useState({ text: "", type: "" });

  // ── Password state ──
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [pwLoading, setPwLoading]   = useState(false);
  const [pwMsg, setPwMsg]           = useState({ text: "", type: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Bank state ──
  const [bankName,          setBankName]          = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName,   setBankAccountName]   = useState("");
  const [bankLoading,       setBankLoading]       = useState(false);
  const [bankMsg,           setBankMsg]           = useState({ text: "", type: "" });

  useEffect(() => {
    authApi.getMyProfile().then(res => {
      const p = res.result;
      setFullName(p.fullName || "");
      setBio(p.bio || "");
      setAvatar(p.avatarUrl || "");

      // ── Load bank info ──
      const bank = parseBankInfo(p.bankAccountInfo);
      setBankName(bank.bankName || "");
      setBankAccountNumber(bank.bankAccountNumber || "");
      setBankAccountName(bank.bankAccountName || "");
    }).catch(() => {});
  }, []);

  async function handleSaveInfo() {
    setInfoLoading(true); setInfoMsg({ text: "", type: "" });
    try {
      const res = await authApi.updateProfile({
        fullName,
        bio,
        avatarUrl: avatar,
        bankAccountInfo: JSON.stringify({ bankName, bankAccountNumber, bankAccountName }),
      });
      const u = res.result;
      setFullName(u.fullName || ""); setBio(u.bio || ""); setAvatar(u.avatarUrl || "");
      updateUser({ fullName: u.fullName, avatarUrl: u.avatarUrl, bio: u.bio });
      setInfoMsg({ text: "Cập nhật thành công.", type: "success" });
    } catch (e) {
      setInfoMsg({ text: e.response?.data?.message || "Có lỗi xảy ra.", type: "error" });
    } finally { setInfoLoading(false); }
  }

  async function handleChangePassword() {
    if (newPw !== confirmPw) { setPwMsg({ text: "Mật khẩu xác nhận không khớp.", type: "error" }); return; }
    if (newPw.length < 8)    { setPwMsg({ text: "Mật khẩu mới phải ít nhất 8 ký tự.", type: "error" }); return; }
    setPwLoading(true); setPwMsg({ text: "", type: "" });
    try {
      await authApi.changePassword({ currentPw, newPw });
      setPwMsg({ text: "Đổi mật khẩu thành công.", type: "success" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e) {
      setPwMsg({ text: e.response?.data?.message || "Mật khẩu hiện tại không đúng.", type: "error" });
    } finally { setPwLoading(false); }
  }

  async function handleSaveBank() {
    setBankLoading(true); setBankMsg({ text: "", type: "" });
    try {
      await authApi.updateProfile({
        fullName,
        bio,
        avatarUrl: avatar,
        bankAccountInfo: JSON.stringify({ bankName, bankAccountNumber, bankAccountName }),
      });
      setBankMsg({ text: "Cập nhật thông tin ngân hàng thành công.", type: "success" });
    } catch (e) {
      setBankMsg({ text: e.response?.data?.message || "Có lỗi xảy ra.", type: "error" });
    } finally { setBankLoading(false); }
  }

  const pwValid = currentPw && newPw && confirmPw && newPw === confirmPw && newPw.length >= 8;

  function strength(pw) {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ["Yếu", "Trung bình", "Khá", "Mạnh"];
    const colors = ["#e03c5a", "#e07c3c", "#4a90d9", T.success];
    return { score, label: labels[score - 1], color: colors[score - 1] };
  }
  const pwStrength = strength(newPw);

  const initials = user?.fullName
    ? user.fullName.split(" ").slice(-2).map(s => s[0]).join("").toUpperCase()
    : "U";

  return (
    <div style={{
      maxWidth: 880,
      margin: "0 auto",
      padding: "2.5rem 1.5rem 5rem",
      fontFamily: T.font,
      display: "flex",
      gap: "1.5rem",
      alignItems: "flex-start",
    }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: 204,
        flexShrink: 0,
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: "1.25rem 0.875rem",
        position: "sticky",
        top: 80,
      }}>
        {/* Mini user card */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingBottom: "1.2rem", marginBottom: "1rem",
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: avatar ? "transparent" : T.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 500, color: "#fff",
            overflow: "hidden", marginBottom: 10,
            border: `1px solid ${T.border}`, fontFamily: T.font,
          }}>
            {avatar
              ? <img src={avatar} alt="av" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.ink, textAlign: "center", lineHeight: 1.4, fontFamily: T.font }}>
            {fullName || user?.email?.split("@")[0]}
          </div>
          <div style={{ fontSize: 11.5, color: T.inkLight, marginTop: 3, textAlign: "center", wordBreak: "break-all", fontFamily: T.font }}>
            {user?.email}
          </div>
        </div>

        {/* Nav items */}
        {NAV_ITEMS.map(item => (
          <NavBtn
            key={item.key}
            item={item}
            active={activeTab === item.key}
            onClick={() => setActiveTab(item.key)}
          />
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Profile */}
        {activeTab === "profile" && (
          <div style={cardStyle}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: T.ink, letterSpacing: "-0.01em", fontFamily: T.font }}>
                Thông tin cá nhân
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: T.inkLight, fontFamily: T.font }}>
                Thông tin hiển thị công khai trên hồ sơ của bạn
              </p>
            </div>
            <div style={dividerStyle} />

            <AvatarSection avatar={avatar} setAvatar={setAvatar} user={user} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.25rem" }}>
              <Field label="Họ tên">
                <FocusInput value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
              </Field>
              <Field label="Email" hint="Email không thể thay đổi">
                <FocusInput value={user?.email || ""} readOnly />
              </Field>
            </div>

            <Field label="Giới thiệu">
              <BioField value={bio} onChange={setBio} />
            </Field>

            <Toast msg={infoMsg.text} type={infoMsg.type} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SaveBtn loading={infoLoading} onClick={handleSaveInfo} />
            </div>
          </div>
        )}

        {/* Password */}
        {activeTab === "password" && (
          <div style={cardStyle}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: T.ink, letterSpacing: "-0.01em", fontFamily: T.font }}>
                Đổi mật khẩu
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: T.inkLight, fontFamily: T.font }}>
                Dùng mật khẩu mạnh để bảo vệ tài khoản
              </p>
            </div>
            <div style={dividerStyle} />

            <PwField label="Mật khẩu hiện tại" value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              show={showCurrent} onToggle={() => setShowCurrent(v => !v)}
              placeholder="Nhập mật khẩu hiện tại" />

            <PwField label="Mật khẩu mới" value={newPw}
              onChange={e => setNewPw(e.target.value)}
              show={showNew} onToggle={() => setShowNew(v => !v)}
              placeholder="Ít nhất 8 ký tự" />

            {pwStrength && (
              <div style={{ marginTop: -10, marginBottom: "1.4rem" }}>
                <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 2, borderRadius: 99,
                      background: i <= pwStrength.score ? pwStrength.color : T.border,
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: pwStrength.color, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: T.font }}>
                  {pwStrength.label}
                </span>
              </div>
            )}

            <PwField label="Xác nhận mật khẩu mới" value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              show={showConfirm} onToggle={() => setShowConfirm(v => !v)}
              placeholder="Nhập lại mật khẩu mới" />

            {confirmPw && (
              <p style={{
                margin: "-10px 0 16px", fontSize: 12, fontWeight: 500,
                color: newPw === confirmPw ? T.success : T.error,
                fontFamily: T.font,
              }}>
                {newPw === confirmPw ? "✓  Mật khẩu khớp" : "✕  Mật khẩu không khớp"}
              </p>
            )}

            <Toast msg={pwMsg.text} type={pwMsg.type} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SaveBtn loading={pwLoading} disabled={!pwValid} onClick={handleChangePassword} label="Cập nhật mật khẩu" />
            </div>
          </div>
        )}

        {/* Bank */}
        {activeTab === "bank" && (
          <div style={cardStyle}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: T.ink, letterSpacing: "-0.01em", fontFamily: T.font }}>
                Thông tin ngân hàng
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: T.inkLight, fontFamily: T.font }}>
                Dùng để nhận hoàn tiền khi khoá học bị xóa hoặc tài khoản thay đổi
              </p>
            </div>
            <div style={dividerStyle} />

            {/* Info banner */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "10px 14px",
              background: "#f0eff8",
              border: `1px solid ${T.accentBorder}`,
              borderRadius: 7,
              marginBottom: "1.75rem",
            }}>
              <span style={{ fontSize: 15, marginTop: 1 }}>ℹ️</span>
              <p style={{ margin: 0, fontSize: 12.5, color: T.inkMid, lineHeight: 1.6, fontFamily: T.font }}>
                Thông tin ngân hàng được lưu bảo mật và chỉ dùng để xử lý hoàn tiền thủ công bởi Admin.
                Cập nhật đúng thông tin để đảm bảo nhận tiền nhanh nhất.
              </p>
            </div>

            <Field label="Tên ngân hàng" hint="VD: Vietcombank, Techcombank, MB Bank...">
              <FocusInput
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="Nhập tên ngân hàng"
              />
            </Field>

            <Field label="Số tài khoản">
              <FocusInput
                value={bankAccountNumber}
                onChange={e => setBankAccountNumber(e.target.value)}
                placeholder="Nhập số tài khoản"
              />
            </Field>

            <Field label="Tên chủ tài khoản" hint="Viết in hoa, đúng như trên thẻ ngân hàng">
              <FocusInput
                value={bankAccountName}
                onChange={e => setBankAccountName(e.target.value)}
                placeholder="VD: NGUYEN VAN A"
                style={{ textTransform: "uppercase" }}
              />
            </Field>

            <Toast msg={bankMsg.text} type={bankMsg.type} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SaveBtn
                loading={bankLoading}
                onClick={handleSaveBank}
                label="Lưu thông tin ngân hàng"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Bio field (separate to avoid hook-in-condition) ──────────
function BioField({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Chia sẻ đôi điều về bản thân..."
        maxLength={300}
        rows={3}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          resize: "vertical", lineHeight: 1.65,
          paddingBottom: 28,
          borderColor: focused ? T.accentBorder : T.border,
          boxShadow: focused ? `0 0 0 3px ${T.accentLight}` : "none",
        }}
      />
      <span style={{
        position: "absolute", bottom: 10, right: 12,
        fontSize: 11.5, color: T.inkLight, fontFamily: T.font,
        pointerEvents: "none",
      }}>
        {value.length} / 300
      </span>
    </div>
  );
}