
import { PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GradText from "@/shared/components/dashboard-ui/GradText";
import { C } from "@/shared/utils/constants";
import heroImage from "../assets/Hero-Image.jpg";

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative w-full overflow-hidden bg-[#181a1c] min-h-[500px] flex items-center">
      {/* Background Image */}
      <img
        src={heroImage}
        alt="Codemia AI"
        className="absolute inset-0 w-full h-full object-cover object-center z-0"
      />

      {/* Gradient Overlay for superior text contrast */}
      <div 
        className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/55 to-transparent" 
      />

      {/* Hero Content Container */}
      <div 
        className="relative z-20 w-full px-6 py-20 md:py-28" 
        style={{ maxWidth: 1280, margin: "0 auto" }}
      >
        <div className="max-w-[640px] flex flex-col gap-5 text-white">
          <h1
            className="font-bold leading-[1.1] tracking-tight text-white"
            style={{ fontSize: "clamp(2.4rem, 4.2vw, 3.6rem)" }}
          >
            Học Tập Thông Minh Hơn{" "}
            <br />
            Với <GradText>Codemia AI</GradText>
          </h1>
          
          <p 
            className="text-[17px] leading-relaxed max-w-[540px] text-gray-200"
          >
            Codemia kết hợp trí tuệ nhân tạo tiên tiến với các khóa học chất lượng cao, mang đến lộ
            trình học tập chi tiết, gia sư ảo 24/7 và trải nghiệm giáo dục tương lai.
          </p>

          <div className="flex gap-4 mt-2">
            <button
              onClick={() => navigate("/courses")}
              className="px-7 py-3 text-[14px] font-semibold text-white rounded transition-colors shadow-sm cursor-pointer"
              style={{ backgroundColor: C.secondary }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.secondary)}
            >
              Bắt đầu ngay
            </button>
            <button
              className="px-7 py-3 text-[14px] font-semibold rounded border flex items-center gap-2 transition-colors cursor-pointer text-white border-white/30 bg-white/5 backdrop-blur-sm"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
            >
              <PlayCircle size={20} /> Xem video giới thiệu
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}