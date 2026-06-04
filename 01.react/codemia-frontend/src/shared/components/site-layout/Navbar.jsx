import { useState, useRef, useEffect } from "react";
import { Search, LogOut, ChevronDown, User, BookOpen, Grid3x3, ArrowRight, Award } from "lucide-react";
import NotifButton from "@/shared/components/dashboard-ui/NotifButton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import { getMyCourses } from "@/features/learning/api/learning.api";
import { catalogApi } from "@/features/browse/api/catalog.api";
const LOGO_URL = "/assets/logo-codemia.png";

const C = {
  secondary:    "#8c06d8",
  accentHover:  "#5624D0",
  surfaceLow:   "#f6f3f2",
  surfaceCont:  "#f1eded",
  surfaceHigh:  "#ebe7e7",
  outline:      "#c5c6ca",
  onVariant:    "#44474a",
  surface:      "#fcf8f8",
};

// "Courses" đổi thành "Khám phá" — phân biệt với "My Course" (khóa học đã mua)
// "Instructors" giữ nguyên
const NAV_LINKS = ["Trang chủ", "Khám phá", "Giảng viên"];

function getDisplayName(user) {
  if (!user) return "";
  if (user.fullName) return user.fullName.trim().split(" ").slice(-1)[0];
  if (user.name)     return user.name.trim().split(" ").slice(-1)[0];
  if (user.email)    return user.email.split("@")[0];
  return "bạn";
}

function Avatar({ user }) {
  const letter = getDisplayName(user)?.[0]?.toUpperCase() || "U";
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt="avatar"
        className="w-8 h-8 rounded-full object-cover"
        style={{ outline: `2px solid ${C.secondary}` }}
      />
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
      style={{ backgroundColor: C.secondary }}
    >
      {letter}
    </div>
  );
}

