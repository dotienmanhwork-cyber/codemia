// src/features/learning/pages/MyCoursesPage.jsx
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Trophy, PlayCircle, Award, Clock, ChevronRight } from "lucide-react";
import { useMyCourses } from "../hooks/useMyCourses";

/* ─── Helpers ─── */
const clamp = (v) => Math.min(Math.max(Number(v) || 0, 0), 100);

function getCourseSlug(course) {
  const slug =
    course.slug ??
    course.courseSlug ??
    course.slugUrl ??
    course.urlSlug ??
    null;
  if (!slug) {
    console.warn(
      "[MyCoursesPage] Course is missing a slug field.",
      "Available keys:", Object.keys(course),
      "| courseId:", course.courseId
    );
  }
  return slug;
}

/* ─── Thumbnail fallback palettes (cycles by courseId) ─── */
const PALETTES = [
  { bg: "linear-gradient(145deg, #F3DAFF 0%, #C17EE8 100%)", icon: "#6d00ab" },
  { bg: "linear-gradient(145deg, #EAF3DE 0%, #7DBE56 100%)", icon: "#1E7E34" },
  { bg: "linear-gradient(145deg, #E6F1FB 0%, #6BAEE8 100%)", icon: "#185FA5" },
  { bg: "linear-gradient(145deg, #FAEEDA 0%, #E8A83A 100%)", icon: "#854F0B" },
];
const getPalette = (id) => {
  const n = typeof id === "number" ? id : (String(id).charCodeAt(0) ?? 0);
  return PALETTES[n % PALETTES.length];
};

/* ─── Skeleton ─── */
function SkeletonCard() {
  const shimmer = {
    background: "var(--border-faint, #f1eded)",
    borderRadius: 6,
    animation: "mc-pulse 1.4s ease infinite",
  };
  return (
    <div style={{ ...S.card, minHeight: 90 }}>
      <div style={{
        width: 140, flexShrink: 0,
        background: "var(--border-faint, #f1eded)",
      }} />
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ ...shimmer, height: 11, width: "45%", animationDelay: "0s" }} />
        <div style={{ ...shimmer, height: 15, width: "80%", animationDelay: "0.1s" }} />
        <div style={{ ...shimmer, height: 10, width: "35%", animationDelay: "0.15s" }} />
        <div style={{ marginTop: "auto" }}>
          <div style={{ ...shimmer, height: 3, borderRadius: 99, marginBottom: 10, animationDelay: "0.2s" }} />
          <div style={{ ...shimmer, height: 32, borderRadius: "var(--radius-sm)", animationDelay: "0.25s" }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Stat card ─── */
function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "14px 18px",
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "var(--radius-sm)",
        background: accent + "14",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={17} style={{ color: accent }} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: "var(--ink-3)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          {label}
        </p>
        <p style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", margin: "0 0 1px", lineHeight: 1 }}>
          {value}
        </p>
        <p style={{ fontSize: 11, color: "var(--ink-3)", margin: 0 }}>{sub}</p>
      </div>
    </div>
  );
}

