// src/features/teacher/components/CurriculumEditor.jsx
import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import FormModal from '../../../shared/components/dashboard-ui/FormModal';
import ConfirmModal from '../../../shared/components/dashboard-ui/ConfirmModal';
import ExerciseFormModal from './ExerciseFormModal';

/* ─── CodemiaEditor (React 19 Custom WYSIWYG) ─── */
const btnStyle = {
  width: 28, height: 28,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: 'none', background: 'transparent',
  borderRadius: 4, cursor: 'pointer',
  color: 'var(--ink-2)', fontSize: 13, fontWeight: 600,
  transition: 'background 0.12s, color 0.12s',
};

const dividerStyle = {
  width: 1, height: 20,
  background: 'var(--border)',
  margin: '4px 2px',
};

function CodemiaEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    handleInput();
  };

  return (
    <div style={{
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      background: 'var(--surface)',
      fontFamily: 'inherit',
      marginTop: 4,
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        padding: '6px 10px',
        background: 'var(--border-faint)',
        borderBottom: '0.5px solid var(--border)',
        alignItems: 'center',
      }}>
        <button type="button" onClick={() => executeCommand('bold')} title="In đậm" className="codemia-editor-btn" style={btnStyle}>
          <i className="ti ti-bold" style={{ fontSize: 14 }} />
        </button>
        <button type="button" onClick={() => executeCommand('italic')} title="In nghiêng" className="codemia-editor-btn" style={btnStyle}>
          <i className="ti ti-italic" style={{ fontSize: 14 }} />
        </button>
        <button type="button" onClick={() => executeCommand('underline')} title="Gạch chân" className="codemia-editor-btn" style={btnStyle}>
          <i className="ti ti-underline" style={{ fontSize: 14 }} />
        </button>
        <button type="button" onClick={() => executeCommand('strikeThrough')} title="Gạch ngang" className="codemia-editor-btn" style={btnStyle}>
          <i className="ti ti-strikethrough" style={{ fontSize: 14 }} />
        </button>
        
        <div style={dividerStyle} />
        
        <button type="button" onClick={() => executeCommand('formatBlock', '<h2>')} title="Đề mục lớn" className="codemia-editor-btn" style={{ ...btnStyle, fontSize: 11, fontWeight: 700 }}>
          H2
        </button>
        <button type="button" onClick={() => executeCommand('formatBlock', '<h3>')} title="Đề mục nhỏ" className="codemia-editor-btn" style={{ ...btnStyle, fontSize: 10, fontWeight: 700 }}>
          H3
        </button>
        <button type="button" onClick={() => executeCommand('formatBlock', '<p>')} title="Đoạn văn" className="codemia-editor-btn" style={{ ...btnStyle, fontSize: 11, fontWeight: 700 }}>
          P
        </button>
        <button type="button" onClick={() => executeCommand('formatBlock', '<blockquote>')} title="Trích dẫn" className="codemia-editor-btn" style={btnStyle}>
          <i className="ti ti-quote" style={{ fontSize: 14 }} />
        </button>
        <button type="button" onClick={() => executeCommand('formatBlock', '<pre>')} title="Khối mã nguồn" className="codemia-editor-btn" style={btnStyle}>
          <i className="ti ti-code" style={{ fontSize: 14 }} />
        </button>
        
        <div style={dividerStyle} />
        
        <button type="button" onClick={() => executeCommand('insertUnorderedList')} title="Danh sách chấm tròn" className="codemia-editor-btn" style={btnStyle}>
          <i className="ti ti-list" style={{ fontSize: 14 }} />
        </button>
        <button type="button" onClick={() => executeCommand('insertOrderedList')} title="Danh sách đánh số" className="codemia-editor-btn" style={btnStyle}>
          <i className="ti ti-list-numbers" style={{ fontSize: 14 }} />
        </button>
      </div>

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="codemia-prose"
        style={{
          minHeight: '260px',
          maxHeight: '450px',
          padding: '16px 20px',
          outline: 'none',
          overflowY: 'auto',
          fontSize: '14.5px',
          lineHeight: '1.75',
          color: 'var(--ink)',
          background: 'var(--surface)',
        }}
      />
    </div>
  );
}
import {
  getExerciseByLesson,
  createExercise,
  updateExercise,
  reorderLessons,
  reorderSections,
} from '../api/teacher.api';

