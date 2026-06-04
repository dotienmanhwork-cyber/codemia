import { useState, useEffect, useRef } from "react";
import { X, Code2, ListChecks, Plus, Trash2, ChevronLeft } from "lucide-react";

// ─── Responsive hook (theo RESPONSIVE.md §6) ───────────────────────────────

function useIsMobile(breakpoint) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: "java",    label: "Java"    },
  { value: "python",  label: "Python"  },
  { value: "cpp",     label: "C++"     },
  { value: "c",       label: "C"       },
  { value: "d",       label: "D"       },
  { value: "fortran", label: "Fortran" },
];

const DIFFICULTIES = [
  { value: "EASY", label: "Dễ", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  { value: "MEDIUM", label: "Trung bình",     color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { value: "HARD", label: "Khó", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
];

const FILE_NAME_MAP = {
  java:    "Main.java",
  python:  "main.py",
  cpp:     "main.cpp",
  c:       "main.c",
  d:       "main.d",
  fortran: "main.f90",
};

const ANSWER_OPTIONS = ["A", "B", "C", "D"];

const emptyQuestion = (orderIndex) => ({
  orderIndex, questionText: "", optionA: "", optionB: "",
  optionC: "", optionD: "", correctAnswer: "A", explanation: "",
});

const initialCodeForm = {
  title: "", description: "", difficulty: "EASY", tag: "",
  timeEstimate: "", language: "java", starterCode: "",
  fileName: "Main.java", requirements: [""],
  codeType: "STANDARD",
  testCode: "",
  testCases: [{ input: "", expectedOutput: "" }],
};

const initialQuizForm = {
  title: "", description: "", difficulty: "EASY",
  tag: "", timeEstimate: "", questions: [emptyQuestion(0)],
};

// ─── Shared field components ────────────────────────────────────────────────

function FieldLabel({ children, required }) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 5 }}>
      {children}
      {required && <span style={{ color: "#dc2626", marginLeft: 2 }}>*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, style = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", padding: "8px 11px", fontSize: 14,
        border: `1.5px solid ${focused ? "#7c3aed" : "#e5e7eb"}`,
        borderRadius: 8, outline: "none", boxSizing: "border-box",
        transition: "border-color 0.15s", background: "white", ...style,
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, mono = false }) {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  const autoResize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  // Chạy mỗi khi value thay đổi
  useEffect(() => { autoResize(); }, [value]);

  // Chạy sau khi modal render xong (edit mode có data sẵn)
  useEffect(() => { requestAnimationFrame(autoResize); }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", padding: "8px 11px", fontSize: mono ? 13 : 14,
        fontFamily: mono ? "'Fira Code','Consolas',monospace" : "inherit",
        border: `1.5px solid ${focused ? "#7c3aed" : "#e5e7eb"}`,
        borderRadius: 8, outline: "none",
        resize: "none",
        overflow: "hidden",
        boxSizing: "border-box", lineHeight: 1.6,
        background: mono ? "#fafafa" : "white",
        transition: "border-color 0.15s",
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 11px", fontSize: 14,
        border: "1.5px solid #e5e7eb", borderRadius: 8,
        outline: "none", background: "white", cursor: "pointer",
        boxSizing: "border-box",
      }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function DifficultyPicker({ value, onChange }) {
  const isMobileSmall = useIsMobile(480);
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {DIFFICULTIES.map((d) => (
        <button
          key={d.value}
          onClick={() => onChange(d.value)}
          style={{
            flex: 1,
            minHeight: 40, // touch target tối thiểu (RESPONSIVE.md §8)
            padding: isMobileSmall ? "7px 4px" : "7px 0",
            border: `1.5px solid ${value === d.value ? d.color : "#e5e7eb"}`,
            borderRadius: 8,
            fontSize: isMobileSmall ? 12 : 13,
            fontWeight: value === d.value ? 600 : 400,
            color: value === d.value ? d.color : "#6b7280",
            background: value === d.value ? d.bg : "white",
            cursor: "pointer", transition: "all 0.15s",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {isMobileSmall && d.value === "MEDIUM" ? "TB" : d.label}
        </button>
      ))}
    </div>
  );
}

function CommonFields({ form, setForm }) {
  const isMobile = useIsMobile(768); // < 767px collapse grid (RESPONSIVE.md §2)
  return (
    <>
      {/* Tag + TimeEstimate: 2 cột trên desktop, 1 cột trên mobile */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <div>
          <FieldLabel required>Thẻ / Chủ đề</FieldLabel>
          <Input value={form.tag} onChange={(v) => setForm((f) => ({ ...f, tag: v }))} placeholder="VD: OOP, Spring Boot" />
        </div>
        <div>
          <FieldLabel>Thời gian dự kiến</FieldLabel>
          <Input value={form.timeEstimate} onChange={(v) => setForm((f) => ({ ...f, timeEstimate: v }))} placeholder="VD: 15 phút" />
        </div>
      </div>
      <div>
        <FieldLabel>Mô tả</FieldLabel>
        <Textarea value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Mô tả ngắn về bài tập..." rows={2} />
      </div>
      <div>
        <FieldLabel required>Độ khó</FieldLabel>
        <DifficultyPicker value={form.difficulty} onChange={(v) => setForm((f) => ({ ...f, difficulty: v }))} />
      </div>
    </>
  );
}

// ─── CODE Form ──────────────────────────────────────────────────────────────

function CodeExerciseForm({ form, setForm }) {
  const isMobile = useIsMobile(768);

  const handleLanguageChange = (lang) => {
    setForm((f) => ({ ...f, language: lang, fileName: FILE_NAME_MAP[lang] || f.fileName }));
  };

  const updateReq = (i, val) => setForm((f) => {
    const reqs = [...f.requirements];
    reqs[i] = val;
    return { ...f, requirements: reqs };
  });

  const addReq = () => setForm((f) => ({ ...f, requirements: [...f.requirements, ""] }));

  const removeReq = (i) => setForm((f) => ({
    ...f, requirements: f.requirements.filter((_, idx) => idx !== i),
  }));

  // ── Test cases CRUD ────────────────────────────────────────────────────────
  const testCases = form.testCases ?? [{ input: "", expectedOutput: "" }];

  const updateTC = (i, field, val) => setForm((f) => {
    const tcs = [...(f.testCases ?? [])];
    tcs[i] = { ...tcs[i], [field]: val };
    return { ...f, testCases: tcs };
  });

  const addTC = () => setForm((f) => ({
    ...f, testCases: [...(f.testCases ?? []), { input: "", expectedOutput: "" }],
  }));

  const removeTC = (i) => setForm((f) => ({
    ...f, testCases: (f.testCases ?? []).filter((_, idx) => idx !== i),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <FieldLabel required>Tên bài tập</FieldLabel>
        <Input value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="VD: Viết hàm tính tổng mảng số nguyên" />
      </div>

      <CommonFields form={form} setForm={setForm} />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <div>
          <FieldLabel required>Ngôn ngữ lập trình</FieldLabel>
          <Select value={form.language} onChange={handleLanguageChange} options={LANGUAGES} />
        </div>
        <div>
          <FieldLabel>Tên file mã nguồn</FieldLabel>
          <Input value={form.fileName} onChange={(v) => setForm((f) => ({ ...f, fileName: v }))} placeholder="Main.java" />
        </div>
      </div>

      <div>
        <FieldLabel>Mã nguồn khởi đầu</FieldLabel>
        <Textarea
          value={form.starterCode}
          onChange={(v) => setForm((f) => ({ ...f, starterCode: v }))}
          placeholder={`// Mã nguồn khởi đầu hiển thị khi học viên mở bài tập\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}`}
          rows={6}
          mono
        />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <FieldLabel>Yêu cầu đạt được</FieldLabel>
          <button
            onClick={addReq}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
              fontSize: 12, fontWeight: 500, color: "#7c3aed",
              background: "#f5f3ff", border: "1px solid #ede9fe",
              borderRadius: 6, cursor: "pointer",
            }}
          >
            <Plus size={13} /> Thêm yêu cầu
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {form.requirements.map((req, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#9ca3af", minWidth: 20, textAlign: "right" }}>{i + 1}.</span>
              <Input
                value={req}
                onChange={(v) => updateReq(i, v)}
                placeholder={`Yêu cầu ${i + 1}: ví dụ: Hàm phải xử lý được trường hợp mảng rỗng`}
              />
              {form.requirements.length > 1 && (
                <button
                  onClick={() => removeReq(i)}
                  style={{ padding: 6, border: "none", background: "none", cursor: "pointer", color: "#ef4444", borderRadius: 6 }}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Grading Type Selection (Standard vs Unit Test) ── */}
      <div>
        <FieldLabel required>Hình thức chấm điểm</FieldLabel>
        <div style={{ display: "flex", gap: 24, alignItems: "center", marginTop: 4, marginBottom: 4 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", fontWeight: (form.codeType || "STANDARD") === "STANDARD" ? 600 : 400, color: "#374151" }}>
            <input
              type="radio"
              name="codeType"
              checked={(form.codeType || "STANDARD") === "STANDARD"}
              onChange={() => setForm((f) => ({ ...f, codeType: "STANDARD" }))}
              style={{ accentColor: "#7c3aed", width: 16, height: 16, cursor: "pointer" }}
            />
            Chương trình tiêu chuẩn (stdin/stdout)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", fontWeight: (form.codeType || "STANDARD") === "UNIT_TEST" ? 600 : 400, color: "#374151" }}>
            <input
              type="radio"
              name="codeType"
              checked={(form.codeType || "STANDARD") === "UNIT_TEST"}
              onChange={() => setForm((f) => ({ ...f, codeType: "UNIT_TEST" }))}
              style={{ accentColor: "#7c3aed", width: 16, height: 16, cursor: "pointer" }}
            />
            Kiểm thử đơn vị (Unit Test)
          </label>
        </div>
      </div>

      {/* ── Nếu STANDARD ── */}
      {(form.codeType || "STANDARD") === "STANDARD" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <FieldLabel>Các bộ test (Test Cases)</FieldLabel>
            <p style={{ margin: "-2px 0 0", fontSize: 12, color: "#9ca3af" }}>
              Hệ thống chạy thử mã nguồn với mỗi đầu vào (stdin) và đối chiếu kết quả in ra (stdout) sau khi đã cắt khoảng trắng dư.
            </p>
          </div>
          <button
            onClick={addTC}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
              fontSize: 12, fontWeight: 500, color: "#7c3aed",
              background: "#f5f3ff", border: "1px solid #ede9fe",
              borderRadius: 6, cursor: "pointer", flexShrink: 0, marginTop: 2,
            }}
          >
            <Plus size={13} /> Thêm bộ test
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {testCases.map((tc, i) => (
            <div
              key={i}
              style={{
                border: "1.5px solid #e5e7eb", borderRadius: 10,
                padding: "10px 12px", background: "#fafafa",
                display: "flex", flexDirection: "column", gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: "#7c3aed",
                  background: "#f5f3ff", border: "1px solid #ede9fe",
                  padding: "2px 8px", borderRadius: 4,
                }}>
                  Bộ test {i + 1}
                </span>
                {testCases.length > 1 && (
                  <button
                    onClick={() => removeTC(i)}
                    style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: "#ef4444", borderRadius: 4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", display: "block", marginBottom: 4 }}>
                    Đầu vào <span style={{ color: "#9ca3af", fontWeight: 400 }}>(stdin)</span>
                  </label>
                  <textarea
                    value={tc.input}
                    onChange={(e) => updateTC(i, "input", e.target.value)}
                    placeholder="VD: 3 5"
                    rows={2}
                    style={{
                      width: "100%", padding: "7px 10px", fontSize: 13,
                      fontFamily: "'Fira Code','Consolas',monospace",
                      border: "1.5px solid #e5e7eb", borderRadius: 7,
                      outline: "none", resize: "vertical",
                      boxSizing: "border-box", background: "white", lineHeight: 1.6,
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", display: "block", marginBottom: 4 }}>
                    Kết quả mong đợi <span style={{ color: "#9ca3af", fontWeight: 400 }}>(stdout sau trim)</span>
                  </label>
                  <textarea
                    value={tc.expectedOutput}
                    onChange={(e) => updateTC(i, "expectedOutput", e.target.value)}
                    placeholder="VD: 8"
                    rows={2}
                    style={{
                      width: "100%", padding: "7px 10px", fontSize: 13,
                      fontFamily: "'Fira Code','Consolas',monospace",
                      border: "1.5px solid #e5e7eb", borderRadius: 7,
                      outline: "none", resize: "vertical",
                      boxSizing: "border-box", background: "white", lineHeight: 1.6,
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* ── Nếu UNIT_TEST ── */}
      {(form.codeType || "STANDARD") === "UNIT_TEST" && (
        <div>
          <FieldLabel required>Mã nguồn kiểm thử (Giảng viên soạn thảo, học viên không thể thấy)</FieldLabel>
          <Textarea
            value={form.testCode || ""}
            onChange={(v) => setForm((f) => ({ ...f, testCode: v }))}
            placeholder="// Soạn thảo mã nguồn kiểm thử tại đây..."
            rows={10}
            mono
          />
        </div>
      )}
    </div>
  );
}

// ─── QUIZ Form ──────────────────────────────────────────────────────────────

function QuizQuestionCard({ q, index, total, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(true);
  const isMobileSmall = useIsMobile(480); // options grid: 1 cột trên < 480px

  return (
    <div style={{
      border: "1.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden",
      background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      {/* Card header */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", background: "#fafafa", cursor: "pointer",
          borderBottom: expanded ? "1px solid #e5e7eb" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 24, height: 24, borderRadius: "50%", background: "#7c3aed",
            color: "white", fontSize: 12, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {index + 1}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
            {q.questionText ? q.questionText.slice(0, 60) + (q.questionText.length > 60 ? "..." : "") : `Câu hỏi ${index + 1}`}
          </span>
          {q.correctAnswer && (
            <span style={{
              fontSize: 11, padding: "2px 7px", borderRadius: 4,
              background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontWeight: 600,
            }}>
              Đáp án: {q.correctAnswer}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {total > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              style={{ padding: 5, border: "none", background: "none", cursor: "pointer", color: "#ef4444", borderRadius: 6 }}
            >
              <Trash2 size={14} />
            </button>
          )}
          <span style={{ fontSize: 12, color: "#9ca3af", padding: "4px 2px" }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Card body */}
      {expanded && (
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <FieldLabel required>Câu hỏi</FieldLabel>
            <Textarea
              value={q.questionText}
              onChange={(v) => onChange({ ...q, questionText: v })}
              placeholder="Nhập nội dung câu hỏi..."
              rows={2}
            />
          </div>

          {/* Options grid */}
          <div>
            <FieldLabel required>Các phương án lựa chọn</FieldLabel>
            <div style={{ display: "grid", gridTemplateColumns: isMobileSmall ? "1fr" : "1fr 1fr", gap: 8 }}>
              {ANSWER_OPTIONS.map((letter) => {
                const field = `option${letter}`;
                const isCorrect = q.correctAnswer === letter;
                return (
                  <div
                    key={letter}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px",
                      border: `1.5px solid ${isCorrect ? "#7c3aed" : "#e5e7eb"}`,
                      borderRadius: 8,
                      background: isCorrect ? "#faf5ff" : "white",
                      transition: "all 0.15s",
                    }}
                  >
                    <button
                      onClick={() => onChange({ ...q, correctAnswer: letter })}
                      title="Đặt làm đáp án đúng"
                      style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${isCorrect ? "#7c3aed" : "#d1d5db"}`,
                        background: isCorrect ? "#7c3aed" : "white",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {isCorrect && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "white", display: "block" }} />}
                    </button>
                    <span style={{ fontSize: 12, fontWeight: 600, color: isCorrect ? "#7c3aed" : "#6b7280", minWidth: 14 }}>{letter}</span>
                    <input
                      value={q[field] || ""}
                      onChange={(e) => onChange({ ...q, [field]: e.target.value })}
                      placeholder={`Phương án ${letter}`}
                      style={{
                        flex: 1, border: "none", outline: "none", fontSize: 13,
                        background: "transparent", color: "#374151",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <FieldLabel>Giải thích (hiển thị sau khi học viên nộp bài)</FieldLabel>
            <Textarea
              value={q.explanation}
              onChange={(v) => onChange({ ...q, explanation: v })}
              placeholder="Giải thích chi tiết tại sao đây là đáp án đúng..."
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function QuizExerciseForm({ form, setForm }) {
  const updateQuestion = (i, updated) => setForm((f) => {
    const questions = [...f.questions];
    questions[i] = updated;
    return { ...f, questions };
  });

  const addQuestion = () => setForm((f) => ({
    ...f, questions: [...f.questions, emptyQuestion(f.questions.length)],
  }));

  const removeQuestion = (i) => setForm((f) => ({
    ...f,
    questions: f.questions.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, orderIndex: idx })),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <FieldLabel required>Tên bài tập</FieldLabel>
        <Input value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="VD: Kiểm tra kiến thức OOP cơ bản" />
      </div>

      <CommonFields form={form} setForm={setForm} />

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>Danh sách câu hỏi</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>({form.questions.length} câu hỏi)</span>
          </div>
          <button
            onClick={addQuestion}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
              fontSize: 13, fontWeight: 500, color: "#7c3aed",
              background: "#f5f3ff", border: "1.5px solid #ede9fe",
              borderRadius: 8, cursor: "pointer",
            }}
          >
            <Plus size={14} /> Thêm câu hỏi
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {form.questions.map((q, i) => (
            <QuizQuestionCard
              key={i}
              q={q}
              index={i}
              total={form.questions.length}
              onChange={(updated) => updateQuestion(i, updated)}
              onRemove={() => removeQuestion(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Type selector ──────────────────────────────────────────────────

function TypeSelector({ onSelect }) {
  const isMobile = useIsMobile(768);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "24px 0 8px" }}>
      <p style={{ fontSize: 15, color: "#4b5563", textAlign: "center", margin: 0 }}>
        Chọn loại bài tập bạn muốn tạo
      </p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, width: "100%" }}>
        {[
          {
            type: "CODE",
            icon: <Code2 size={32} color="#7c3aed" />,
            label: "Bài tập lập trình",
            desc: "Học viên viết code, hệ thống tự động chấm điểm và phản hồi theo từng yêu cầu.",
            accent: "#7c3aed",
            bg: "#faf5ff",
            border: "#ede9fe",
          },
          {
            type: "QUIZ",
            icon: <ListChecks size={32} color="#0891b2" />,
            label: "Bài trắc nghiệm",
            desc: "Các câu hỏi trắc nghiệm khách quan, giải thích kết quả chi tiết sau khi nộp bài.",
            accent: "#0891b2",
            bg: "#f0f9ff",
            border: "#bae6fd",
          },
        ].map(({ type, icon, label, desc, accent, bg, border }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            style={{
              padding: "24px 20px", border: `2px solid ${border}`, borderRadius: 14,
              background: bg, cursor: "pointer", textAlign: "left",
              transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 12,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}18`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{desc}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 500, color: accent }}>
              Chọn loại này <span>→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

/**
 * ExerciseFormModal
 *
 * Props:
 *   isOpen       {boolean}
 *   onClose      {() => void}
 *   lessonId     {number}
 *   exercise     {object|null}  — null = tạo mới, object = chỉnh sửa
 *   onSubmit     {(payload: ExerciseRequest) => Promise<void>}
 */
export default function ExerciseFormModal({ isOpen, onClose, lessonId, exercise = null, onSubmit, prefillTitle = '' }) {
  const isMobile = useIsMobile(768);      // < 767px
  const isMobileSmall = useIsMobile(480); // < 479px
  const isEdit = !!exercise;

  // Step: "SELECT_TYPE" | "FILL_FORM"
  const [step, setStep] = useState(isEdit ? "FILL_FORM" : "SELECT_TYPE");
  const [exerciseType, setExerciseType] = useState(exercise?.type || null);
  const [codeForm, setCodeForm] = useState(initialCodeForm);
  const [quizForm, setQuizForm] = useState(initialQuizForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form khi edit
  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && exercise) {
      setStep("FILL_FORM");
      setExerciseType(exercise.type);
      if (exercise.type === "CODE") {
        setCodeForm({
          title: exercise.title || "",
          description: exercise.description || "",
          difficulty: exercise.difficulty || "EASY",
          tag: exercise.tag || "",
          timeEstimate: exercise.timeEstimate || exercise.time || "",
          language: exercise.language || "java",
          starterCode: exercise.starterCode || "",
          fileName: exercise.fileName || "Main.java",
          requirements: exercise.requirements?.length ? exercise.requirements : [""],
          codeType: exercise.codeType || "STANDARD",
          testCode: exercise.testCode || "",
          testCases: exercise.testCases?.length
            ? exercise.testCases
            : [{ input: "", expectedOutput: "" }],
        });
      } else {
        setQuizForm({
          title: exercise.title || "",
          description: exercise.description || "",
          difficulty: exercise.difficulty || "EASY",
          tag: exercise.tag || "",
          timeEstimate: exercise.timeEstimate || exercise.time || "",
          // FIX: dùng teacherQuestions (có correctAnswer + explanation)
          // Fallback về questions nếu backend chưa update
          questions: (exercise.teacherQuestions ?? exercise.questions ?? []).length
            ? (exercise.teacherQuestions ?? exercise.questions).map((q) => ({
                ...q,
                questionText:  q.questionText  ?? "",
                optionA:       q.optionA       ?? "",
                optionB:       q.optionB       ?? "",
                optionC:       q.optionC       ?? "",
                optionD:       q.optionD       ?? "",
                explanation:   q.explanation   ?? "",
                correctAnswer: q.correctAnswer ?? q.correct_answer ?? "A",
              }))
            : [emptyQuestion(0)],
        });
      }
    } else {
      setStep("SELECT_TYPE");
      setExerciseType(null);
      setCodeForm({ ...initialCodeForm, title: prefillTitle });
      setQuizForm({ ...initialQuizForm, title: prefillTitle });
      setError("");
    }
  }, [isOpen, exercise]);

  const handleSelectType = (type) => {
    setExerciseType(type);
    setStep("FILL_FORM");
  };

  const handleBack = () => {
    setStep("SELECT_TYPE");
    setExerciseType(null);
    setError("");
  };

  const validate = () => {
    const form = exerciseType === "CODE" ? codeForm : quizForm;
    if (!form.title.trim()) return "Vui lòng nhập tên bài tập.";
    if (exerciseType === "CODE" && !form.language) return "Vui lòng chọn ngôn ngữ lập trình.";
    if (exerciseType === "QUIZ") {
      for (let i = 0; i < form.questions.length; i++) {
        const q = form.questions[i];
        if (!q.questionText.trim()) return `Câu hỏi ${i + 1}: vui lòng nhập nội dung câu hỏi.`;
        if (!q.optionA.trim() || !q.optionB.trim()) return `Câu hỏi ${i + 1}: cần ít nhất 2 lựa chọn (A và B).`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    const form = exerciseType === "CODE" ? codeForm : quizForm;

    const payload = {
      lessonId,
      type: exerciseType,
      title: form.title.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      tag: form.tag.trim(),
      timeEstimate: form.timeEstimate.trim(),
      maxScore: 100,
      ...(exerciseType === "CODE"
        ? {
          language: form.language,
          starterCode: form.starterCode,
          fileName: form.fileName,
          requirements: form.requirements.filter((r) => r.trim()),
          codeType: form.codeType || "STANDARD",
          testCode: form.codeType === "UNIT_TEST" ? form.testCode : undefined,
          testCases: form.codeType === "STANDARD"
            ? (form.testCases ?? []).filter((tc) => tc.expectedOutput.trim())
            : [],
        }
        : {
          questions: form.questions.map((q, i) => ({ ...q, orderIndex: i })),
        }),
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const typeLabel = exerciseType === "CODE" ? "Bài tập lập trình" : "Trắc nghiệm";
  const typeColor = exerciseType === "CODE" ? "#7c3aed" : "#0891b2";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center",
        // Mobile: không padding → modal chiếm toàn màn hình chiều ngang
        // Mobile: sheet từ bottom; Desktop: centered modal
        padding: isMobile ? 0 : 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "white",
          // Mobile: full width, bo góc trên; Desktop: rounded card
          borderRadius: isMobile ? "16px 16px 0 0" : 16,
          width: "100%",
          maxWidth: isMobile ? "100%" : 680,
          // Mobile: tối đa 92vh (còn lại thấy backdrop); Desktop: 90vh
          maxHeight: isMobile ? "92vh" : "90vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: isMobile ? "14px 16px" : "18px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
          {step === "FILL_FORM" && !isEdit && (
            <button
              onClick={handleBack}
              style={{ minWidth: 40, minHeight: 40, padding: 6, border: "none", background: "#f3f4f6", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ChevronLeft size={16} color="#374151" />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>
              {isEdit ? "Chỉnh sửa bài tập" : step === "SELECT_TYPE" ? "Thêm bài tập" : "Tạo bài tập"}
            </h2>
            {step === "FILL_FORM" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                  background: exerciseType === "CODE" ? "#f5f3ff" : "#f0f9ff",
                  color: typeColor,
                  border: `1px solid ${exerciseType === "CODE" ? "#ede9fe" : "#bae6fd"}`,
                }}>
                  {typeLabel}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ minWidth: 40, minHeight: 40, padding: 6, border: "none", background: "#f3f4f6", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={16} color="#374151" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 14px" : "20px 24px" }}>
          {step === "SELECT_TYPE" && <TypeSelector onSelect={handleSelectType} />}
          {step === "FILL_FORM" && exerciseType === "CODE" && (
            <CodeExerciseForm form={codeForm} setForm={setCodeForm} />
          )}
          {step === "FILL_FORM" && exerciseType === "QUIZ" && (
            <QuizExerciseForm form={quizForm} setForm={setQuizForm} />
          )}
        </div>

        {/* Footer */}
        {step === "FILL_FORM" && (
          <div style={{
            padding: isMobile ? "12px 14px" : "14px 24px",
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            // Mobile-sm: lỗi error trên, buttons dưới; tablet+: ngang hàng
            flexDirection: isMobileSmall ? "column" : "row",
            alignItems: isMobileSmall ? "stretch" : "center",
            justifyContent: "space-between",
            gap: 10,
          }}>
            <div style={{ flex: isMobileSmall ? "unset" : 1 }}>
              {error && (
                <p style={{ margin: 0, fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 4 }}>
                  ⚠ {error}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: isMobileSmall ? "stretch" : "flex-end" }}>
              <button
                onClick={onClose}
                style={{
                  flex: isMobileSmall ? 1 : "unset",
                  minHeight: 40, // touch target (RESPONSIVE.md §8)
                  padding: "9px 18px", border: "1.5px solid #e5e7eb", borderRadius: 9,
                  fontSize: 14, fontWeight: 500, color: "#374151", background: "white", cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  flex: isMobileSmall ? 1 : "unset",
                  minHeight: 40, // touch target
                  padding: "9px 22px", border: "none", borderRadius: 9,
                  fontSize: 14, fontWeight: 600, color: "white",
                  background: loading ? "#a78bfa" : "#7c3aed",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {loading ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo bài tập"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}