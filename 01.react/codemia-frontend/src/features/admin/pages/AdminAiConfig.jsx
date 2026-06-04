// src/features/admin/pages/AdminAiConfig.jsx
import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../../shared/components/dashboard-ui/PageHeader';
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge';
import DataTable from '../../../shared/components/dashboard-ui/DataTable';
import {
  getAiProviders,
  getAiConfig,
  updateAiFeatureConfig,
  resetAiConfig,
  getAiCacheSummary,
  deleteAiCacheByLesson,
  deleteAiCacheByCourse,
} from '../api/admin.api';

/* ─── helpers ────────────────────────────────────────────── */

const PROVIDER_META = {
  CLAUDE:  { label: 'Claude',  icon: 'ti-brain',        color: 'purple' },
  OPENAI:  { label: 'OpenAI',  icon: 'ti-robot',         color: 'green'  },
  GEMINI:  { label: 'Gemini',  icon: 'ti-diamond',       color: 'blue'   },
  GROQ:      { label: 'Groq',       icon: 'ti-bolt',    color: 'amber'  },
  GROQ_FAST: { label: 'Groq Fast',  icon: 'ti-bolt',    color: 'amber'  },
};

const FEATURE_LABEL = {
  LESSON_SUMMARY: 'Tóm tắt bài học',
  EXERCISE_HINT:  'Gợi ý bài tập',
  CODE_REVIEW:    'Nhận xét code',
  CODE_RUN:       'Chạy code',
  CODE_SUBMIT:    'Nộp bài code',
  QUIZ_SUBMIT:    'Nộp bài quiz',
  SUMMARY:        'Tóm tắt bài học',
};

function providerMeta(name = '') {
  return PROVIDER_META[name.toUpperCase()] ?? { label: name, icon: 'ti-cpu', color: 'neutral' };
}

/* ─── reusable sub-components ────────────────────────────── */