/* ─── Shared styles ──────────────────────────── */
const inputStyle = {
  width: '100%', height: 36,
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '0 12px',
  fontSize: 13, color: 'var(--ink)',
  background: 'var(--bg)',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const focusHandlers = {
  onFocus: (e) => {
    e.currentTarget.style.borderColor = 'var(--purple)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(140,6,216,0.08)';
  },
  onBlur: (e) => {
    e.currentTarget.style.borderColor = 'var(--border)';
    e.currentTarget.style.boxShadow = 'none';
  },
};

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-[5px]">
    <label className="text-[12px] font-semibold text-[var(--ink-2)]">
      {label}{required && <span className="text-[var(--red)] ml-[2px]">*</span>}
    </label>
    {children}
  </div>
);

/* ─── Small icon button ──────────────────────── */
function IconBtn({ icon, onClick, title, color = 'var(--ink-3)', hoverBg = 'var(--border-faint)' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 text-sm max-[767px]:w-9 max-[767px]:h-9 max-[767px]:text-base border-none bg-transparent rounded-md cursor-pointer flex items-center justify-center transition-all duration-120 hover:bg-[var(--border-faint)]"
      style={{
        color,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = color === 'var(--ink-3)' ? 'var(--ink)' : color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = color;
      }}
    >
      <i className={`ti ti-${icon}`} />
    </button>
  );
}

/* ─── Lesson type toggle ─────────────────────── */
const LESSON_TYPES = [
  { key: 'VIDEO', label: 'Video', icon: 'player-play' },
  { key: 'TEXT', label: 'Văn bản', icon: 'file-text' },
  { key: 'EXERCISE', label: 'Bài tập', icon: 'code' },
];

function TypeToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {LESSON_TYPES.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              flex: 1, padding: '7px 0',
              borderRadius: 'var(--radius-sm)',
              border: `0.5px solid ${active ? 'var(--purple)' : 'var(--border)'}`,
              background: active ? 'var(--purple-light)' : 'var(--surface)',
              color: active ? 'var(--purple-dim)' : 'var(--ink-2)',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.12s',
            }}
          >
            <i className={`ti ti-${t.icon}`} style={{ fontSize: 13 }} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Badge CODE/QUIZ ────────────────────────── */
function ExerciseTypeBadge({ exerciseType }) {
  if (!exerciseType) return null;
  const isCode = exerciseType === 'CODE';
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 6px',
      borderRadius: 4,
      background: isCode ? 'var(--purple-light)' : '#e0f2fe',
      color: isCode ? 'var(--purple-dim)' : '#0369a1',
      border: `0.5px solid ${isCode ? 'var(--purple)' : '#7dd3fc'}`,
      flexShrink: 0,
    }}>
      {isCode ? 'CODE' : 'QUIZ'}
    </span>
  );
}

/* ─── LessonRow (Sortable) ───────────────────── */
const TYPE_ICON  = { VIDEO: 'player-play', TEXT: 'file-text', EXERCISE: 'code' };
const TYPE_COLOR = { VIDEO: 'var(--blue)', TEXT: 'var(--ink-3)', EXERCISE: 'var(--purple-dim)' };

