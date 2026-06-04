// src/features/checkout/pages/PaymentResultPage.jsx
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";

/* ─── Constants ───────────────────────────────────────────── */
const RESPONSE_MESSAGES = {
  "00": "Thanh toán thành công",
  "24": "Giao dịch đã bị hủy",
  "11": "Giao dịch hết hạn (quá 15 phút)",
  "12": "Thẻ/tài khoản bị khóa",
  "75": "Ngân hàng đang bảo trì",
  "97": "Chữ ký không hợp lệ (lỗi hệ thống)",
  "99": "Lỗi hệ thống, vui lòng thử lại",
};

const getFailedMessage = (code) =>
  RESPONSE_MESSAGES[code] || `Thanh toán thất bại (mã lỗi: ${code})`;

/* ─── Helpers ─────────────────────────────────────────────── */
const formatVND = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const formatPayDate = (raw) => {
  if (!raw || raw.length < 12) return raw;
  const y = raw.slice(0, 4), mo = raw.slice(4, 6), d = raw.slice(6, 8);
  const h = raw.slice(8, 10), m = raw.slice(10, 12);
  return `${d}/${mo}/${y} ${h}:${m}`;
};

/* ─── Detail Row ──────────────────────────────────────────── */
function DetailRow({ label, value, accent }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={accent ? styles.detailAccent : styles.detailValue}>{value}</span>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();

  const { isSuccess, responseCode, orderId, amount, payDate, transNo, bankCode, orderInfo } =
    useMemo(() => {
      const code = searchParams.get("vnp_ResponseCode") || "";
      return {
        isSuccess:    code === "00",
        responseCode: code,
        orderId:      searchParams.get("vnp_TxnRef") || "—",
        amount:       Number(searchParams.get("vnp_Amount") || 0) / 100,
        payDate:      formatPayDate(searchParams.get("vnp_PayDate") || ""),
        transNo:      searchParams.get("vnp_TransactionNo") || "—",
        bankCode:     searchParams.get("vnp_BankCode") || "—",
        orderInfo:    searchParams.get("vnp_OrderInfo") || "—",
      };
    }, [searchParams]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* ── Status Icon ── */}
        <div style={{
          ...styles.iconRing,
          backgroundColor: isSuccess ? "#F0FDF4" : "#FFF7F7",
          border: `1.5px solid ${isSuccess ? "#BBF7D0" : "#FEE2E2"}`,
        }}>
          {isSuccess ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        {/* ── Title ── */}
        <h1 style={{ ...styles.title, color: isSuccess ? "#15803D" : "#B91C1C" }}>
          {isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
        </h1>

        {/* ── Amount (success only) ── */}
        {isSuccess && (
          <p style={styles.amountDisplay}>{formatVND(amount)}</p>
        )}

        <p style={styles.subtitle}>
          {isSuccess
            ? "Cảm ơn bạn đã mua khóa học. Chúc bạn học tập thật hiệu quả!"
            : getFailedMessage(responseCode)}
        </p>

        {/* ── Detail box ── */}
        <div style={styles.detailBox}>
          {isSuccess ? (
            <>
              <DetailRow label="Mã đơn hàng"  value={orderId} />
              <div style={styles.rowDivider} />
              <DetailRow label="Mã giao dịch"  value={transNo} />
              <div style={styles.rowDivider} />
              <DetailRow label="Ngân hàng"     value={bankCode} />
              <div style={styles.rowDivider} />
              <DetailRow label="Thời gian"     value={payDate} />
              {orderInfo !== "—" && (
                <>
                  <div style={styles.rowDivider} />
                  <DetailRow label="Nội dung" value={orderInfo} />
                </>
              )}
            </>
          ) : (
            <>
              <DetailRow label="Mã lỗi"       value={responseCode} />
              <div style={styles.rowDivider} />
              <DetailRow label="Mã đơn hàng"  value={orderId} />
              <div style={styles.rowDivider} />
              <DetailRow label="Lý do"         value={getFailedMessage(responseCode)} />
            </>
          )}
        </div>

        {/* ── Actions ── */}
        <div style={styles.actions}>
          {isSuccess ? (
            <Link to="/my-courses" style={styles.btnPrimary}
              onMouseEnter={e => e.currentTarget.style.background = "#6D28D9"}
              onMouseLeave={e => e.currentTarget.style.background = "#7C3AED"}
            >
              Đến khóa học của tôi
            </Link>
          ) : (
            <>
              <Link to="/cart" style={styles.btnPrimary}
                onMouseEnter={e => e.currentTarget.style.background = "#6D28D9"}
                onMouseLeave={e => e.currentTarget.style.background = "#7C3AED"}
              >
                Thử thanh toán lại
              </Link>
              <Link to="/" style={styles.btnSecondary}
                onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                Về trang chủ
              </Link>
            </>
          )}
        </div>

        {/* ── Secure note ── */}
        <p style={styles.secureNote}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Giao dịch được bảo mật bởi VNPAY
        </p>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: "80vh",
    backgroundColor: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 16,
    padding: "44px 40px",
    maxWidth: 440,
    width: "100%",
    textAlign: "center",
  },

  /* Icon */
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },

  /* Title */
  title: {
    fontSize: 22,
    fontWeight: 700,
    margin: "0 0 6px",
    letterSpacing: "-0.02em",
  },
  amountDisplay: {
    fontSize: 32,
    fontWeight: 800,
    color: "#7C3AED",
    margin: "10px 0 6px",
    letterSpacing: "-0.03em",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    margin: "0 0 24px",
    lineHeight: 1.55,
  },

  /* Detail box */
  detailBox: {
    backgroundColor: "#F9FAFB",
    border: "1px solid #F3F4F6",
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 24,
    textAlign: "left",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: "6px 0",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 600,
    color: "#111827",
    textAlign: "right",
    wordBreak: "break-all",
  },
  detailAccent: {
    fontSize: 14,
    fontWeight: 800,
    color: "#7C3AED",
    textAlign: "right",
  },

  /* Actions */
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 16,
  },
  btnPrimary: {
    display: "block",
    padding: "13px 0",
    backgroundColor: "#7C3AED",
    color: "#fff",
    textDecoration: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 14,
    transition: "background 0.15s",
  },
  btnSecondary: {
    display: "block",
    padding: "13px 0",
    backgroundColor: "#fff",
    color: "#374151",
    textDecoration: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    border: "1px solid #E5E7EB",
    transition: "background 0.15s",
  },

  /* Footer note */
  secureNote: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    fontSize: 11,
    color: "#9CA3AF",
    margin: 0,
  },
};