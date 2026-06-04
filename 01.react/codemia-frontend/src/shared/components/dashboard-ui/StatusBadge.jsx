// src/shared/components/dashboard-ui/StatusBadge.jsx
/**
 * StatusBadge — pill badge cho trạng thái
 *
 * Props:
 *   label    — string
 *   variant  — 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'neutral' | 'rejected'
 */
const variants = {
  green:    { background: 'var(--green-bg)',    color: 'var(--green)'      },
  amber:    { background: 'var(--amber-bg)',    color: 'var(--amber)'      },
  red:      { background: 'var(--red-bg)',      color: 'var(--red)'        },
  blue:     { background: 'var(--blue-bg)',     color: 'var(--blue)'       },
  purple:   { background: 'var(--purple-light)',color: 'var(--purple-dim)' },
  neutral:  { background: 'var(--border-faint)',color: 'var(--ink-3)'      },
  rejected: { background: 'var(--red-bg)',      color: 'var(--red)'        },
};

export default function StatusBadge({ label, variant = 'neutral', onClick, clickable = false }) {
  const style = variants[variant] ?? variants.neutral;

  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10.5, fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 99,
        whiteSpace: 'nowrap',
        cursor: clickable ? 'pointer' : 'default',
        userSelect: 'none',
        ...(clickable && {
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: 2,
        }),
        ...style,
      }}
    >
      {label}
    </span>
  );
}