function SortableLessonRow({ lesson, lessonIndex, onEdit, onDelete, onEditExercise, disabled, actionsDisabled }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: lesson.id });

  const isExercise = lesson.type === 'EXERCISE';

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 'auto',
      }}
    >
      <div
        className="flex items-center p-[8px_16px_8px_36px] max-[767px]:pl-6 max-[479px]:pl-4 gap-2 border-b border-[var(--border-faint)] transition-colors duration-100 hover:bg-[#fafafa]"
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        {/* Drag handle — chỉ hiện khi không disabled */}
        {!disabled ? (
          <span
            {...attributes}
            {...listeners}
            title="Kéo để sắp xếp"
            style={{
              cursor: 'grab', color: 'var(--ink-3)',
              fontSize: 14, flexShrink: 0,
              display: 'flex', alignItems: 'center',
              touchAction: 'none',
            }}
          >
            <i className="ti ti-grip-vertical" />
          </span>
        ) : (
          <span style={{ width: 14, flexShrink: 0 }} />
        )}

        {/* Type icon */}
        <i
          className={`ti ti-${TYPE_ICON[lesson.type] ?? 'file'}`}
          style={{ fontSize: 13, color: TYPE_COLOR[lesson.type] ?? 'var(--ink-3)', flexShrink: 0 }}
        />

        {/* Số thứ tự tự động theo vị trí trong mảng */}
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: 'var(--ink-3)',
          background: 'var(--bg)',
          border: '0.5px solid var(--border)',
          borderRadius: 4,
          padding: '1px 6px',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          Bài học {lessonIndex + 1}
        </span>

        {/* Title thuần — không cần gõ số nữa */}
        <span className="flex-1 text-[13px] text-[var(--ink)] overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{lesson.title}</span>

        {/* Badge CODE/QUIZ */}
        {isExercise && <ExerciseTypeBadge exerciseType={lesson.exerciseType} />}

        {/* Duration — lấy từ API tự động (giây), format MM:SS */}
        {lesson.duration > 0 && (
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
            {String(Math.floor(lesson.duration / 60)).padStart(2, '0')}:
            {String(lesson.duration % 60).padStart(2, '0')}
          </span>
        )}

        {/* Actions */}
        {!actionsDisabled && (
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            {isExercise && (
              <button
                onClick={() => onEditExercise(lesson)}
                title="Chỉnh sửa bài tập"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', height: 26,
                  fontSize: 11.5, fontWeight: 600,
                  color: 'var(--purple-dim)',
                  background: 'var(--purple-light)',
                  border: '0.5px solid var(--purple)',
                  borderRadius: 6, cursor: 'pointer',
                  fontFamily: 'inherit', flexShrink: 0,
                  transition: 'all 0.12s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.75'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <i className="ti ti-code" style={{ fontSize: 12 }} />
                Bài tập
              </button>
            )}
            <IconBtn icon="pencil" onClick={() => onEdit(lesson)} title="Chỉnh sửa bài học" />
            <IconBtn icon="trash" onClick={() => onDelete(lesson)} title="Xóa bài học" color="var(--red)" hoverBg="var(--red-bg)" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── InsertButton — nút + xuất hiện khi hover giữa 2 bài ── */
function InsertButton({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        height: hovered ? 28 : 6,
        display: 'flex', alignItems: 'center',
        paddingLeft: 44,
        transition: 'height 0.15s',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <button
          onClick={onClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11.5, fontWeight: 600,
            color: 'var(--purple-dim)',
            background: 'var(--purple-light)',
            border: '0.5px solid var(--purple)',
            borderRadius: 6, cursor: 'pointer',
            padding: '2px 8px', height: 22,
            fontFamily: 'inherit',
            transition: 'opacity 0.12s',
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 11 }} />
          Chèn bài học ở đây
        </button>
      )}
    </div>
  );
}

