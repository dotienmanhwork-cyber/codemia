// features/learning/components/NotesPane.jsx
import { useState } from "react";

export default function NotesPane({ summaryItems = [], lessonTitle = "" }) {
  const [activeTab, setActiveTab] = useState("summary"); // "summary" | "notes"
  const [userNote, setUserNote] = useState("");
  const [savedNotes, setSavedNotes] = useState([]);

  const handleSaveNote = () => {
    if (!userNote.trim()) return;
    setSavedNotes((prev) => [
      { id: Date.now(), text: userNote.trim(), createdAt: new Date().toLocaleTimeString("vi-VN") },
      ...prev,
    ]);
    setUserNote("");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {[
          { id: "summary", label: "AI Tóm tắt" },
          { id: "notes", label: "Ghi chú của tôi" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab.id ? "text-purple-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* AI Summary Tab */}
      {activeTab === "summary" && (
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #6366F1, #A855F7)" }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Nội dung chính bài học</p>
                {lessonTitle && (
                  <p className="text-xs text-gray-400 truncate max-w-[180px]">{lessonTitle}</p>
                )}
              </div>
            </div>

            <span
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: "#F3DAFF", color: "#7C3AED" }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI
            </span>
          </div>

          {/* Summary items */}
          {summaryItems.length > 0 ? (
            <div className="space-y-3">
              {summaryItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <button
                    className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-md transition-colors mt-0.5"
                    style={{ background: "#F3DAFF", color: "#7C3AED" }}
                    title="Nhảy đến thời điểm này"
                  >
                    [{item.time}]
                  </button>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-semibold text-gray-900">{item.label}</span>{" "}
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "#F3DAFF" }}
              >
                <svg className="w-6 h-6" style={{ color: "#8C06D8" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">AI đang tóm tắt bài học...</p>
            </div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === "notes" && (
        <div className="p-5 flex flex-col gap-4">
          {/* Note input */}
          <div className="flex flex-col gap-2">
            <textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Ghi chú của bạn về bài này..."
              rows={3}
              className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-purple-400 resize-none bg-gray-50 placeholder-gray-400"
            />
            <button
              onClick={handleSaveNote}
              disabled={!userNote.trim()}
              className="self-end px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#8C06D8" }}
            >
              Lưu ghi chú
            </button>
          </div>

          {/* Saved notes */}
          {savedNotes.length > 0 ? (
            <div className="space-y-2">
              {savedNotes.map((note) => (
                <div key={note.id} className="bg-purple-50 rounded-lg p-3">
                  <p className="text-sm text-gray-800 leading-relaxed">{note.text}</p>
                  <p className="text-xs text-gray-400 mt-1">{note.createdAt}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400 py-4">Chưa có ghi chú nào.</p>
          )}
        </div>
      )}
    </div>
  );
}