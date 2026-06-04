// features/learning/components/CodeEditor.jsx
// FIX 1: Syntax highlighting overlay (textarea + pre behind)
// FIX 2: Line number color #4B5563 → #64748B (higher contrast)
// FIX 3: Editor empty space — minHeight trên wrapper

import { useRef } from "react";

const LANGUAGE_COLORS = {
  java:       { icon: "☕", iconColor: "#F89820" },
  python:     { icon: "🐍", iconColor: "#3572A5" },
  javascript: { icon: "JS", iconColor: "#F7DF1E" },
  typescript: { icon: "TS", iconColor: "#3178C6" },
  cpp:        { icon: "C++", iconColor: "#659AD2" },
  c:          { icon: "C",  iconColor: "#555555" },
  go:         { icon: "Go", iconColor: "#00ADD8" },
  rust:       { icon: "Rs", iconColor: "#CE422B" },
};

const scrollbarCSS = `
  .editor-scroll {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }
  .editor-scroll:hover {
    scrollbar-color: rgba(139, 92, 246, 0.4) transparent;
  }
  .editor-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
  .editor-scroll::-webkit-scrollbar-track { background: transparent; }
  .editor-scroll::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 99px;
  }
  .editor-scroll:hover::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.4); }
  .editor-scroll:hover::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.7); }
`;

