// src/features/admin/pages/AdminSettings.jsx
import { useState } from 'react';
import PageHeader from '../../../shared/components/dashboard-ui/PageHeader';

/* ── Field components ── */
const Section = ({ title, subtitle, children }) => (
  <div style={{
    background: 'var(--surface)', border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius)', overflow: 'hidden',
  }}>
    <div style={{
      padding: '14px 20px', borderBottom: '0.5px solid var(--border)',
    }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{subtitle}</div>
      )}
    </div>
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {children}
    </div>
  </div>
);

const Field = ({ label, hint, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{label}</div>
      {hint && <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{hint}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

const TextInput = ({ value, onChange, width = 220 }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width, height: 32,
        border: `0.5px solid ${focused ? 'var(--purple)' : 'var(--border)'}`,
        boxShadow: focused ? '0 0 0 3px rgba(140,6,216,0.08)' : 'none',
        borderRadius: 'var(--radius-sm)', padding: '0 10px',
        fontSize: 13, color: 'var(--ink)', outline: 'none',
        fontFamily: 'inherit', background: 'var(--bg)',
        transition: 'all 0.15s',
      }}
    />
  );
};

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    style={{
      width: 40, height: 22,
      borderRadius: 99, border: 'none',
      background: value ? 'var(--purple)' : 'var(--border)',
      cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s',
      flexShrink: 0,
    }}
  >
    <div style={{
      width: 16, height: 16, borderRadius: '50%',
      background: '#fff',
      position: 'absolute', top: 3,
      left: value ? 21 : 3,
      transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
  </button>
);

const Select = ({ value, onChange, options, width = 220 }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      width, height: 32,
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '0 8px',
      fontSize: 13, color: 'var(--ink)', outline: 'none',
      fontFamily: 'inherit', background: 'var(--bg)',
      cursor: 'pointer',
    }}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

/* ══════════════════════════════════════════════
   AdminSettings
══════════════════════════════════════════════ */
export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    siteName:        'Codemia',
    supportEmail:    'support@codemia.io',
    teacherPayout:   '75',
    currency:        'USD',
    maintenanceMode: false,
    autoApprove:     false,
    allowRegister:   true,
    aiProvider:      'claude',
    maxUploadMB:     '500',
    requireApproval: true,
  });

  function set(key, val) {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        title="Cài đặt"
        subtitle="Cấu hình hệ thống toàn nền tảng."
        action={
          <button
            onClick={handleSave}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 15px',
              background: saved ? 'var(--green)' : 'var(--ink)',
              color: '#fff', border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
          >
            <i className={`ti ti-${saved ? 'check' : 'device-floppy'}`} style={{ fontSize: 14 }} />
            {saved ? 'Đã lưu!' : 'Lưu thay đổi'}
          </button>
        }
      />

      {/* Chung */}
      <Section title="Chung" subtitle="Thông tin cơ bản của nền tảng.">
        <Field label="Tên website" hint="Hiển thị trên tab trình duyệt và trong email.">
          <TextInput value={settings.siteName} onChange={(v) => set('siteName', v)} />
        </Field>
        <Field label="Email hỗ trợ" hint="Nơi người dùng gửi yêu cầu hỗ trợ.">
          <TextInput value={settings.supportEmail} onChange={(v) => set('supportEmail', v)} />
        </Field>
        <Field label="Tiền tệ">
          <Select
            value={settings.currency}
            onChange={(v) => set('currency', v)}
            options={[
              { value: 'USD', label: 'USD — Đô la Mỹ' },
              { value: 'EUR', label: 'EUR — Euro' },
              { value: 'VND', label: 'VND — Đồng Việt Nam' },
            ]}
          />
        </Field>
      </Section>

      {/* Tài chính */}
      <Section title="Tài chính" subtitle="Cấu hình chia sẻ doanh thu và thanh toán.">
        <Field label="Tỷ lệ thanh toán cho giáo viên (%)" hint="Tỷ lệ phần trăm doanh thu khóa học được trả cho giáo viên.">
          <TextInput value={settings.teacherPayout} onChange={(v) => set('teacherPayout', v)} width={80} />
        </Field>
      </Section>

      {/* AI */}
      <Section title="Nhà cung cấp AI" subtitle="Chọn mô hình AI cung cấp năng lượng cho việc dạy học và chấm điểm.">
        <Field label="Nhà cung cấp AI chính">
          <Select
            value={settings.aiProvider}
            onChange={(v) => set('aiProvider', v)}
            options={[
              { value: 'claude',  label: 'Claude (Anthropic)' },
              { value: 'openai',  label: 'OpenAI GPT-4o'      },
              { value: 'gemini',  label: 'Gemini (Google)'    },
              { value: 'groq',    label: 'Groq (Llama)'       },
            ]}
          />
        </Field>
        <Field label="Dung lượng tải lên tối đa (MB)" hint="Dung lượng tệp video tối đa cho mỗi bài học.">
          <TextInput value={settings.maxUploadMB} onChange={(v) => set('maxUploadMB', v)} width={80} />
        </Field>
      </Section>

      {/* Kiểm soát quyền truy cập */}
      <Section title="Kiểm soát truy cập" subtitle="Kiểm soát cách người dùng đăng ký và nhận quyền truy cập.">
        <Field label="Cho phép đăng ký mới" hint="Nếu tắt, người dùng mới không thể đăng ký tài khoản.">
          <Toggle value={settings.allowRegister} onChange={(v) => set('allowRegister', v)} />
        </Field>
        <Field label="Yêu cầu duyệt khóa học" hint="Khóa học mới cần quản trị viên phê duyệt trước khi xuất bản.">
          <Toggle value={settings.requireApproval} onChange={(v) => set('requireApproval', v)} />
        </Field>
        <Field label="Tự động phê duyệt yêu cầu giáo viên" hint="Bỏ qua quy trình phê duyệt vai trò thủ công.">
          <Toggle value={settings.autoApprove} onChange={(v) => set('autoApprove', v)} />
        </Field>
      </Section>

      {/* Khu vực nguy hiểm */}
      <Section title="Khu vực nguy hiểm" subtitle="Các hành động không thể đảo ngược hoặc gây gián đoạn.">
        <Field label="Chế độ bảo trì" hint="Khi bật, chỉ quản trị viên mới có thể truy cập nền tảng.">
          <Toggle value={settings.maintenanceMode} onChange={(v) => set('maintenanceMode', v)} />
        </Field>
        {settings.maintenanceMode && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px',
            background: 'var(--amber-bg)', borderRadius: 'var(--radius-sm)',
            fontSize: 12.5, color: 'var(--amber)', fontWeight: 500,
          }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 14 }} />
            Chế độ bảo trì ĐANG BẬT — người dùng thông thường không thể truy cập nền tảng.
          </div>
        )}
      </Section>
    </div>
  );
}
