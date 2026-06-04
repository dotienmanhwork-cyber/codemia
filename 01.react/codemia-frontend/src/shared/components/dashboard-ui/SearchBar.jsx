// src/shared/components/dashboard-ui/SearchBar.jsx
import { useState } from 'react';

/**
 * SearchBar — input tìm kiếm standalone dùng trong page content
 *
 * Props:
 *   value        — string (controlled)
 *   onChange     — (value: string) => void
 *   placeholder  — string
 *   width        — number | string (default: 280)
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Tìm kiếm…',
  width = 280,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: 'relative', width }}>
      <i
        className="ti ti-search"
        style={{
          position: 'absolute', left: 10, top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 15, color: 'var(--ink-3)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', height: 34,
          background: focused ? 'var(--surface)' : 'var(--border-faint)',
          border: `0.5px solid ${focused ? 'var(--purple)' : 'var(--border)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(140,6,216,0.08)' : 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '0 12px 0 32px',
          fontSize: 13, color: 'var(--ink)',
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
      />
      {/* Clear button */}
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear"
          style={{
            position: 'absolute', right: 8, top: '50%',
            transform: 'translateY(-50%)',
            border: 'none', background: 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-3)', fontSize: 14,
            padding: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--ink)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--ink-3)'}
        >
          <i className="ti ti-x" />
        </button>
      )}
    </div>
  );
}