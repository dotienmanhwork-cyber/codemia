import { AI_GRAD } from "@/shared/utils/constants";

export default function GradText({ children, className = "" }) {
  return (
    <span
      className={className}
      style={{
        backgroundImage: AI_GRAD,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}