// ─── Category Mega Dropdown ─────────────────────────────────────
function CategoryDropdown({ onClose, navigate, onMouseEnter, onMouseLeave }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    catalogApi.getAllCategories()
      .then(data => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCategoryClick = (cat) => {
    navigate(`/courses?category=${cat.id}`);
    onClose();
  };

  const handleViewAll = () => {
    navigate("/courses");
    onClose();
  };

  return (
    <div
      className="absolute left-0 top-full mt-1 rounded-2xl border shadow-2xl overflow-hidden"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        backgroundColor: C.surface,
        borderColor: C.outline,
        width: 460,
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: `1px solid ${C.outline}` }}
      >
        <div className="flex items-center gap-2">
          <Grid3x3 size={16} style={{ color: C.secondary }} />
          <span className="text-[15px] font-bold" style={{ color: "#181a1c" }}>
            Danh mục khóa học
          </span>
        </div>
        <button
          onClick={handleViewAll}
          className="flex items-center gap-1 text-[13px] font-semibold transition-colors"
          style={{ color: C.secondary }}
          onMouseEnter={e => e.currentTarget.style.color = C.accentHover}
          onMouseLeave={e => e.currentTarget.style.color = C.secondary}
        >
          Tất cả khóa học
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {loading ? (
          /* Skeleton loading */
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl animate-pulse"
                style={{ backgroundColor: C.surfaceLow }}
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <Grid3x3 size={28} style={{ color: C.outline }} />
            <span className="text-[13px]" style={{ color: C.onVariant }}>
              Chưa có danh mục
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {categories.map(cat => {
              const subCount = cat.children?.length;
              const subtitle = cat.courseCount != null
                ? `${cat.courseCount} khóa học`
                : subCount > 0
                  ? `${subCount} chuyên mục`
                  : null;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{ color: "#181a1c" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = C.surfaceLow;
                    e.currentTarget.style.color = C.secondary;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#181a1c";
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[16px]"
                    style={{ backgroundColor: C.surfaceCont }}
                  >
                    {cat.icon || cat.name?.[0] || "📚"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate leading-tight">
                      {cat.name}
                    </p>
                    {subtitle && (
                      <p className="text-[11px] mt-0.5" style={{ color: C.onVariant }}>
                        {subtitle}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderTop: `1px solid ${C.outline}`, backgroundColor: C.surfaceLow }}
      >
        <span className="text-[12px]" style={{ color: C.onVariant }}>
          Tìm kiếm theo chủ đề bạn muốn học
        </span>
        <button
          onClick={handleViewAll}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: C.secondary, color: "#fff" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = C.accentHover}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = C.secondary}
        >
          Xem tất cả
        </button>
      </div>
    </div>
  );
}

// ─── Main Navbar ───────────────────────────────────────────────
export default function Navbar() {
  const [active, setActive]             = useState("Trang chủ");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [myCoursesOpen, setMyCoursesOpen] = useState(false);
  const [myCourses, setMyCourses]       = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchText, setSearchText]     = useState("");

  const dropdownRef   = useRef(null);
  const myCoursesRef  = useRef(null);
  const categoryRef   = useRef(null);
  const hoverTimer    = useRef(null);

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
      if (myCoursesRef.current && !myCoursesRef.current.contains(e.target))
        setMyCoursesOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(e.target))
        setCategoryOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  const handleOpenMyCourses = async () => {
    const next = !myCoursesOpen;
    setMyCoursesOpen(next);
    if (next) {
      setCoursesLoading(true);
      try {
        const res = await getMyCourses();
        setMyCourses(res.result || []);
      } catch(err) {
        console.error("getMyCourses error:", err);
        setMyCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    }
  };

  const handleCategoryMouseEnter = () => {
    clearTimeout(hoverTimer.current);
    setCategoryOpen(true);
  };
  const handleCategoryMouseLeave = () => {
    hoverTimer.current = setTimeout(() => setCategoryOpen(false), 180);
  };

  const handleNavClick = (link) => {
    setActive(link);
    if (link === "Trang chủ") navigate("/");
    if (link === "Giảng viên") navigate("/instructors");
  };

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: C.surface, borderColor: C.outline, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="flex justify-between items-center w-full px-10 h-16">

        {/* TRÁI: Logo + Nav */}
        <div className="flex items-center gap-12 h-full">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <img
              src={LOGO_URL}
              alt="Codemia"
              className="h-50 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextSibling.style.display = "block";
              }}
            />
            <span className="font-bold text-[24px] tracking-tight" style={{ color: C.secondary, display: "none" }}>
              Codemia
            </span>
          </a>

          <nav className="flex gap-8 items-center h-full">
            {NAV_LINKS.map((link) => {
              const isExplore = link === "Khám phá";
              return isExplore ? (
                <div
                  key={link}
                  ref={categoryRef}
                  className="relative h-full flex items-center"
                  onMouseEnter={handleCategoryMouseEnter}
                  onMouseLeave={handleCategoryMouseLeave}
                >
                  <button
                    onClick={() => { setActive(link); setCategoryOpen(v => !v); }}
                    className="h-full flex items-center gap-1 text-[15px] font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap"
                    style={{
                      color: active === link || categoryOpen ? C.secondary : C.onVariant,
                      borderBottom: active === link || categoryOpen
                        ? `2px solid ${C.secondary}` : "2px solid transparent",
                      background: "none",
                      border: "none",
                    }}
                  >
                    {link}
                    <ChevronDown
                      size={14}
                      style={{
                        transform: categoryOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        color: active === link || categoryOpen ? C.secondary : C.onVariant,
                      }}
                    />
                  </button>

                  {categoryOpen && (
                    <CategoryDropdown
                      onClose={() => { setCategoryOpen(false); }}
                      navigate={navigate}
                      onMouseEnter={handleCategoryMouseEnter}
                      onMouseLeave={handleCategoryMouseLeave}
                    />
                  )}
                </div>
              ) : (
                <a
                  key={link}
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleNavClick(link); }}
                  className="h-full flex items-center text-[15px] font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap"
                  style={{
                    color: active === link && !categoryOpen ? C.secondary : C.onVariant,
                    borderBottom: active === link && !categoryOpen ? `2px solid ${C.secondary}` : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (active !== link || categoryOpen) e.currentTarget.style.color = C.accentHover; }}
                  onMouseLeave={(e) => { if (active !== link || categoryOpen) e.currentTarget.style.color = C.onVariant; }}
                >
                  {link}
                </a>
              );
            })}
          </nav>
        </div>

        {/* PHẢI */}
        <div className="flex items-center gap-6">

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(`/courses?search=${encodeURIComponent(searchText.trim())}`);
                }
              }}
              className="rounded-full py-2.5 pl-5 pr-10 text-[14px] outline-none transition-all border w-72"
              style={{ backgroundColor: C.surfaceLow, borderColor: C.outline }}
              onFocus={(e) => (e.target.style.borderColor = C.secondary)}
              onBlur={(e) => (e.target.style.borderColor = C.outline)}
            />
            <button
              onClick={() => navigate(`/courses?search=${encodeURIComponent(searchText.trim())}`)}
              className="absolute right-3 top-2.5 p-1 rounded-full hover:bg-gray-200/50 transition-colors cursor-pointer"
              style={{ background: "none", border: "none" }}
            >
              <Search size={18} style={{ color: C.onVariant }} />
            </button>
          </div>

          {/* Instructor / Admin Dashboard */}
          {user?.role === "TEACHER" ? (
            <a
              href="/teacher"
              className="text-[14px] font-semibold whitespace-nowrap transition-colors"
              style={{ color: C.onVariant }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.secondary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.onVariant)}
            >
              Kênh giảng viên
            </a>
          ) : user?.role === "ADMIN" ? (
            <a
              href="/admin"
              className="text-[14px] font-semibold whitespace-nowrap transition-colors"
              style={{ color: C.onVariant }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.secondary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.onVariant)}
            >
              Kênh quản trị
            </a>
          ) : (
            <a
              href="/teach"
              className="text-[14px] font-semibold whitespace-nowrap transition-colors"
              style={{ color: C.onVariant }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.secondary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.onVariant)}
            >
              Giảng dạy trên Codemia
            </a>
          )}

          {/* My Course dropdown — chỉ hiện khi đã login */}
          {isLoggedIn && (
            <div className="relative" ref={myCoursesRef}>
              <button
                onClick={handleOpenMyCourses}
                className="flex items-center gap-1.5 text-[14px] font-semibold transition-colors whitespace-nowrap"
                style={{ color: myCoursesOpen ? C.secondary : C.onVariant }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.secondary)}
                onMouseLeave={(e) => { if (!myCoursesOpen) e.currentTarget.style.color = C.onVariant; }}
              >
                Khóa học của tôi
                <ChevronDown
                  size={15}
                  style={{
                    transform: myCoursesOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              {myCoursesOpen && (
                <div
                  className="absolute left-0 mt-3 w-80 rounded-2xl border shadow-xl overflow-hidden"
                  style={{ backgroundColor: C.surface, borderColor: C.outline }}
                >
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <span className="text-[15px] font-bold" style={{ color: "#181a1c" }}>
                      Khóa học của tôi
                    </span>
                    <button
                      onClick={() => { navigate("/my-courses"); setMyCoursesOpen(false); }}
                      className="text-[13px] font-semibold transition-colors"
                      style={{ color: C.secondary }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.accentHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
                    >
                      Xem tất cả
                    </button>
                  </div>

                  <div style={{ height: "1px", backgroundColor: C.outline }} />

                  {coursesLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div
                        className="w-5 h-5 rounded-full border-2 animate-spin"
                        style={{ borderColor: C.outline, borderTopColor: C.secondary }}
                      />
                    </div>
                  ) : myCourses.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10">
                      <BookOpen size={32} style={{ color: C.outline }} />
                      <span className="text-[13px]" style={{ color: C.onVariant }}>
                        Bạn chưa có khóa học nào
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col py-2">
                      {myCourses.slice(0, 4).map((course) => (
                        <button
                          key={course.courseId}
                          onClick={() => { navigate(`/learning-workspace/${course.courseId}`); setMyCoursesOpen(false); }}
                          className="flex items-center gap-3 px-4 py-3 text-left w-full transition-colors"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surfaceLow)}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <div
                            className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: C.surfaceCont }}
                          >
                            {course.thumbnailUrl ? (
                              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen size={20} style={{ color: C.onVariant }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold truncate" style={{ color: "#181a1c" }}>
                              {course.title}
                            </p>
                            <div className="mt-1.5 h-1.5 rounded-full w-full" style={{ backgroundColor: C.surfaceHigh }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(Number(course.progressPercent) || 0, 100)}%`,
                                  backgroundColor: C.secondary,
                                  transition: "width 0.4s ease",
                                }}
                              />
                            </div>
                            <p className="mt-1 text-[11px]" style={{ color: C.onVariant }}>
                              {Number(course.progressPercent) === 0 ? (
                                <span style={{ color: C.secondary, fontWeight: 600 }}>Bắt đầu học</span>
                              ) : Number(course.progressPercent) >= 100 ? (
                                <span style={{ color: "#16a34a", fontWeight: 600 }}>Đã hoàn thành</span>
                              ) : (
                                `${Number(course.progressPercent).toFixed(0)}% hoàn thành`
                              )}
                            </p>
                          </div>
                        </button>
                      ))}

                      {myCourses.length > 4 && (
                        <>
                          <div style={{ height: "1px", backgroundColor: C.outline, margin: "4px 0" }} />
                          <button
                            onClick={() => { navigate("/my-courses"); setMyCoursesOpen(false); }}
                            className="w-full py-3 text-[13px] font-semibold text-center transition-colors"
                            style={{ color: C.secondary }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surfaceLow)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            Xem thêm {myCourses.length - 4} khóa học
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Icons */}
          <div className="flex items-center gap-1">
            <NotifButton variant="navbar" />
            <button
              onClick={() => navigate("/cart")}
              className="transition-colors p-2 rounded-full"
              style={{ color: C.onVariant }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.surfaceLow; e.currentTarget.style.color = C.secondary; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.onVariant; }}
            >
              <i className="ti ti-shopping-cart" style={{ fontSize: 20 }} />
            </button>
          </div>

          {/* AUTH */}
          <div className="flex gap-3 pl-4 border-l" style={{ borderColor: C.outline }}>
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: "#181a1c" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surfaceLow)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Avatar user={user} />
                  <span className="text-[14px] font-semibold max-w-[130px] truncate">
                    Chào, {getDisplayName(user)}
                  </span>
                  <ChevronDown
                    size={16}
                    style={{
                      color: C.onVariant,
                      transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-xl border shadow-lg overflow-hidden"
                    style={{ backgroundColor: C.surface, borderColor: C.outline }}
                  >
                    <button
                      onClick={() => { navigate("/profile"); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-[14px] font-medium text-left transition-colors"
                      style={{ color: "#181a1c" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surfaceLow)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <User size={16} style={{ color: C.onVariant }} />
                      Trang cá nhân
                    </button>
                    <button
                      onClick={() => { navigate("/my-certificates"); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-[14px] font-medium text-left transition-colors"
                      style={{ color: "#181a1c" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surfaceLow)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <Award size={16} style={{ color: C.onVariant }} />
                      Chứng chỉ của tôi
                    </button>
                    <div style={{ height: "1px", backgroundColor: C.outline }} />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-[14px] font-medium text-left transition-colors"
                      style={{ color: "#e53935" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fff5f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-5 py-2 text-[14px] font-semibold rounded-lg transition-colors border"
                  style={{ borderColor: C.outline, color: "#181a1c", backgroundColor: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surfaceLow)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-5 py-2 text-[14px] font-semibold rounded-lg text-white transition-colors border"
                  style={{ backgroundColor: C.secondary, borderColor: C.secondary }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.accentHover; e.currentTarget.style.borderColor = C.accentHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.secondary; e.currentTarget.style.borderColor = C.secondary; }}
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
