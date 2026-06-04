// src/features/admin/components/SystemLogs.jsx
// TODO: Thay mock bằng API khi BE có endpoint /api/admin/system-logs
import StatusBadge from '../../../shared/components/dashboard-ui/StatusBadge';
import SectionCard from './AdminSectionCard';

const SYSTEM_LOGS = [
  { id: 1, tag: 'Bảo mật', variant: 'red',     time: '10:42 AM',  msg: 'Phát hiện đăng nhập bất thường từ IP 192.168.1.1'      },
  { id: 2, tag: 'Thanh toán',  variant: 'green',   time: '09:15 AM',  msg: 'Đã hoàn thành thanh toán hàng tháng'   },
  { id: 3, tag: 'Hệ thống',   variant: 'neutral', time: '08:00 AM',  msg: 'Triển khai migration cơ sở dữ liệu thành công'      },
  { id: 4, tag: 'Bảo mật', variant: 'red',     time: 'Hôm qua', msg: 'Yêu cầu đặt lại mật khẩu thất bại — người dùng #2841'    },
  { id: 5, tag: 'Hệ thống',   variant: 'neutral', time: 'Hôm qua', msg: 'Sao lưu định kỳ hoàn thành — đã lưu trữ 4.2 GB'  },
];

export default function SystemLogs() {
  return (
    <SectionCard
      title="Nhật ký hệ thống"
      headerRight={
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--green)' }}>
          <span className="live-dot" />
          Trực tiếp
        </span>
      }
    >
      {SYSTEM_LOGS.map((log) => (
        <div
          key={log.id}
          style={{
            padding: '10px 16px',
            borderBottom: '0.5px solid var(--border-faint)',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 3,
          }}>
            <StatusBadge label={log.tag} variant={log.variant} />
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{log.time}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5 }}>
            {log.msg}
          </div>
        </div>
      ))}
    </SectionCard>
  );
}
