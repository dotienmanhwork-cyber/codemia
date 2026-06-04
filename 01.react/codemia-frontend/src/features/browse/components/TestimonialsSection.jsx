import { Quote, ChevronRight } from "lucide-react";
import { C } from "@/shared/utils/constants";
import { TESTIMONIALS } from "../__mocks__/mockData";

export default function TestimonialsSection() {
  return (
    <section className="py-14 border-t" style={{ backgroundColor: C.surface, borderColor: C.outline }}>
      <div className="px-6" style={{ maxWidth: 1280, margin: "0 auto" }}>
        <h2 className="text-[26px] font-bold text-[#181a1c] mb-8 max-w-3xl">
          Tham gia cùng những người khác thay đổi cuộc sống thông qua học tập
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="p-5 border rounded-lg flex flex-col"
              style={{ backgroundColor: C.surface, borderColor: C.outline, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <Quote size={40} className="mb-3" style={{ color: C.outline }} />
              <p className="text-[13px] leading-relaxed text-[#1c1b1b] mb-6 flex-grow">{t.text}</p>
              <div className="flex items-center gap-2 mb-3">
                <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="text-[13px] font-semibold text-[#181a1c]">{t.name}</p>
                  <p className="text-[11px]" style={{ color: C.onVariant }}>{t.role}</p>
                </div>
              </div>
              <a
                href="#"
                className="text-[13px] font-semibold flex items-center gap-1 mt-auto hover:underline"
                style={{ color: C.secondary }}
              >
                {t.link} <ChevronRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}