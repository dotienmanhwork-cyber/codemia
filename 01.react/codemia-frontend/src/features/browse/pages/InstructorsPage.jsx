import { useState, useMemo } from "react";
import { Search, BookOpen, Users, Star, Sparkles, Code, Smartphone, Cpu, BookOpenCheck, HelpCircle } from "lucide-react";
import { C } from "@/shared/utils/constants";

// Mock data giảng viên chất lượng cao
const INSTRUCTORS = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    title: "Senior Frontend Engineer @ Tech Corp, Cựu Tech Lead tại VNG",
    specialty: "Lập trình Web",
    bio: "Hơn 10 năm kinh nghiệm thực chiến phát triển các ứng dụng web quy mô lớn. Đam mê truyền tải kiến thức lập trình dễ hiểu cho mọi người.",
    tags: ["React", "Node.js", "TypeScript", "Next.js", "Tailwind CSS"],
    courseCount: 8,
    studentCount: 12450,
    rating: 4.9,
    avatarGradient: "linear-gradient(135deg, #8c06d8 0%, #5624d0 100%)",
  },
  {
    id: 2,
    name: "Trần Thị B",
    title: "AI Research Scientist, Tiến sĩ Khoa học Máy tính",
    specialty: "AI & ML",
    bio: "Chuyên gia nghiên cứu về Học sâu và Xử lý ngôn ngữ tự nhiên. Từng công bố nhiều bài báo khoa học quốc tế uy tín.",
    tags: ["Python", "PyTorch", "TensorFlow", "NLP", "Machine Learning"],
    courseCount: 5,
    studentCount: 8900,
    rating: 4.8,
    avatarGradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  },
  {
    id: 3,
    name: "Phạm Minh C",
    title: "Mobile Tech Lead, Chuyên gia Flutter & iOS",
    specialty: "Mobile",
    bio: "Thích xây dựng các ứng dụng di động mượt mà và tối ưu hiệu năng. Đã phát hành hàng chục ứng dụng trên App Store & Google Play.",
    tags: ["Flutter", "Dart", "Swift", "React Native", "iOS/Android"],
    courseCount: 6,
    studentCount: 6320,
    rating: 4.9,
    avatarGradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
  },
  {
    id: 4,
    name: "Lê Hoàng D",
    title: "Giảng viên CNTT Đại học Bách Khoa",
    specialty: "Cơ bản",
    bio: "Thầy giáo tận tâm với hơn 15 năm giảng dạy lập trình cơ bản cho sinh viên. Giúp hàng nghìn người mất gốc lập trình thành công.",
    tags: ["C++", "Java", "Cấu trúc dữ liệu", "Giải thuật", "OOP"],
    courseCount: 10,
    studentCount: 24100,
    rating: 4.9,
    avatarGradient: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
  },
  {
    id: 5,
    name: "Vũ Đông E",
    title: "Solutions Architect, Fullstack Developer",
    specialty: "Lập trình Web",
    bio: "Chuyên gia thiết kế hệ thống backend hiệu năng cao, chịu tải lớn và tự động hóa quy trình CI/CD.",
    tags: ["Golang", "Docker", "AWS", "Kubernetes", "PostgreSQL"],
    courseCount: 4,
    studentCount: 5120,
    rating: 4.7,
    avatarGradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
  },
  {
    id: 6,
    name: "Hoàng Lan F",
    title: "Data Analyst & ML Engineer",
    specialty: "AI & ML",
    bio: "Hướng dẫn phân tích dữ liệu từ cơ bản đến nâng cao. Tập trung vào thực hành thực tế qua các bài toán doanh nghiệp.",
    tags: ["SQL", "Python", "Pandas", "Scikit-Learn", "Data Visualization"],
    courseCount: 3,
    studentCount: 3450,
    rating: 4.8,
    avatarGradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
  }
];

const SPECIALTIES = [
  { id: "all", name: "Tất cả", icon: Sparkles },
  { id: "web", name: "Lập trình Web", icon: Code },
  { id: "mobile", name: "Mobile", icon: Smartphone },
  { id: "ai", name: "AI & ML", icon: Cpu },
  { id: "basic", name: "Cơ bản", icon: BookOpenCheck },
];

