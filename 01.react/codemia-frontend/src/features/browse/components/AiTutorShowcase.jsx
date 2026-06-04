import { useState } from "react";
import { BrainCircuit, CheckCircle2, MessageCircle, Bot, Send } from "lucide-react";
import GradText from "@/shared/components/dashboard-ui/GradText";
import { C, AI_GRAD } from "@/shared/utils/constants";

export default function AiTutorShowcase() {
  const [input, setInput] = useState("Cảm ơn, tôi đã h");
  return (
    <section className="py-14 px-6" style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div
        className="rounded-2xl border overflow-hidden relative flex"
        style={{ backgroundColor: C.surfaceLow, borderColor: C.outline, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="absolute top-[-40%] right-[-8%] w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none opacity-[0.07]" style={{ backgroundImage: AI_GRAD }} />
        <div className="absolute bottom-[-40%] left-[-8%] w-[360px] h-[360px] rounded-full blur-3xl pointer-events-none opacity-[0.05]" style={{ backgroundColor: C.secondary }} />

        <div className="flex-1 p-14 flex flex-col justify-center relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit size={24} style={{ color: "#6366F1" }} />
            <GradText className="text-[12px] font-bold uppercase tracking-widest">
              Tính năng độc quyền
            </GradText>
          </div>
          <h2 className="text-[34px] font-bold text-[#181a1c] mb-4 leading-tight">
            Trò Chuyện Cùng<br /><GradText>Codemia AI Tutor</GradText>
          </h2>
          <p className="text-[15px] leading-relaxed mb-7" style={{ color: C.onVariant }}>
            Không còn cảm giác đơn độc khi học trực tuyến. AI Tutor của Codemia được huấn luyện
            trên toàn bộ nội dung khóa học, sẵn sàng giải thích khái niệm phức tạp, tóm tắt bài
            giảng và tạo bài tập thực hành sát với trình độ của bạn.
          </p>
          <ul className="flex flex-col gap-2.5 mb-8">
            {[
              "Giải thích chi tiết đoạn code hoặc công thức",
              "Tự động tạo flashcard từ video bài giảng",
              "Gợi ý tài liệu đọc thêm phù hợp với mục tiêu",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[14px] text-[#181a1c]">
                <CheckCircle2 size={18} style={{ color: C.secondary, flexShrink: 0, marginTop: 1 }} />
                {item}
              </li>
            ))}
          </ul>
          <button
            className="px-6 py-3 text-[14px] font-semibold text-white rounded flex items-center gap-2 w-fit transition-colors"
            style={{ backgroundColor: C.secondary }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.secondary)}
          >
            Trải nghiệm Chat AI <MessageCircle size={17} />
          </button>
        </div>

        <div
          className="flex-1 border-l flex items-center justify-center p-8 relative z-10"
          style={{ backgroundColor: C.surface, borderColor: C.outline }}
        >
          <div
            className="w-full max-w-[400px] rounded-xl border flex flex-col overflow-hidden"
            style={{ height: 440, borderColor: C.outline, boxShadow: "0 8px 24px rgba(0,0,0,0.07)" }}
          >
            <div className="p-3 border-b flex items-center gap-2" style={{ backgroundColor: C.surfaceLow, borderColor: C.outline }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundImage: AI_GRAD }}>
                <Bot size={16} color="white" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#181a1c]">Codemia Tutor</p>
                <p className="text-[11px] flex items-center gap-1" style={{ color: C.success }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: C.success }} />
                  Online
                </p>
              </div>
            </div>

            <div className="flex-grow p-3 flex flex-col gap-3 overflow-y-auto" style={{ backgroundColor: "#fcf8f8" }}>
              <div
                className="self-end p-3 rounded-lg rounded-tr-none max-w-[85%] text-[13px] text-[#181a1c] border"
                style={{ backgroundColor: C.surface, borderColor: C.outline }}
              >
                Bạn có thể giải thích lại khái niệm Closure trong JavaScript ở bài giảng vừa rồi không?
              </div>
              <div className="self-start flex gap-2 max-w-[88%]">
                <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-1" style={{ backgroundImage: AI_GRAD }}>
                  <BrainCircuit size={13} color="white" />
                </div>
                <div
                  className="p-3 rounded-lg rounded-tl-none border text-[13px] text-[#181a1c] relative overflow-hidden"
                  style={{ backgroundColor: "rgba(243,218,255,0.3)", borderColor: `${C.secondary}30` }}
                >
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundImage: AI_GRAD }} />
                  <p className="mb-2 pl-1">Hãy tưởng tượng Closure như một chiếc balo. Khi hàm được tạo ra, nó sẽ "đeo" balo chứa tất cả biến xung quanh nó vào.</p>
                  <div
                    className="p-2 rounded text-[11px] font-mono border ml-1"
                    style={{ backgroundColor: C.surfaceHighest, borderColor: `${C.outline}80`, color: C.onVariant }}
                  >
                    {`function outer() {`}<br />
                    {`  let name = "Codemia";`}<br />
                    {`  return function inner() {`}<br />
                    {`    console.log(name);`}<br />
                    {`  }`}<br />
                    {`}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2 border-t" style={{ backgroundColor: C.surface, borderColor: C.outline }}>
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hỏi Codemia Tutor..."
                  className="w-full rounded-full py-2 pl-4 pr-10 text-[13px] outline-none border transition-all"
                  style={{ backgroundColor: C.surfaceCont, borderColor: C.outline }}
                  onFocus={(e)  => (e.target.style.borderColor = C.secondary)}
                  onBlur={(e)   => (e.target.style.borderColor = C.outline)}
                />
                <button
                  className="absolute right-2 top-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: C.secondary }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.accentHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.secondary)}
                >
                  <Send size={14} color="white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}