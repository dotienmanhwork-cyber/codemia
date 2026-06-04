// src/shared/components/dashboard-ui/StatCard.jsx
/**
 * StatCard — metric card dùng trên dashboard
 *
 * Props:
 *   label      — string, e.g. "Total students"
 *   value      — string | number, e.g. "1,284" or 74.2
 *   icon       — tabler icon name, e.g. "users"
 *   iconColor  — 'purple' | 'green' | 'amber' | 'red' | 'blue' | 'dark'
 *   badge      — string, e.g. "↑ +12%"
 *   badgeType  — 'up' | 'warn' | 'neutral' | 'danger'
 */
export default function StatCard({
  label,
  value,
  icon = 'chart-bar',
  iconColor = 'purple',
  badge,
  badgeType = 'neutral',
}) {
  const iconStyles = {
    purple: { background: 'var(--purple-light)', color: 'var(--purple-dim)' },
    dark:   { background: 'var(--ink)',           color: '#fff'              },
    green:  { background: 'var(--green-bg)',      color: 'var(--green)'      },
    amber:  { background: 'var(--amber-bg)',      color: 'var(--amber)'      },
    red:    { background: 'var(--red-bg)',         color: 'var(--red)'        },
    blue:   { background: 'var(--blue-bg)',        color: 'var(--blue)'       },
  };

  const badgeStyles = {
    up:      { background: 'var(--green-bg)',      color: 'var(--green)'  },
    warn:    { background: 'var(--amber-bg)',       color: 'var(--amber)'  },
    neutral: { background: 'var(--border-faint)',   color: 'var(--ink-3)'  },
    danger:  { background: 'var(--red-bg)',         color: 'var(--red)'    },
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
      }}
    >
      {/* Top row: icon + badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 34, height: 34,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17,
            ...iconStyles[iconColor] ?? iconStyles.purple,
          }}
        >
          <i className={`ti ti-${icon}`} />
        </div>

        {/* Badge */}
        {badge && (
          <span
            style={{
              fontSize: 10.5, fontWeight: 600,
              padding: '2px 7px', borderRadius: 99,
              ...badgeStyles[badgeType] ?? badgeStyles.neutral,
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Label */}
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 3 }}>
        {label}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 22, fontWeight: 700,
          color: 'var(--ink)', letterSpacing: '-0.03em',
        }}
      >
        {value}
      </div>
    </div>
  );
}