// ─── Keyword sets per language ────────────────────────────────────────────────
const KEYWORDS = {
  java: new Set([
    'abstract','assert','boolean','break','byte','case','catch','char','class',
    'const','continue','default','do','double','else','enum','extends','final',
    'finally','float','for','goto','if','implements','import','instanceof','int',
    'interface','long','native','new','package','private','protected','public',
    'return','short','static','strictfp','super','switch','synchronized','this',
    'throw','throws','transient','try','void','volatile','while','null','true','false','var',
  ]),
  javascript: new Set([
    'async','await','break','case','catch','class','const','continue','debugger',
    'default','delete','do','else','export','extends','false','finally','for','from',
    'function','if','import','in','instanceof','let','new','null','of','return',
    'static','super','switch','this','throw','true','try','typeof','undefined',
    'var','void','while','with','yield',
  ]),
  typescript: new Set([
    'async','await','break','case','catch','class','const','continue','debugger',
    'default','delete','do','else','enum','export','extends','false','finally','for',
    'from','function','if','implements','import','in','instanceof','interface','let',
    'new','null','of','private','protected','public','readonly','return','static',
    'super','switch','this','throw','true','try','type','typeof','undefined',
    'var','void','while','with','yield',
  ]),
  python: new Set([
    'False','None','True','and','as','assert','async','await','break','class',
    'continue','def','del','elif','else','except','finally','for','from','global',
    'if','import','in','is','lambda','nonlocal','not','or','pass','raise','return',
    'try','while','with','yield','print',
  ]),
};

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(code, language) {
  if (!code) return '';
  const lang = (language ?? 'java').toLowerCase();
  const kws  = KEYWORDS[lang] ?? KEYWORDS.java;
  const isPy = lang === 'python';
  let out = ''; let i = 0; const n = code.length;

  while (i < n) {
    const c = code[i];

    // Line comment (//)
    if (!isPy && c === '/' && code[i + 1] === '/') {
      const end = code.indexOf('\n', i);
      const s   = end < 0 ? code.slice(i) : code.slice(i, end);
      out += `<span style="color:#546E7A;font-style:italic">${esc(s)}</span>`;
      i += s.length; continue;
    }
    // Block comment (/* */)
    if (!isPy && c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      const s   = end < 0 ? code.slice(i) : code.slice(i, end + 2);
      out += `<span style="color:#546E7A;font-style:italic">${esc(s)}</span>`;
      i += s.length; continue;
    }
    // Python comment (#)
    if (isPy && c === '#') {
      const end = code.indexOf('\n', i);
      const s   = end < 0 ? code.slice(i) : code.slice(i, end);
      out += `<span style="color:#546E7A;font-style:italic">${esc(s)}</span>`;
      i += s.length; continue;
    }
    // Double-quote string
    if (c === '"') {
      let j = i + 1;
      while (j < n && code[j] !== '"' && code[j] !== '\n') { if (code[j] === '\\') j++; j++; }
      if (j < n && code[j] === '"') j++;
      out += `<span style="color:#C3E88D">${esc(code.slice(i, j))}</span>`;
      i = j; continue;
    }
    // Single-quote string / char
    if (c === "'") {
      let j = i + 1;
      while (j < n && code[j] !== "'" && code[j] !== '\n') { if (code[j] === '\\') j++; j++; }
      if (j < n && code[j] === "'") j++;
      out += `<span style="color:#C3E88D">${esc(code.slice(i, j))}</span>`;
      i = j; continue;
    }
    // Number
    if (/[0-9]/.test(c) && (i === 0 || /\W/.test(code[i - 1]))) {
      let j = i;
      while (j < n && /[0-9a-fA-FxXbBlL._]/.test(code[j])) j++;
      out += `<span style="color:#F78C6C">${esc(code.slice(i, j))}</span>`;
      i = j; continue;
    }
    // Annotation (@Something)
    if (c === '@' && i + 1 < n && /[A-Za-z]/.test(code[i + 1])) {
      let j = i + 1;
      while (j < n && /[a-zA-Z0-9_]/.test(code[j])) j++;
      out += `<span style="color:#F78C6C;font-style:italic">${esc(code.slice(i, j))}</span>`;
      i = j; continue;
    }
    // Identifier / keyword / ClassName / method()
    if (/[a-zA-Z_$]/.test(c)) {
      let j = i;
      while (j < n && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (kws.has(word))                    out += `<span style="color:#C792EA;font-weight:600">${esc(word)}</span>`;
      else if (/^[A-Z]/.test(word))         out += `<span style="color:#FFCB6B">${esc(word)}</span>`;
      else if (j < n && code[j] === '(')    out += `<span style="color:#82AAFF">${esc(word)}</span>`;
      else                                  out += `<span style="color:#EEFFFF">${esc(word)}</span>`;
      i = j; continue;
    }
    // Operators
    if (/[+\-*/%=<>!&|^~?:]/.test(c)) {
      out += `<span style="color:#89DDFF">${esc(c)}</span>`; i++; continue;
    }
    // Brackets / braces
    if (/[{}()\[\]]/.test(c)) {
      out += `<span style="color:#FFCB6B">${esc(c)}</span>`; i++; continue;
    }
    out += esc(c); i++;
  }
  return out;
}

// ─── Shared style constants ───────────────────────────────────────────────────
const FONT    = "'JetBrains Mono','Fira Code',Consolas,monospace";
const FSIZE   = '12.5px';
const LHEIGHT = '24px';
const PAD     = '16px';

export default function CodeEditor({
  code = "",
  onChange,
  fileName = "Main.java",
  language = "java",
  readOnly = false,
  highlightLine = null,
  onReset,
}) {
  const lines      = code.split('\n');
  const langKey    = (language ?? 'java').toLowerCase();
  const langMeta   = LANGUAGE_COLORS[langKey] ?? { icon: '</>', iconColor: '#9CA3AF' };
  const textareaRef = useRef(null);
  const preRef      = useRef(null);
  const lineNumRef  = useRef(null);

  // Sync scroll: textarea → pre overlay + line numbers
  const onScroll = (e) => {
    const { scrollTop, scrollLeft } = e.target;
    if (preRef.current)     { preRef.current.scrollTop = scrollTop; preRef.current.scrollLeft = scrollLeft; }
    if (lineNumRef.current) { lineNumRef.current.scrollTop = scrollTop; }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target, start = el.selectionStart, end = el.selectionEnd, TAB = '  ';
      if (e.shiftKey) {
        const lineStart = code.lastIndexOf('\n', start - 1) + 1;
        const lineText  = code.slice(lineStart, end);
        if (lineText.startsWith(TAB)) {
          onChange?.(code.slice(0, lineStart) + lineText.slice(TAB.length));
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = Math.max(lineStart, start - TAB.length);
          });
        }
      } else if (start === end) {
        onChange?.(code.slice(0, start) + TAB + code.slice(end));
        requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + TAB.length; });
      } else {
        const before = code.slice(0, start), selected = code.slice(start, end), after = code.slice(end);
        const indented = selected.replace(/^/gm, TAB);
        onChange?.(before + indented + after);
        requestAnimationFrame(() => { el.selectionStart = start; el.selectionEnd = end + (indented.length - selected.length); });
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const start     = e.target.selectionStart;
      const lineStart = code.lastIndexOf('\n', start - 1) + 1;
      const lineText  = code.slice(lineStart, start);
      const indent    = lineText.match(/^(\s*)/)[1];
      const extra     = lineText.trimEnd().endsWith('{') ? '  ' : '';
      const insert    = '\n' + indent + extra;
      onChange?.(code.slice(0, start) + insert + code.slice(start));
      requestAnimationFrame(() => { const pos = start + insert.length; e.target.selectionStart = e.target.selectionEnd = pos; });
    }
  };

  const highlighted = highlight(code, language);

  // Shared CSS for both pre (highlight layer) and textarea (input layer)
  const sharedStyle = {
    position: 'absolute', inset: 0, margin: 0,
    padding: PAD,
    fontFamily: FONT, fontSize: FSIZE, lineHeight: LHEIGHT,
    whiteSpace: 'pre', wordWrap: 'normal', tabSize: 2, boxSizing: 'border-box',
  };

  return (
    <div className="h-full overflow-hidden flex flex-col" style={{ background: '#0D1117', fontFamily: FONT }}>
      <style>{scrollbarCSS}</style>

      {/* ── Tab bar ── */}
      <div
        className="flex items-center border-b border-gray-700/60 px-2 flex-shrink-0"
        style={{ background: '#161B22' }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 border-t-2 border-purple-500"
          style={{ background: '#0D1117', fontSize: FSIZE, color: '#CDD9E5' }}
        >
          <span style={{ color: langMeta.iconColor, fontFamily: 'sans-serif', fontSize: '11px' }}>
            {langMeta.icon}
          </span>
          {fileName}
        </div>
        <div className="flex-1" />
        {/* Font size hint */}
        <span
          className="text-gray-600 select-none mr-2 flex-shrink-0"
          style={{ fontSize: '11px', fontFamily: 'sans-serif' }}
          title="Font size"
        >
          12.5px
        </span>
        <button
          onClick={onReset}
          className="p-2 rounded text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          title="Reset về code gốc"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {/* ── Editor row ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* FIX: Line numbers — color nâng lên #64748B để dễ đọc hơn */}
        <div
          ref={lineNumRef}
          className="select-none flex-shrink-0 overflow-hidden"
          style={{
            paddingTop: PAD, paddingBottom: PAD, paddingLeft: '12px', paddingRight: '12px',
            borderRight: '1px solid #21262D', background: '#0D1117',
            minWidth: '52px', textAlign: 'right',
          }}
        >
          {lines.map((_, i) => (
            <div
              key={i}
              style={{
                fontSize: FSIZE, lineHeight: LHEIGHT, fontFamily: FONT,
                // FIX: #4B5563 → #64748B (contrast cao hơn, vẫn subtle)
                color: highlightLine === i + 1 ? '#F87171' : '#64748B',
                background: highlightLine === i + 1 ? 'rgba(248,113,113,0.08)' : 'transparent',
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* ── Code area (overlay pattern) ── */}
        <div className="flex-1 relative overflow-hidden" style={{ background: '#0D1117' }}>
          {/* Error line highlight strip */}
          {highlightLine && (
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: `calc(${PAD} + ${(highlightLine - 1) * 24}px)`,
                height: LHEIGHT,
                background: 'rgba(248,113,113,0.10)',
                borderLeft: '2px solid rgba(248,113,113,0.6)',
                zIndex: 0,
              }}
            />
          )}

          {/* FIX: Syntax highlight layer (pre, behind textarea) */}
          <pre
            ref={preRef}
            aria-hidden="true"
            style={{
              ...sharedStyle,
              overflow: 'hidden',
              color: '#EEFFFF',
              background: 'transparent',
              pointerEvents: 'none',
              zIndex: 1,
            }}
            dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
          />

          {/* Input layer (transparent text, visible caret) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={onScroll}
            readOnly={readOnly}
            spellCheck={false}
            autoComplete="off" autoCorrect="off" autoCapitalize="off"
            className="editor-scroll"
            style={{
              ...sharedStyle,
              overflow: 'auto',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              caretColor: '#A78BFA',
              resize: 'none',
              outline: 'none',
              border: 'none',
              background: 'transparent',
              zIndex: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
}