/* ─── Course card ─── */
function CourseCard({ course, index }) {
  const navigate = useNavigate();
  const percent  = clamp(course.progressPercent);
  const slug     = getCourseSlug(course);
  const palette  = getPalette(course.courseId);
  const isDone   = percent >= 100;
  const started  = percent > 0;

  const statusLabel = isDone ? "Hoàn thành" : started ? "Đang học" : "Chưa học";

  return (
    <div
      style={{ ...S.card, animationDelay: `${index * 0.055}s` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--purple)";
        e.currentTarget.style.boxShadow   = "0 4px 18px rgba(124,58,237,0.09)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow   = S.card.boxShadow;
      }}
    >
      {/* ── Thumbnail (fixed 160px, dark overlay ensures badge readability) ── */}
      <div
        onClick={() => navigate(`/learning-workspace/${course.courseId}`)}
        style={{
          width: 156, flexShrink: 0, position: "relative", overflow: "hidden",
          cursor: "pointer",
          background: course.thumbnailUrl ? "#1a1a2e" : palette.bg,
        }}
      >
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={28} style={{ color: palette.icon, opacity: 0.5 }} />
          </div>
        )}

        {/* Always-visible dark gradient at bottom */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, transparent 100%)",
          pointerEvents: "none",
        }} />

        {/* Status badge — white text on dark gradient, always legible */}
        <span style={{
          position: "absolute", bottom: 8, left: 8,
          fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
          whiteSpace: "nowrap",
          color: "#fff",
          background: isDone
            ? "rgba(22,163,74,0.75)"
            : started
            ? "rgba(124,58,237,0.75)"
            : "rgba(71,85,105,0.65)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          border: "1px solid rgba(255,255,255,0.15)",
          letterSpacing: "0.02em",
        }}>
          {statusLabel}
        </span>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: "13px 18px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0, gap: 8 }}>
        {/* Title & instructor */}
        <div>
          {course.instructorName && (
            <p style={{ fontSize: 11, color: "var(--ink-3)", margin: "0 0 3px", letterSpacing: "0.01em" }}>
              {course.instructorName}
            </p>
          )}
          <h3 style={{
            fontSize: 14, fontWeight: 600, color: "var(--ink)",
            margin: 0, lineHeight: 1.45,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {course.title}
          </h3>
        </div>

        {/* Progress */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Tiến độ</span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: isDone ? "#16a34a" : percent > 0 ? "var(--purple)" : "var(--ink-3)",
            }}>
              {percent}%
            </span>
          </div>
          <div style={{ height: 3, background: "var(--border-faint, #ece9f3)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${percent}%`, borderRadius: 99,
              background: isDone
                ? "linear-gradient(90deg, #16a34a, #4ade80)"
                : "linear-gradient(90deg, #7c3aed, #a78bfa)",
              transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
        </div>
      </div>

      {/* ── Action column (right) ── */}
      <div style={{
        flexShrink: 0, width: 130, padding: "0 16px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "stretch", gap: 7,
        borderLeft: "1px solid var(--border)",
      }}>
        <button
          onClick={() => navigate(`/learning-workspace/${course.courseId}`)}
          style={{
            padding: "8px 10px", borderRadius: 8, border: "none",
            background: isDone ? "#16a34a" : "var(--purple)",
            color: "#fff", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {isDone
            ? <><Trophy size={12} /> Xem lại</>
            : <><PlayCircle size={12} /> {started ? "Tiếp tục" : "Bắt đầu"}</>}
        </button>

        {isDone && (
          <button
            onClick={() => {
              if (!slug) return;
              navigate(`/courses/${slug}/certificate`);
            }}
            title="Xem chứng chỉ"
            style={{
              padding: "7px 10px", borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--ink-2)", fontSize: 11, fontWeight: 500,
              cursor: slug ? "pointer" : "not-allowed",
              opacity: slug ? 1 : 0.45,
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!slug) return;
              e.currentTarget.style.borderColor = "#16a34a";
              e.currentTarget.style.color       = "#16a34a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color       = "var(--ink-2)";
            }}
          >
            <Award size={12} /> Chứng chỉ
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState({ isFiltered, onReset }) {
  const navigate = useNavigate();
  return (
    <div style={{
      textAlign: "center", padding: "64px 16px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 68, height: 68, borderRadius: "50%",
        background: "var(--bg)", border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <BookOpen size={30} style={{ color: "var(--ink-3)" }} />
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: "0 0 6px" }}>
          {isFiltered ? "Không tìm thấy khóa học" : "Bạn chưa có khóa học nào"}
        </p>
        <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0 }}>
          {isFiltered
            ? "Thử từ khóa hoặc bộ lọc khác."
            : "Khám phá và đăng ký để bắt đầu hành trình học tập."}
        </p>
      </div>
      {isFiltered ? (
        <button
          onClick={onReset}
          style={{
            padding: "8px 18px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", background: "var(--surface)",
            color: "var(--ink-2)", fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Xóa bộ lọc
        </button>
      ) : (
        <button
          onClick={() => navigate("/courses")}
          style={{
            padding: "9px 20px", borderRadius: "var(--radius-sm)",
            border: "none", background: "var(--purple)",
            color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          Khám phá khóa học <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

/* ─── Main page ─── */
export default function MyCoursesPage() {
  const {
    courses, loading,
    search, setSearch,
    filter, setFilter,
    filtered, tabs,
  } = useMyCourses();

  const inProgress = courses.filter((c) => {
    const p = clamp(c.progressPercent);
    return p > 0 && p < 100;
  }).length;
  const completed = courses.filter((c) => clamp(c.progressPercent) >= 100).length;
  const isFiltered = search !== "" || filter !== "all";

  return (
    <div style={{ minHeight: "80vh", backgroundColor: "var(--bg)", padding: "var(--page-py, 24px) 0 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 var(--page-px, 26px)" }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", margin: "0 0 4px", letterSpacing: "-0.2px" }}>
            Khóa học của tôi
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-2)", margin: 0 }}>
            Tiếp tục hành trình học tập của bạn
          </p>
        </div>

        {/* ── Stats ── */}
        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 22 }}>
            <StatCard label="Tổng cộng"  value={courses.length} sub="khóa học" icon={BookOpen}   accent="var(--purple)" />
            <StatCard label="Đang học"   value={inProgress}     sub="khóa học" icon={Clock}      accent="var(--purple)" />
            <StatCard label="Hoàn thành" value={completed}      sub="khóa học" icon={Trophy}     accent="var(--green)"  />
          </div>
        )}

        {/* ── Filter bar ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                padding: "5px 13px", borderRadius: 99, cursor: "pointer",
                fontSize: 13, fontWeight: filter === t.key ? 600 : 400,
                border: `1px solid ${filter === t.key ? "var(--purple)" : "var(--border)"}`,
                background: filter === t.key ? "var(--purple)" : "var(--surface)",
                color: filter === t.key ? "#fff" : "var(--ink-2)",
                transition: "all 0.15s", fontFamily: "inherit",
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.65 }}>{t.count}</span>
              )}
            </button>
          ))}

          {/* Search */}
          <div style={{ marginLeft: "auto", position: "relative" }}>
            <Search
              size={14}
              style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", pointerEvents: "none" }}
            />
            <input
              type="text"
              placeholder="Tìm khóa học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "6px 14px 6px 32px", borderRadius: 99,
                border: "1px solid var(--border)",
                background: "var(--surface)", fontSize: 13,
                color: "var(--ink)", outline: "none", width: 200,
                fontFamily: "inherit", transition: "border-color 0.15s",
              }}
              onFocus={(e)  => (e.target.style.borderColor = "var(--purple)")}
              onBlur={(e)   => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            isFiltered={isFiltered}
            onReset={() => { setSearch(""); setFilter("all"); }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((c, i) => (
              <CourseCard key={c.courseId} course={c} index={i} />
            ))}
          </div>
        )}

      </div>

      <style>{`
        @keyframes mc-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        @keyframes mc-fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── Shared styles ─── */
const S = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "row",
    minHeight: 90,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    transition: "box-shadow 0.18s, border-color 0.18s",
    animation: "mc-fadeUp 0.3s ease both",
  },
};