export default function InstructorsPage() {
  const [activeSpecialty, setActiveSpecialty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Lọc giảng viên theo chuyên môn và từ khóa tìm kiếm
  const filteredInstructors = useMemo(() => {
    return INSTRUCTORS.filter((inst) => {
      // 1. Lọc theo chuyên môn
      if (activeSpecialty !== "all") {
        const specObj = SPECIALTIES.find((s) => s.id === activeSpecialty);
        if (specObj && inst.specialty !== specObj.name) {
          return false;
        }
      }

      // 2. Lọc theo từ khóa (tên, chức danh, kỹ năng)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = inst.name.toLowerCase().includes(q);
        const matchesTitle = inst.title.toLowerCase().includes(q);
        const matchesTags = inst.tags.some((t) => t.toLowerCase().includes(q));
        return matchesName || matchesTitle || matchesTags;
      }

      return true;
    });
  }, [activeSpecialty, searchQuery]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fcf8f8" }}>
      {/* ── Banner/Header ── */}
      <div 
        className="relative overflow-hidden text-white py-16 px-10 border-b"
        style={{ 
          background: `linear-gradient(135deg, #181a1c 0%, #2e1047 100%)`,
          borderColor: C.outline
        }}
      >
        {/* Decorative background glow */}
        <div 
          className="absolute right-0 top-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20"
          style={{ backgroundColor: C.secondary }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div>
            <h1 className="text-[32px] md:text-[38px] font-extrabold tracking-tight mb-2">
              Đội Ngũ Giảng Viên
            </h1>
            <p className="text-[16px] text-gray-300 max-w-[600px] leading-relaxed">
              Học hỏi từ các chuyên gia hàng đầu ngành công nghệ, những người mang kinh nghiệm thực chiến từ các doanh nghiệp lớn vào từng bài giảng.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-80 shrink-0">
            <input
              type="text"
              placeholder="Tìm tên, kỹ năng (React, Python...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full py-3 pl-5 pr-12 text-[14px] outline-none border transition-all text-[#181a1c]"
              style={{ 
                backgroundColor: "rgba(255, 255, 255, 0.95)", 
                borderColor: C.outline,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
              }}
              onFocus={(e) => (e.target.style.borderColor = C.secondary)}
              onBlur={(e) => (e.target.style.borderColor = C.outline)}
            />
            <Search 
              size={18} 
              className="absolute right-4 top-3.5" 
              style={{ color: C.onVariant }} 
            />
          </div>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="px-10 py-10" style={{ maxWidth: 1280, margin: "0 auto" }}>
        
        {/* Specialty filter bar */}
        <div className="flex flex-wrap gap-2.5 mb-10 items-center">
          <span className="text-[13px] font-bold uppercase tracking-wider text-gray-500 mr-2">
            Chuyên môn:
          </span>
          {SPECIALTIES.map((spec) => {
            const isActive = activeSpecialty === spec.id;
            const Icon = spec.icon;
            return (
              <button
                key={spec.id}
                onClick={() => setActiveSpecialty(spec.id)}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-semibold border transition-all cursor-pointer shadow-sm"
                style={
                  isActive
                    ? { backgroundColor: C.secondary, color: "white", borderColor: C.secondary }
                    : { backgroundColor: C.surfaceCont, color: C.onVariant, borderColor: C.outline }
                }
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = C.surfaceHigh; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = C.surfaceCont; }}
              >
                <Icon size={14} />
                {spec.name}
              </button>
            );
          })}
        </div>

        {/* Instructors grid list */}
        {filteredInstructors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstructors.map((inst) => {
              // Lấy chữ cái đầu của tên để làm avatar
              const initials = inst.name.trim().split(" ").slice(-2).map(n => n[0]).join("").toUpperCase();

              return (
                <div
                  key={inst.id}
                  className="rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 bg-white"
                  style={{ borderColor: C.outline }}
                >
                  <div className="p-6">
                    {/* Header: Avatar + Tên & Chức danh */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar container */}
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-[20px] shrink-0 shadow-inner"
                        style={{ background: inst.avatarGradient }}
                      >
                        {initials}
                      </div>

                      {/* Name & Title */}
                      <div className="min-w-0">
                        <h3 className="text-[18px] font-bold text-[#181a1c] leading-tight mb-1 truncate">
                          {inst.name}
                        </h3>
                        <p className="text-[12px] font-semibold text-purple-700 tracking-wide uppercase mb-1">
                          {inst.specialty}
                        </p>
                        <p 
                          className="text-[13px] font-medium leading-tight text-gray-500 line-clamp-2"
                          title={inst.title}
                        >
                          {inst.title}
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-[14px] text-gray-600 leading-relaxed mb-4 line-clamp-3">
                      {inst.bio}
                    </p>

                    {/* Skills tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {inst.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide bg-gray-100 text-gray-600 border border-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Stats block */}
                  <div 
                    className="px-6 py-4 flex justify-between items-center text-[13px] font-bold border-t"
                    style={{ 
                      backgroundColor: "#fafafb",
                      borderColor: C.outline 
                    }}
                  >
                    <div className="flex items-center gap-1.5 text-gray-600" title="Số lượng khóa học">
                      <BookOpen size={15} style={{ color: C.secondary }} />
                      <span>{inst.courseCount} bài học</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-600" title="Tổng số học viên">
                      <Users size={15} style={{ color: C.secondary }} />
                      <span>{inst.studentCount.toLocaleString()} học viên</span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500" title="Đánh giá trung bình">
                      <Star size={15} className="fill-amber-500 stroke-amber-500" />
                      <span>{inst.rating}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div 
            className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border bg-white"
            style={{ borderColor: C.outline }}
          >
            <HelpCircle size={48} className="text-gray-400 mb-3" />
            <h3 className="text-[18px] font-bold text-[#181a1c] mb-1">
              Không tìm thấy giảng viên
            </h3>
            <p className="text-[14px] text-gray-500 max-w-sm mb-4">
              Vui lòng thử tìm kiếm với từ khóa khác hoặc chuyển đổi bộ lọc chuyên môn.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveSpecialty("all");
              }}
              className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white transition-colors cursor-pointer"
              style={{ backgroundColor: C.secondary }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.secondary)}
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