const Section = ({ title, subtitle, action, children }) => (
  <div style={{
    background: 'var(--surface)',
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderBottom: '0.5px solid var(--border)',
    }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {action}
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

/* provider pill row — drag-sortable via up/down buttons */
const ProviderOrder = ({ order = [], onChange }) => {
  function move(idx, dir) {
    const next = [...order];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {order.map((name, idx) => {
        const meta = providerMeta(name);
        return (
          <div
            key={name}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 12px',
              background: 'var(--bg)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {/* rank */}
            <span style={{
              fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)',
              minWidth: 16, textAlign: 'center',
            }}>
              {idx + 1}
            </span>

            {/* icon */}
            <i className={`ti ${meta.icon}`} style={{ fontSize: 14, color: `var(--${meta.color === 'purple' ? 'purple-dim' : meta.color})` }} />

            {/* name */}
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
              {meta.label}
            </span>

            {/* move buttons */}
            <button onClick={() => move(idx, -1)} disabled={idx === 0} style={arrowBtn}>
              <i className="ti ti-chevron-up" style={{ fontSize: 12 }} />
            </button>
            <button onClick={() => move(idx, 1)} disabled={idx === order.length - 1} style={arrowBtn}>
              <i className="ti ti-chevron-down" style={{ fontSize: 12 }} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const arrowBtn = {
  width: 24, height: 24,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-xs)',
  background: 'var(--surface)',
  cursor: 'pointer',
  color: 'var(--ink-2)',
  padding: 0,
  transition: 'opacity 0.15s',
};

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    style={{
      width: 40, height: 22, borderRadius: 99, border: 'none',
      background: value ? 'var(--purple)' : 'var(--border)',
      cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s', flexShrink: 0,
    }}
  >
    <div style={{
      width: 16, height: 16, borderRadius: '50%', background: '#fff',
      position: 'absolute', top: 3, left: value ? 21 : 3,
      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
  </button>
);

const Btn = ({ icon, label, onClick, variant = 'default', loading, small }) => {
  const variants = {
    default: { background: 'var(--ink)',    color: '#fff' },
    danger:  { background: 'var(--red-bg)', color: 'var(--red)' },
    ghost:   { background: 'var(--border-faint)', color: 'var(--ink-2)' },
    green:   { background: 'var(--green)',  color: '#fff' },
  };
  const s = variants[variant] ?? variants.default;
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: small ? '5px 11px' : '7px 14px',
        border: 'none', borderRadius: 'var(--radius-sm)',
        fontSize: small ? 12 : 13, fontWeight: 600,
        cursor: loading ? 'default' : 'pointer',
        fontFamily: 'inherit',
        opacity: loading ? 0.6 : 1,
        transition: 'opacity 0.15s',
        ...s,
      }}
    >
      <i className={`ti ${loading ? 'ti-loader-2' : icon}`} style={{ fontSize: small ? 12 : 13 }} />
      {label}
    </button>
  );
};

/* ── ConfirmModal ──────────────────────────────────────────── */
const Modal = ({ title, message, onConfirm, onCancel, loading }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 999,
  }}>
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius)',
      border: '0.5px solid var(--border)',
      padding: 24, maxWidth: 380, width: '90%',
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>{message}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn icon="ti-x" label="Hủy" variant="ghost" onClick={onCancel} small />
        <Btn icon="ti-trash" label="Xóa" variant="danger" onClick={onConfirm} loading={loading} small />
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════
   AdminAiConfig
══════════════════════════════════════════════════════════ */
export default function AdminAiConfig() {
  /* ── state ── */
  const [providers, setProviders]   = useState([]);
  const [configs, setConfigs]       = useState([]);
  const [cache, setCache]           = useState([]);
  const [courseIdFilter, setCourseIdFilter] = useState('');

  const [localConfigs, setLocalConfigs] = useState({});   // { [feature]: { providerOrder, enabled } }
  const [saving, setSaving]         = useState({});        // { [feature]: bool }
  const [savedOk, setSavedOk]       = useState({});        // { [feature]: bool }
  const [resetting, setResetting]   = useState(false);

  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingConfig, setLoadingConfig]       = useState(true);
  const [loadingCache, setLoadingCache]         = useState(false);

  const [confirm, setConfirm]       = useState(null);  // { type, id, label }
  const [deleting, setDeleting]     = useState(false);
  const [toast, setToast]           = useState(null);  // { msg, ok }

  /* ── load ── */
  useEffect(() => {
    getAiProviders()
      .then((res) => setProviders(res?.result ?? res ?? []))
      .catch(() => setProviders([]))
      .finally(() => setLoadingProviders(false));

    getAiConfig()
      .then((res) => {
        const list = res?.result ?? res ?? [];
        setConfigs(list);
        // seed localConfigs
        const seed = {};
        list.forEach((c) => {
          seed[c.feature] = {
            providerOrder: [...(c.providerOrder ?? [])],
            enabled: c.enabled ?? true,
          };
        });
        setLocalConfigs(seed);
      })
      .catch(() => setConfigs([]))
      .finally(() => setLoadingConfig(false));
  }, []);

  const loadCache = useCallback((cid) => {
    setLoadingCache(true);
    getAiCacheSummary(cid || undefined)
      .then((res) => setCache(res?.result ?? res ?? []))
      .catch(() => setCache([]))
      .finally(() => setLoadingCache(false));
  }, []);

  useEffect(() => { loadCache(''); }, [loadCache]);

  /* ── handlers ── */
  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  }

  function updateLocal(feature, key, val) {
    setLocalConfigs((prev) => ({
      ...prev,
      [feature]: { ...prev[feature], [key]: val },
    }));
    setSavedOk((prev) => ({ ...prev, [feature]: false }));
  }

  async function handleSaveFeature(feature) {
    setSaving((p) => ({ ...p, [feature]: true }));
    try {
      await updateAiFeatureConfig(feature, localConfigs[feature]);
      setSavedOk((p) => ({ ...p, [feature]: true }));
      showToast(`Đã lưu cấu hình ${FEATURE_LABEL[feature] ?? feature}.`);
      setTimeout(() => setSavedOk((p) => ({ ...p, [feature]: false })), 2500);
    } catch {
      showToast('Lưu cấu hình thất bại. Vui lòng thử lại.', false);
    } finally {
      setSaving((p) => ({ ...p, [feature]: false }));
    }
  }

  async function handleReset() {
    if (!window.confirm('Đặt lại TOÀN BỘ cấu hình tính năng AI về mặc định? Hành động này không thể hoàn tác.')) return;
    setResetting(true);
    try {
      await resetAiConfig();
      // reload
      const res = await getAiConfig();
      const list = res?.result ?? res ?? [];
      setConfigs(list);
      const seed = {};
      list.forEach((c) => { seed[c.feature] = { providerOrder: [...(c.providerOrder ?? [])], enabled: c.enabled ?? true }; });
      setLocalConfigs(seed);
      showToast('Đã đặt lại toàn bộ cấu hình về mặc định.');
    } catch {
      showToast('Đặt lại cấu hình thất bại.', false);
    } finally {
      setResetting(false);
    }
  }

  function askDelete(type, id, label) {
    setConfirm({ type, id, label });
  }

  async function handleDelete() {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.type === 'lesson') {
        await deleteAiCacheByLesson(confirm.id);
      } else {
        await deleteAiCacheByCourse(confirm.id);
      }
      showToast('Đã xóa cache thành công.');
      loadCache(courseIdFilter);
    } catch {
      showToast('Xóa cache thất bại.', false);
    } finally {
      setDeleting(false);
      setConfirm(null);
    }
  }

  /* ── render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          padding: '10px 16px',
          background: toast.ok ? 'var(--green)' : 'var(--red)',
          color: '#fff', borderRadius: 'var(--radius-sm)',
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 7,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}>
          <i className={`ti ${toast.ok ? 'ti-check' : 'ti-x'}`} style={{ fontSize: 14 }} />
          {toast.msg}
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <Modal
          title={confirm.type === 'lesson' ? 'Xóa cache bài học?' : 'Xóa cache khóa học?'}
          message={`Toàn bộ tóm tắt AI đã lưu cho "${confirm.label}" sẽ bị xóa. Các yêu cầu tiếp theo sẽ được tạo lại từ nhà cung cấp AI.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          loading={deleting}
        />
      )}

      {/* Header */}
      <PageHeader
        title="Cấu hình AI"
        subtitle="Quản lý thứ tự dự phòng nhà cung cấp AI, bật tắt tính năng và bộ nhớ đệm tóm tắt bài học."
        action={
          <Btn
            icon="ti-refresh"
            label="Đặt lại mặc định"
            variant="ghost"
            onClick={handleReset}
            loading={resetting}
          />
        }
      />

      {/* ── Provider status ── */}
      <Section
        title="Trạng thái nhà cung cấp"
        subtitle="Trạng thái hoạt động trực tiếp của các nhà cung cấp AI."
      >
        {loadingProviders ? (
          <Skeleton rows={3} />
        ) : providers.length === 0 ? (
          <Empty text="Chưa có nhà cung cấp nào được cấu hình." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {providers.map((p) => {
              const meta = providerMeta(p.provider ?? p.name);
              return (
                <div
                  key={p.provider ?? p.name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: 'var(--bg)',
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `var(--${meta.color === 'purple' ? 'purple-light' : meta.color + '-bg'})`,
                    color: `var(--${meta.color === 'purple' ? 'purple-dim' : meta.color})`,
                    fontSize: 15,
                  }}>
                    <i className={`ti ${meta.icon}`} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                      {meta.label}
                    </div>
                    {p.model && (
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                        {p.model}
                      </div>
                    )}
                  </div>

                  <StatusBadge
                    label={p.available ? 'Hoạt động' : 'Ngoại tuyến'}
                    variant={p.available ? 'green' : 'red'}
                  />

                  {p.latencyMs != null && (
                    <span style={{ fontSize: 11.5, color: 'var(--ink-3)', minWidth: 50, textAlign: 'right' }}>
                      {p.latencyMs} ms
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── Feature configs ── */}
      {loadingConfig ? (
        <Section title="Cấu hình tính năng" subtitle="Đang tải…">
          <Skeleton rows={4} />
        </Section>
      ) : configs.length === 0 ? (
        <Section title="Cấu hình tính năng">
          <Empty text="Không tìm thấy tính năng nào." />
        </Section>
      ) : (
        configs.map((cfg) => {
          const feature = cfg.feature;
          const local   = localConfigs[feature] ?? { providerOrder: cfg.providerOrder ?? [], enabled: cfg.enabled ?? true };
          const isSaving = saving[feature];
          const isSaved  = savedOk[feature];

          return (
            <Section
              key={feature}
              title={FEATURE_LABEL[feature] ?? feature}
              subtitle={`Thứ tự dự phòng: ${(local.providerOrder ?? []).join(' → ')}`}
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Toggle
                    value={local.enabled}
                    onChange={(v) => updateLocal(feature, 'enabled', v)}
                  />
                  <Btn
                    icon={isSaved ? 'ti-check' : 'ti-device-floppy'}
                    label={isSaved ? 'Đã lưu!' : 'Lưu'}
                    variant={isSaved ? 'green' : 'default'}
                    onClick={() => handleSaveFeature(feature)}
                    loading={isSaving}
                    small
                  />
                </div>
              }
            >
              {!local.enabled && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 12px', marginBottom: 14,
                  background: 'var(--amber-bg)', borderRadius: 'var(--radius-sm)',
                  fontSize: 12.5, color: 'var(--amber)', fontWeight: 500,
                }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 14 }} />
                  Tính năng này hiện đang tắt — AI sẽ không phản hồi cho chức năng này.
                </div>
              )}
              <ProviderOrder
                order={local.providerOrder ?? []}
                onChange={(next) => updateLocal(feature, 'providerOrder', next)}
              />
            </Section>
          );
        })
      )}

      {/* ── Cache management ── */}
      <Section
        title="Bộ nhớ đệm tóm tắt"
        subtitle="Bộ nhớ đệm tóm tắt bài học của AI. Xóa cache sẽ bắt buộc tạo lại tóm tắt mới."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              value={courseIdFilter}
              onChange={(e) => setCourseIdFilter(e.target.value)}
              placeholder="Lọc theo ID khóa học…"
              style={{
                height: 30, padding: '0 10px',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12.5, color: 'var(--ink)',
                fontFamily: 'inherit', outline: 'none',
                background: 'var(--bg)', width: 160,
              }}
            />
            <Btn
              icon="ti-search"
              label="Lọc"
              variant="ghost"
              onClick={() => loadCache(courseIdFilter)}
              small
            />
          </div>
        }
      >
        {loadingCache ? (
          <Skeleton rows={4} />
        ) : (
          <DataTable
            columns={[
              { key: 'lessonId',    label: 'ID bài học',   width: 90  },
              { key: 'lessonTitle', label: 'Bài học',       width: '40%' },
              { key: 'courseTitle', label: 'Khóa học'               },
              { key: 'cachedAt',   label: 'Thời gian cache',    width: 130 },
              { key: 'actions',    label: '',             width: 90  },
            ]}
            data={cache}
            emptyText="Không tìm thấy bộ nhớ đệm tóm tắt nào."
            renderCell={(key, val, row) => {
              if (key === 'cachedAt') {
                return (
                  <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                    {val ? new Date(val).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  </span>
                );
              }
              if (key === 'actions') {
                return (
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button
                      title="Xóa cache bài học"
                      onClick={() => askDelete('lesson', row.lessonId, row.lessonTitle ?? `Lesson ${row.lessonId}`)}
                      style={{
                        ...iconActionBtn,
                        color: 'var(--red)',
                        background: 'var(--red-bg)',
                        border: '0.5px solid transparent',
                      }}
                    >
                      <i className="ti ti-trash" style={{ fontSize: 12 }} />
                    </button>
                    {row.courseId && (
                      <button
                        title="Xóa tất cả cache cho khóa học này"
                        onClick={() => askDelete('course', row.courseId, row.courseTitle ?? `Course ${row.courseId}`)}
                        style={{
                          ...iconActionBtn,
                          color: 'var(--amber)',
                          background: 'var(--amber-bg)',
                          border: '0.5px solid transparent',
                        }}
                      >
                        <i className="ti ti-trash-x" style={{ fontSize: 12 }} />
                      </button>
                    )}
                  </div>
                );
              }
              return (
                <span style={{
                  fontSize: 13, color: 'var(--ink)',
                  display: 'block',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: key === 'lessonTitle' ? 240 : undefined,
                }}>
                  {val ?? '—'}
                </span>
              );
            }}
          />
        )}
      </Section>
    </div>
  );
}

/* ─── micro components ─────────────────────────────────── */

const iconActionBtn = {
  width: 26, height: 26,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 'var(--radius-xs)',
  cursor: 'pointer', padding: 0,
};

const Skeleton = ({ rows = 3 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          height: 36, borderRadius: 'var(--radius-sm)',
          background: 'var(--border-faint)',
          animation: 'livePulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.1}s`,
        }}
      />
    ))}
  </div>
);

const Empty = ({ text }) => (
  <div style={{
    textAlign: 'center', padding: '28px 16px',
    fontSize: 13, color: 'var(--ink-3)',
  }}>
    <i className="ti ti-mood-empty" style={{ fontSize: 22, display: 'block', marginBottom: 6 }} />
    {text}
  </div>
);