// src/features/teacher/components/TeacherAvatarSm.jsx

const AVATAR_COLORS = [
  { bg: '#F3DAFF', color: '#6d00ab' },
  { bg: '#E6F1FB', color: '#185FA5' },
  { bg: '#EAF3DE', color: '#1E7E34' },
  { bg: '#FAEEDA', color: '#854F0B' },
  { bg: '#FFE4E4', color: '#9B1C1C' },
  { bg: '#E0F2FE', color: '#0369A1' },
  { bg: '#FEF9C3', color: '#854D0E' },
  { bg: '#F0FDF4', color: '#166534' },
]

function getColorFromName(name = '') {
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/**
 * @param {{ name: string, avatar?: string|null, size?: number }} props
 */
export default function TeacherAvatarSm({ name = '', avatar = null, size = 27 }) {
  const { bg, color } = getColorFromName(name)

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.37,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  )
}
