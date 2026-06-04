import { useState } from "react";
import { Globe, Mail, Share2 } from "lucide-react";

const LOGO_URL = "/assets/logo-codemia.png";

const C = {
  secondary:   "#8c06d8",
  accentHover: "#5624D0",
  surfaceLow:  "#f6f3f2",
  surfaceCont: "#f1eded",
  outline:     "#c5c6ca",
  onVariant:   "#44474a",
  surface:     "#fcf8f8",
};

const FOOTER_LINKS = {
  "Khám Phá":  ["Khóa học Mới", "Lộ trình AI", "Dành cho Doanh nghiệp", "Trở thành Giảng viên"],
  "Hỗ Trợ":   ["Trung tâm Trợ giúp", "Câu hỏi thường gặp", "Liên hệ", "Blog"],
  "Về Chúng Tôi": ["Giới thiệu", "Đội ngũ", "Tuyển dụng", "Báo chí"],
};

const SOCIAL_ICONS = [Globe, Mail, Share2];

export default function Footer() {
  const [logoError, setLogoError] = useState(false);

  return (
    <footer
      className="border-t w-full"
      style={{ backgroundColor: C.surface, borderColor: C.outline }}
    >
      {/* Main grid */}
      <div className="w-full max-w-[1280px] mx-auto px-10 pt-14 pb-10 grid grid-cols-4 gap-10 items-start">

        {/* Brand block */}
        <div className="flex flex-col gap-4">
          <a href="/" className="flex items-center gap-2 h-10">
            {!logoError ? (
              <img
                src={LOGO_URL}
                alt="Codemia"
                className="h-30 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-[#8c06d8] rounded-xl flex items-center justify-center shadow-[0_0_12px_rgba(140,6,216,0.4)]">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
                <span className="font-bold text-[22px] tracking-tight" style={{ color: C.secondary }}>
                  Codemia
                </span>
              </div>
            )}
          </a>
          <p className="text-[13px] leading-relaxed" style={{ color: C.onVariant }}>
            Nền tảng học lập trình trực tuyến tích hợp AI — học thông minh hơn, nhanh hơn.
          </p>
          <div className="flex gap-3 mt-1">
            {SOCIAL_ICONS.map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="transition-colors"
                style={{ color: C.onVariant }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.secondary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.onVariant)}
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading} className="flex flex-col gap-3">
            <h4
              className="text-[13px] font-bold uppercase tracking-widest h-10 flex items-center"
              style={{ color: "#181a1c" }}
            >
              {heading}
            </h4>
            {links.map((l) => (
              <a
                key={l}
                href="#"
                className="text-[14px] transition-colors"
                style={{ color: C.onVariant }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.secondary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.onVariant)}
              >
                {l}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        className="border-t w-full"
        style={{ borderColor: C.outline }}
      >
        <div className="max-w-[1280px] mx-auto px-10 py-4 flex justify-between items-center">
          <p className="text-[13px]" style={{ color: C.onVariant }}>
            © 2024 Codemia Inc. Đã đăng ký bản quyền.
          </p>
          <div className="flex gap-6 text-[13px]" style={{ color: C.onVariant }}>
            {["Điều khoản Sử dụng", "Chính sách Bảo mật"].map((l) => (
              <a
                key={l}
                href="#"
                className="transition-colors hover:underline"
                onMouseEnter={(e) => (e.currentTarget.style.color = C.secondary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.onVariant)}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
