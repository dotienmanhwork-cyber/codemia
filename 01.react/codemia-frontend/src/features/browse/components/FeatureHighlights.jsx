import { Route, Bot, BadgeCheck } from "lucide-react";
import { C } from "@/shared/utils/constants";
import { FEATURES } from "../__mocks__/mockData";

function renderIcon(name) {
  if (name === "Route") return <Route size={28} style={{ color: C.secondary }} />;
  if (name === "Bot") return <Bot size={28} color="white" />;
  if (name === "BadgeCheck") return <BadgeCheck size={28} style={{ color: "#181a1c" }} />;
  return null;
}

export default function FeatureHighlights() {
  return (
    <section style={{ backgroundColor: C.surfaceLow }} className="py-14">
      <div className="grid grid-cols-3 gap-6 px-6" style={{ maxWidth: 1280, margin: "0 auto" }}>
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="p-8 rounded-xl border flex flex-col gap-3 relative overflow-hidden transition-transform duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: C.surface,
              borderColor: f.highlight ? C.secondary : C.outline,
              borderTopWidth: f.highlight ? "2px" : "1px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            {f.highlight && (
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-[0.06]"
                style={{ backgroundColor: C.secondary }} />
            )}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: f.iconBg.startsWith("linear") ? f.iconBg : undefined,
                backgroundColor: !f.iconBg.startsWith("linear") ? f.iconBg : undefined,
              }}
            >
              {renderIcon(f.iconName)}
            </div>
            <h3 className="text-[19px] font-semibold text-[#181a1c]">{f.title}</h3>
            <p className="text-[14px] leading-relaxed" style={{ color: C.onVariant }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}