// features/learning/pages/MyCertificatesPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Search, Download, ExternalLink, ChevronRight } from "lucide-react";
import { getMyCertificates } from "../api/learning.api";

/* ─── Design tokens (matching MyCoursesPage / Navbar) ─── */
const C = {
  secondary:   "#8c06d8",
  accentHover: "#5624D0",
  surfaceLow:  "#f6f3f2",
  surfaceCont: "#f1eded",
  surfaceHigh: "#ebe7e7",
  outline:     "#c5c6ca",
  onVariant:   "#44474a",
  surface:     "#fcf8f8",
  text:        "#181a1c",
};

/* ─── Helpers ─── */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ─── Skeleton card ─── */
function SkeletonCard() {
  return (
    <div style={styles.card}>
      <div style={{ height: 6, backgroundColor: C.surfaceLow, borderRadius: "12px 12px 0 0", animation: "pulse 1.4s ease infinite" }} />
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ height: 14, borderRadius: 6, backgroundColor: C.surfaceLow, width: "75%", animation: "pulse 1.4s ease infinite" }} />
        <div style={{ height: 11, borderRadius: 6, backgroundColor: C.surfaceLow, width: "45%", animation: "pulse 1.4s ease 0.1s infinite" }} />
        <div style={{ height: 11, borderRadius: 6, backgroundColor: C.surfaceLow, width: "60%", animation: "pulse 1.4s ease 0.15s infinite" }} />
        <div style={{ height: 34, borderRadius: 8, backgroundColor: C.surfaceLow, marginTop: 8, animation: "pulse 1.4s ease 0.2s infinite" }} />
      </div>
    </div>
  );
}

/* ─── Certificate card ─── */
function CertificateCard({ cert }) {
  const navigate = useNavigate();
  const issuedDate = formatDate(cert.issuedAt || cert.enrolledAt);

  return (
    <div
      style={styles.card}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(140,6,216,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = styles.card.boxShadow;
      }}
    >
      {/* Top gradient bar */}
      <div
        style={{
          height: 6,
          background: "linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #8C06D8 100%)",
          borderRadius: "12px 12px 0 0",
          flexShrink: 0,
        }}
      />

      {/* Body */}
      <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>

        {/* Badge + course name */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #EDE9FE, #F3DAFF)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Award size={20} style={{ color: C.secondary }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 4px", lineHeight: 1.4 }}>
              {cert.courseName}
            </h3>
            <p style={{ fontSize: 12, color: C.onVariant, margin: 0 }}>
              Giảng viên: {cert.teacherName}
            </p>
          </div>
        </div>

        {/* Issued date */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 8,
            backgroundColor: C.surfaceLow,
          }}
        >
          <div
            style={{
              width: 6, height: 6, borderRadius: "50%",
              backgroundColor: "#16a34a", flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, color: C.onVariant }}>
            Cấp ngày:&nbsp;
            <strong style={{ color: C.text }}>{issuedDate}</strong>
          </span>
        </div>

        {/* Verify code */}
        {cert.verifyCode && (
          <p style={{ fontSize: 11, color: C.onVariant, margin: 0, fontFamily: "monospace", wordBreak: "break-all" }}>
            #{cert.verifyCode}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 4 }}>
          <button
            onClick={() => navigate(`/courses/${cert.courseSlug}/certificate`)}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
              backgroundColor: C.secondary, color: "#fff",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <ExternalLink size={14} /> Xem chứng chỉ
          </button>

          <button
            onClick={() => {
              navigate(`/courses/${cert.courseSlug}/certificate`);
              setTimeout(() => window.print(), 800);
            }}
            style={{
              padding: "9px 14px", borderRadius: 8,
              border: `1.5px solid ${C.outline}`,
              backgroundColor: "#fff", color: C.onVariant,
              fontWeight: 600, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.secondary;
              e.currentTarget.style.color = C.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.outline;
              e.currentTarget.style.color = C.onVariant;
            }}
            title="Tải về / In"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState({ filtered }) {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: "center", padding: "80px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: C.surfaceLow, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Award size={36} style={{ color: C.outline }} />
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>
          {filtered ? "Không tìm thấy chứng chỉ" : "Bạn chưa có chứng chỉ nào"}
        </p>
        <p style={{ fontSize: 14, color: C.onVariant, margin: 0 }}>
          {filtered
            ? "Thử từ khóa khác nhé."
            : "Hoàn thành 100% khóa học để nhận chứng chỉ của bạn."}
        </p>
      </div>
      {!filtered && (
        <button
          onClick={() => navigate("/my-courses")}
          style={{
            marginTop: 8, padding: "10px 24px", borderRadius: 10, border: "none",
            backgroundColor: C.secondary, color: "#fff", fontWeight: 700, fontSize: 14,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.secondary)}
        >
          Khóa học của tôi <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function MyCertificatesPage() {
  const [certs, setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    getMyCertificates()
      .then((res) => setCerts(res.result || []))
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = certs.filter((c) =>
    c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
    c.teacherName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "80vh", backgroundColor: C.surface, padding: "40px 0 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>
            Chứng chỉ của tôi
          </h1>
          {!loading && (
            <p style={{ fontSize: 14, color: C.onVariant, margin: 0 }}>
              {certs.length} chứng chỉ
            </p>
          )}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 28, maxWidth: 340 }}>
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute", left: 13, top: "50%",
                transform: "translateY(-50%)", color: C.onVariant, pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Tìm chứng chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "9px 14px 9px 36px", borderRadius: 10,
                border: `1px solid ${C.outline}`, backgroundColor: "#fff",
                fontSize: 13, outline: "none", color: C.text,
              }}
              onFocus={(e) => (e.target.style.borderColor = C.secondary)}
              onBlur={(e) => (e.target.style.borderColor = C.outline)}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={styles.grid}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filtered={search !== ""} />
        ) : (
          <div style={styles.grid}>
            {filtered.map((c, i) => (
              <CertificateCard key={c.verifyCode || c.courseSlug || i} cert={c} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/* ─── Styles ─── */
const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    border: `1px solid ${C.outline}`,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
};