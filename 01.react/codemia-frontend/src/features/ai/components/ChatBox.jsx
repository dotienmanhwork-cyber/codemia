// features/ai/components/ChatBox.jsx
// Used in: features/learning/pages/LearningPage.jsx
import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api/ai.api";

export const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    text: "Xin chào! Tôi là trợ lý AI của Codemia. Hãy hỏi tôi bất kỳ điều gì về bài học này nhé 🚀",
  },
];

function Message({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "linear-gradient(135deg, #6366F1, #A855F7)" }}
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
      )}

      <div
        className={`max-w-[80%] px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
          isUser
            ? "bg-gray-100 text-gray-700 rounded-tr-sm"
            : "bg-purple-50 text-purple-900 rounded-tl-sm"
        }`}
        dangerouslySetInnerHTML={{
          __html: msg.text.replace(
            /`([^`]+)`/g,
            '<code class="bg-purple-100 text-purple-800 px-1 py-0.5 rounded font-mono text-xs">$1</code>'
          ),
        }}
      />
    </div>
  );
}

export default function ChatBox({
  lessonContext = "",
  lessonId = null,
  currentVideoTime = 0,
  isQuizMode = false,
  messages = INITIAL_MESSAGES,
  onMessagesChange,
}) {
  const setMessages = (updater) => {
    onMessagesChange?.((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  };
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await sendChatMessage({
        message: text,
        lessonId,
        timestampSeconds: Math.floor(currentVideoTime),
        quizMode: isQuizMode,
      });
      // axios interceptor đã unwrap response.data → res = { code, result }
      const reply = res.result?.reply ?? res.data?.result?.reply ?? "Không có phản hồi từ AI.";
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "assistant", text: reply },
      ]);
    } catch (err) {
      setError("AI tạm thời không khả dụng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const QUICK_QUESTIONS = [
    "Giải thích khái niệm này?",
    "Ví dụ thực tế?",
    "Lỗi thường gặp?",
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6366F1, #A855F7)" }}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="bg-purple-50 rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="text-xs text-red-400 text-center py-2">{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div className="px-3 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => setInput(q)}
            className="text-xs px-2.5 py-1 rounded-full border transition-colors hover:bg-purple-50"
            style={{ borderColor: "#E2B6FF", color: "#7C3AED" }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi về bài học này..."
          disabled={isLoading}
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-purple-400 bg-gray-50 disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
          style={{ background: "#8C06D8" }}
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}