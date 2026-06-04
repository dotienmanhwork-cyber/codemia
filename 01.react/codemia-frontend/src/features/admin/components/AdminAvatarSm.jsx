// src/features/admin/components/AdminAvatarSm.jsx

/**
 * AdminAvatarSm — small circular avatar
 * Ưu tiên avatarUrl, fallback về initials với màu hash từ tên/email
 *
 * Props:
 *   name      — string | null
 *   email     — string
 *   avatarUrl — string | null
 *   size      — number (default: 27)
 */

const AVATAR_PALETTE = [
  { bg: '#F3DAFF', color: '#6d00ab' },
  { bg: '#E6F1FB', color: '#185FA5' },
  { bg: '#FAEEDA', color: '#854F0B' },
  { bg: '#EAF3DE', color: '#1E7E34' },
  { bg: '#FFE4E4', color: '#A80010' },
  { bg: '#E4F0FF', color: '#1A56DB' },
];

function hashIndex(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % AVATAR_PALETTE.length;
}

export function getInitials(name, email = '') {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return (email[0] ?? '?').toUpperCase();
}

export default function AdminAvatarSm({ name, email = '', avatarUrl, size = 27 }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? email}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  const { bg, color } = AVATAR_PALETTE[hashIndex(name ?? email)];
  const initials = getInitials(name, email);

  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: bg, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
}