/* ─── SectionBlock (Sortable) ────────────────── */
function SortableSectionBlock({
  section, index,
  onEditSection, onDeleteSection,
  onAddLesson, onEditLesson, onDeleteLesson,
  onEditExercise, onReorder,
  disabled, actionsDisabled,
}) {
  const [open, setOpen] = useState(true);

  // ── Sortable cho section ──
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: section.id });

  // ── DnD sensors cho lesson bên trong ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const lessons = section.lessons ?? [];

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = lessons.findIndex((l) => l.id === active.id);
    const newIdx = lessons.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(lessons, oldIdx, newIdx);

    onReorder(section.id, reordered);
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 20 : 'auto',
        borderBottom: '0.5px solid var(--border-faint)',
      }}
    >
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '10px 16px',
        background: isDragging ? 'var(--border-faint)' : 'var(--bg)',
        gap: 8,
        transition: 'background 0.12s',
      }}>

        {/* Drag handle — chỉ hiện khi không disabled */}
        {!disabled ? (
          <span
            {...attributes}
            {...listeners}
            title="Kéo để sắp xếp chương"
            style={{
              cursor: 'grab', color: 'var(--ink-3)',
              fontSize: 14, flexShrink: 0,
              display: 'flex', alignItems: 'center',
              touchAction: 'none',
            }}
          >
            <i className="ti ti-grip-vertical" />
          </span>
        ) : (
          <span style={{ width: 14, flexShrink: 0 }} />
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 20, height: 20, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-3)', fontSize: 13, padding: 0,
            transition: 'transform 0.15s',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <i className="ti ti-chevron-right" />
        </button>

        <span style={{
          width: 20, height: 20, borderRadius: 4, flexShrink: 0,
          background: 'var(--purple-light)', color: 'var(--purple-dim)',
          fontSize: 10.5, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {index + 1}
        </span>

        <span className="flex-1 text-[13px] font-bold text-[var(--ink)] overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{section.title}</span>
        <span className="text-[11.5px] text-[var(--ink-3)] whitespace-nowrap shrink-0 max-[479px]:hidden">{lessons.length} bài học</span>

        {!actionsDisabled && (
          <div className="flex gap-[2px] shrink-0">
            <IconBtn icon="pencil" onClick={() => onEditSection(section)} title="Chỉnh sửa tên chương" />
            <IconBtn icon="trash" onClick={() => onDeleteSection(section)} title="Xóa chương" color="var(--red)" hoverBg="var(--red-bg)" />
          </div>
        )}
      </div>

      {/* Lessons list với DnD */}
      {open && (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={lessons.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {lessons.map((lesson, lessonIdx) => (
                <div key={lesson.id}>
                  {lessonIdx === 0 && !actionsDisabled && (
                    <InsertButton onClick={() => onAddLesson(section, 0)} />
                  )}

                  <SortableLessonRow
                    lesson={lesson}
                    lessonIndex={lessonIdx}
                    onEdit={onEditLesson}
                    onDelete={onDeleteLesson}
                    onEditExercise={onEditExercise}
                    disabled={disabled}
                    actionsDisabled={actionsDisabled}
                  />

                  {!actionsDisabled && (
                    <InsertButton onClick={() => onAddLesson(section, lessonIdx + 1)} />
                  )}
                </div>
              ))}
            </SortableContext>
          </DndContext>

          {!actionsDisabled && (
            <div style={{ padding: '6px 16px 6px 36px' }}>
              <button
                onClick={() => onAddLesson(section, lessons.length)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, color: 'var(--purple-dim)',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                  padding: '4px 0', transition: 'opacity 0.12s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <i className="ti ti-plus" style={{ fontSize: 13 }} />
                Thêm bài học
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   CurriculumEditor
   Props (mới thêm):
     onReorderLessons - (sectionId, [{id, orderIndex}]) => Promise<void>
══════════════════════════════════════════════ */
export default function CurriculumEditor({
  sections = [],
  disabled = false,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderLessons,
  onReorderSections,  // ← prop mới
  onSaveOrderSuccess, // ← prop mới
}) {
  const [localSections, setLocalSections]   = useState(sections);
  const [isDirty, setIsDirty]               = useState(false);
  const [saveLoading, setSaveLoading]       = useState(false);

  const [sectionModal, setSectionModal]     = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionTitle, setSectionTitle]     = useState('');
  const [sectionSaving, setSectionSaving]   = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setLocalSections(sections);
    }
  }, [sections, isDirty]);

  const [exercisePrefillTitle, setExercisePrefillTitle] = useState('');
  const [lessonModal, setLessonModal]       = useState(false);
  const [editingLesson, setEditingLesson]   = useState(null);
  const [targetSection, setTargetSection]   = useState(null);
  // insertAtIndex: vị trí chèn (0 = đầu, length = cuối)
  const [insertAtIndex, setInsertAtIndex]   = useState(null);
  const [lessonDraft, setLessonDraft]       = useState({ title: '', type: 'VIDEO', videoUrl: '', duration: '' });
  const [lessonSaving, setLessonSaving]     = useState(false);

  const [exerciseModal, setExerciseModal]   = useState(false);
  const [exerciseLesson, setExerciseLesson] = useState(null);
  const [exerciseData, setExerciseData]     = useState(null);
  const [exerciseLoading, setExerciseLoading] = useState(false);

  const [confirmSection, setConfirmSection] = useState(null);
  const [confirmLesson, setConfirmLesson]   = useState(null);

  // Sensors dùng cho DnD sections ở tầng ngoài
  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Track section đang được kéo — dùng cho DragOverlay
  const [activeSectionId, setActiveSectionId] = useState(null);
  const activeSection = sections.find((s) => s.id === activeSectionId) ?? null;

  /* ── Section handlers ── */
  function openAddSection() {
    setEditingSection(null);
    setSectionTitle('');
    setSectionModal(true);
  }

  function openEditSection(section) {
    setEditingSection(section);
    setSectionTitle(section.title);
    setSectionModal(true);
  }

  async function handleSaveSection() {
    if (!sectionTitle.trim()) return;
    setSectionSaving(true);
    try {
      if (editingSection) {
        await onEditSection(editingSection, sectionTitle.trim());
      } else {
        await onAddSection(sectionTitle.trim());
      }
      setSectionModal(false);
    } finally {
      setSectionSaving(false);
    }
  }

  /* ── Lesson handlers ── */
  // insertAt: số nguyên = vị trí chèn, null = chưa xác định (thêm cuối)
  function openAddLesson(section, insertAt = null) {
    setTargetSection(section);
    setInsertAtIndex(insertAt);
    setEditingLesson(null);
    setLessonDraft({ title: '', type: 'VIDEO', videoUrl: '', content: '' });
    setLessonModal(true);
  }

  function openEditLesson(lesson) {
    setEditingLesson(lesson);
    setLessonDraft({
      title: lesson.title,
      type: lesson.type,
      videoUrl: lesson.videoUrl ?? '',
      content: lesson.content ?? '',
    });
    setLessonModal(true);
  }

  async function handleSaveLesson() {
    if (!lessonDraft.title.trim()) return;
    setLessonSaving(true);
    try {
      const data = {
        title: lessonDraft.title.trim(),
        type: lessonDraft.type,
        videoUrl: lessonDraft.type === 'VIDEO' ? (lessonDraft.videoUrl || undefined) : undefined,
        content: lessonDraft.type === 'TEXT' ? lessonDraft.content : undefined,
        // duration không gửi lên — BE tự lấy từ YouTube/Vimeo
        orderIndex: insertAtIndex ?? (targetSection?.lessons?.length ?? 0),
      };

      if (editingLesson) {
        await onEditLesson(editingLesson, data);
        setLessonModal(false);
      } else {
        const newLesson = await onAddLesson(targetSection, data);
        setLessonModal(false);
        if (data.type === 'EXERCISE' && newLesson?.id) {
          openEditExercise(newLesson, data.title);
          return;
        }
      }
    } finally {
      setLessonSaving(false);
    }
  }

  /* ── Reorder handler — gọi từ SectionBlock khi drag end ── */
  function handleReorder(sectionId, reorderedLessons) {
    setLocalSections((prev) => {
      const next = prev.map((s) =>
        s.id === sectionId ? { ...s, lessons: reorderedLessons } : s
      );
      setIsDirty(true);
      return next;
    });
  }

  /* ── Section reorder handler — kéo thả đổi thứ tự chương ── */
  function handleSectionDragStart(event) {
    setActiveSectionId(event.active.id);
  }

  function handleSectionDragEnd(event) {
    setActiveSectionId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = localSections.findIndex((s) => s.id === active.id);
    const newIdx = localSections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(localSections, oldIdx, newIdx);

    setLocalSections(reordered);
    setIsDirty(true);
  }

  function handleCancelOrder() {
    setLocalSections(sections);
    setIsDirty(false);
  }

  async function handleSaveOrder() {
    setSaveLoading(true);
    try {
      // 1. Lưu thứ tự các chương (sections)
      const sectionPayload = localSections.map((s, idx) => ({ id: s.id, orderIndex: idx }));
      await reorderSections(sectionPayload);

      // 2. Lưu thứ tự các bài học (lessons) của từng chương (chỉ những chương có thay đổi bài học)
      const reorderPromises = [];
      for (const localSec of localSections) {
        const originalSec = sections.find((s) => s.id === localSec.id);
        if (originalSec) {
          const localLessonIds = (localSec.lessons ?? []).map((l) => l.id);
          const originalLessonIds = (originalSec.lessons ?? []).map((l) => l.id);
          if (JSON.stringify(localLessonIds) !== JSON.stringify(originalLessonIds)) {
            const lessonPayload = (localSec.lessons ?? []).map((l, idx) => ({ id: l.id, orderIndex: idx }));
            reorderPromises.push(reorderLessons(lessonPayload));
          }
        }
      }

      if (reorderPromises.length > 0) {
        await Promise.all(reorderPromises);
      }

      setIsDirty(false);
      onReorderSections?.(localSections);
      if (onSaveOrderSuccess) {
        await onSaveOrderSuccess();
      }
    } catch (err) {
      console.error('Save order failed:', err);
    } finally {
      setSaveLoading(false);
    }
  }

  /* ── Exercise handlers ── */
  async function openEditExercise(lesson, prefillTitle = '') {
    setExerciseLesson(lesson);
    setExercisePrefillTitle(prefillTitle);
    setExerciseData(null);
    setExerciseModal(true);
    setExerciseLoading(true);
    try {
      const res = await getExerciseByLesson(lesson.id);
      setExerciseData(res.result ?? res);
    } catch {
      setExerciseData(null);
    } finally {
      setExerciseLoading(false);
    }
  }

  async function handleSubmitExercise(payload) {
    if (exerciseData?.id) {
      await updateExercise(exerciseData.id, payload);
    } else {
      await createExercise(exerciseLesson.id, payload);
    }
  }

  const totalLessons = localSections.reduce((s, sec) => s + (sec.lessons?.length ?? 0), 0);
  const isActionsDisabled = disabled || isDirty;

  return (
    <>
      {/* Banner lưu thay đổi thứ tự */}
      {isDirty && (
        <div style={{
          background: 'var(--purple-light, #f3e8ff)',
          border: '0.5px solid var(--purple, #a855f7)',
          borderRadius: 'var(--radius, 12px)',
          padding: '12px 18px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          boxShadow: '0 2px 10px rgba(168, 85, 247, 0.08)',
          animation: 'tce-toast-in 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="ti ti-info-circle" style={{ fontSize: 18, color: 'var(--purple-dim, #7e22ce)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink, #1f2937)' }}>
                Có thay đổi thứ tự chưa lưu!
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-2, #4b5563)' }}>
                Bạn đã thay đổi vị trí các chương hoặc bài học. Các tính năng Thêm/Sửa/Xóa tạm khóa để đảm bảo an toàn.
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleCancelOrder}
              disabled={saveLoading}
              style={{
                padding: '6px 14px',
                border: '0.5px solid var(--border, #e5e7eb)',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'var(--surface, #ffffff)',
                color: 'var(--ink-2, #4b5563)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: saveLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.12s',
                opacity: saveLoading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { if (!saveLoading) e.currentTarget.style.background = 'var(--border-faint, #f9fafb)'; }}
              onMouseLeave={(e) => { if (!saveLoading) e.currentTarget.style.background = 'var(--surface, #ffffff)'; }}
            >
              Hủy thay đổi
            </button>
            <button
              onClick={handleSaveOrder}
              disabled={saveLoading}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'var(--purple, #a855f7)',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: saveLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'opacity 0.12s',
                opacity: saveLoading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { if (!saveLoading) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { if (!saveLoading) e.currentTarget.style.opacity = '1'; }}
            >
              {saveLoading ? (
                <>
                  <i className="ti ti-loader-2" style={{ fontSize: 13, animation: 'spin 0.8s linear infinite' }} />
                  Đang lưu...
                </>
              ) : (
                <>
                  <i className="ti ti-device-floppy" style={{ fontSize: 13 }} />
                  Lưu thứ tự
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-[13px_16px] border-b border-[var(--border)] gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <i className="ti ti-layout-list" style={{ fontSize: 14, color: 'var(--ink-3)', flexShrink: 0 }} />
            <span className="text-[13.5px] font-semibold text-[var(--ink)] whitespace-nowrap">Chương trình học</span>
            <span className="text-xs text-[var(--ink-3)] whitespace-nowrap overflow-hidden text-ellipsis max-[1023px]:hidden">— {localSections.length} chương · {totalLessons} bài học</span>
          </div>

          {!isActionsDisabled && (
            <button
              onClick={openAddSection}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 600,
                padding: '6px 12px',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                color: 'var(--ink-2)',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-faint)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
            >
              <i className="ti ti-plus" style={{ fontSize: 13 }} />
              Thêm chương
            </button>
          )}
        </div>

        {localSections.length === 0 && (
          <div style={{
            padding: '40px 16px', textAlign: 'center',
            color: 'var(--ink-3)', fontSize: 13,
          }}>
            <i className="ti ti-layout-list" style={{ fontSize: 28, display: 'block', marginBottom: 8, opacity: 0.4 }} />
            Chưa có chương nào.{!isActionsDisabled && ' Click "Thêm chương" để bắt đầu.'}
          </div>
        )}

        <DndContext
          sensors={sectionSensors}
          collisionDetection={closestCenter}
          onDragStart={handleSectionDragStart}
          onDragEnd={handleSectionDragEnd}
        >
          <SortableContext
            items={localSections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {localSections.map((section, i) => (
              <SortableSectionBlock
                key={section.id}
                section={section}
                index={i}
                disabled={disabled}
                actionsDisabled={isActionsDisabled}
                onEditSection={openEditSection}
                onDeleteSection={setConfirmSection}
                onAddLesson={openAddLesson}
                onEditLesson={openEditLesson}
                onDeleteLesson={setConfirmLesson}
                onEditExercise={openEditExercise}
                onReorder={handleReorder}
              />
            ))}
          </SortableContext>

          {/* Overlay gọn — chỉ hiện header, không render lessons bên trong */}
          <DragOverlay dropAnimation={null}>
            {activeSection ? (
              <div style={{
                display: 'flex', alignItems: 'center',
                padding: '10px 16px',
                background: 'var(--bg)',
                border: '1.5px solid var(--purple)',
                borderRadius: 'var(--radius-sm)',
                gap: 8,
                boxShadow: '0 4px 16px rgba(140,6,216,0.12)',
                cursor: 'grabbing',
              }}>
                <span style={{ color: 'var(--ink-3)', fontSize: 14, display: 'flex' }}>
                  <i className="ti ti-grip-vertical" />
                </span>
                <span style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: 'var(--purple-light)', color: 'var(--purple-dim)',
                  fontSize: 10.5, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {localSections.findIndex((s) => s.id === activeSection.id) + 1}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                  {activeSection.title}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)', marginLeft: 2 }}>
                  {activeSection.lessons?.length ?? 0} bài học
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ── Section Modal ── */}
      <FormModal
        open={sectionModal}
        onClose={() => setSectionModal(false)}
        title={editingSection ? 'Chỉnh sửa chương' : 'Chương mới'}
        onSubmit={handleSaveSection}
        submitLabel={sectionSaving ? 'Đang lưu…' : (editingSection ? 'Lưu thay đổi' : 'Thêm chương')}
        width={440}
      >
        <Field label="Tên chương" required>
          <input
            style={inputStyle}
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="Ví dụ: Chương 1: Giới thiệu"
            autoFocus
            {...focusHandlers}
          />
        </Field>
      </FormModal>

      {/* ── Lesson Modal ── */}
      <FormModal
        open={lessonModal}
        onClose={() => setLessonModal(false)}
        title={editingLesson ? 'Chỉnh sửa bài học' : (insertAtIndex !== null && insertAtIndex < (targetSection?.lessons?.length ?? 0) ? `Chèn bài học tại vị trí ${insertAtIndex + 1}` : 'Thêm bài học')}
        onSubmit={handleSaveLesson}
        submitLabel={lessonSaving ? 'Đang lưu…' : (editingLesson ? 'Lưu thay đổi' : 'Thêm bài học')}
        width={lessonDraft.type === 'TEXT' ? 760 : 480}
      >
        <Field label="Tên bài học" required>
          <input
            style={inputStyle}
            value={lessonDraft.title}
            onChange={(e) => setLessonDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Ví dụ: Bài 1: Thiết lập môi trường"
            autoFocus
            {...focusHandlers}
          />
        </Field>

        <Field label="Loại bài học">
          <TypeToggle
            value={lessonDraft.type}
            onChange={(v) => setLessonDraft((d) => ({ ...d, type: v }))}
          />
        </Field>

        {lessonDraft.type === 'VIDEO' && (
          <>
            <Field label="URL Video">
              <input
                style={inputStyle}
                value={lessonDraft.videoUrl}
                onChange={(e) => setLessonDraft((d) => ({ ...d, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/watch?v=... hoặc https://vimeo.com/..."
                {...focusHandlers}
              />
            </Field>
            {/* Detect platform từ URL — YouTube và Vimeo đều được hỗ trợ */}
            {lessonDraft.videoUrl && (() => {
              const url = lessonDraft.videoUrl
              const isYT    = /youtube\.com|youtu\.be/.test(url)
              const isVimeo = /vimeo\.com/.test(url)
              if (!isYT && !isVimeo) return (
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 12 }} />
                  URL không hợp lệ — chỉ hỗ trợ YouTube và Vimeo
                </p>
              )
              return (
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className={`ti ${isVimeo ? 'ti-brand-vimeo' : 'ti-brand-youtube'}`} style={{ fontSize: 12 }} />
                  {isVimeo ? 'Vimeo' : 'YouTube'} — thời lượng tự động lấy sau khi lưu
                </p>
              )
            })()}
          </>
        )}

        {lessonDraft.type === 'TEXT' && (
          <Field label="Nội dung bài học" required>
            <CodemiaEditor
              value={lessonDraft.content || ''}
              onChange={(val) => setLessonDraft((d) => ({ ...d, content: val }))}
              placeholder="Nhập nội dung bài học bằng văn bản phong phú ở đây..."
            />
          </Field>
        )}
      </FormModal>

      {/* ── Exercise Modal ── */}
      {exerciseModal && (
        exerciseLoading ? (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: 'var(--surface)', borderRadius: 12,
              padding: '24px 32px', fontSize: 13, color: 'var(--ink-2)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <i className="ti ti-loader-2" style={{ fontSize: 18, color: 'var(--purple-dim)', animation: 'spin 0.8s linear infinite' }} />
              Đang tải bài tập…
            </div>
          </div>
        ) : (
          <ExerciseFormModal
            isOpen={exerciseModal}
            onClose={() => setExerciseModal(false)}
            lessonId={exerciseLesson?.id}
            exercise={exerciseData}
            prefillTitle={exercisePrefillTitle}
            onSubmit={handleSubmitExercise}
          />
        )
      )}

      {/* ── Confirm delete section ── */}
      {confirmSection && (
        <ConfirmModal
          open
          onClose={() => setConfirmSection(null)}
          onConfirm={async () => {
            await onDeleteSection(confirmSection);
            setConfirmSection(null);
          }}
          title={`Xóa chương "${confirmSection.title}"?`}
          description="Tất cả bài học trong chương này cũng sẽ bị xóa vĩnh viễn khỏi khóa học."
          confirmLabel="Xóa chương"
          danger
        />
      )}

      {/* ── Confirm delete lesson ── */}
      {confirmLesson && (
        <ConfirmModal
          open
          onClose={() => setConfirmLesson(null)}
          onConfirm={async () => {
            await onDeleteLesson(confirmLesson);
            setConfirmLesson(null);
          }}
          title={`Xóa bài học "${confirmLesson.title}"?`}
          description="Bài học này sẽ bị xóa vĩnh viễn khỏi khóa học."
          confirmLabel="Xóa bài học"
          danger
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}