"use client";

import { motion, useDragControls } from "framer-motion";
import {
  Download,
  GripHorizontal,
  Plus,
  RotateCcw,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Note {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  rotation: number;
}

const COLORS = [
  "bg-yellow-200",
  "bg-green-200",
  "bg-pink-200",
  "bg-blue-200",
  "bg-purple-200",
];

const STORAGE_KEY = "random-webs:sticky-notes:v1";
const DEFAULT_NOTES: Note[] = [
  {
    id: 1,
    text: "Drag me around!",
    x: 100,
    y: 100,
    color: "bg-yellow-200",
    rotation: -2,
  },
  {
    id: 2,
    text: "Double-click the background to create a new note.",
    x: 400,
    y: 250,
    color: "bg-green-200",
    rotation: 1.5,
  },
];

const getNoteSize = () => (window.innerWidth < 768 ? 192 : 256);

const clampNotePosition = (x: number, y: number, size: number) => ({
  x: Math.max(16, Math.min(x, window.innerWidth - size - 16)),
  y: Math.max(16, Math.min(y, window.innerHeight - size - 16)),
});

export default function StickyNotes() {
  const constraintsRef = useRef(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [hasLoadedNotes, setHasLoadedNotes] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showIds, setShowIds] = useState(false);

  useEffect(() => {
    const savedNotes = window.localStorage.getItem(STORAGE_KEY);

    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes) as Note[];
        if (Array.isArray(parsedNotes)) {
          setNotes(parsedNotes);
        } else {
          setNotes(DEFAULT_NOTES);
        }
      } catch {
        setNotes(DEFAULT_NOTES);
      }
    } else {
      setNotes(DEFAULT_NOTES);
    }

    setHasLoadedNotes(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedNotes) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [hasLoadedNotes, notes]);

  const addNote = (x?: number, y?: number) => {
    const noteSize = getNoteSize();
    const isMobile = noteSize < 256;
    const defaultX = isMobile
      ? window.innerWidth / 2 - noteSize / 2 + (Math.random() * 50 - 25)
      : Math.random() * (window.innerWidth - noteSize - 48);
    const defaultY = isMobile
      ? window.innerHeight / 2 - noteSize / 2 + (Math.random() * 50 - 25)
      : Math.random() * (window.innerHeight - noteSize - 48);

    const targetX = typeof x === "number" ? x : defaultX;
    const targetY = typeof y === "number" ? y : defaultY;
    const position = clampNotePosition(targetX, targetY, noteSize);

    setNotes((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "",
        x: position.x,
        y: position.y,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 10 - 5,
      },
    ]);
  };

  const updateNoteText = (id: number, text: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  };

  const updateNotePosition = (id: number, x: number, y: number) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

  const deleteNote = (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (confirmDeleteId === id) setConfirmDeleteId(null);
  };

  const resetNotes = () => {
    setNotes(DEFAULT_NOTES);
    setConfirmDeleteId(null);
  };

  const exportNotesToMarkdown = () => {
    const markdown = notes
      .map((note, index) => {
        const title =
          note.text.trim().split(/\r?\n/)[0] || `Untitled note ${index + 1}`;
        return [
          `## ${title}`,
          "",
          note.text.trim() || "_Blank note_",
          "",
          `- Position: ${Math.round(note.x)}, ${Math.round(note.y)}`,
          `- Color: ${note.color.replace("bg-", "")}`,
        ].join("\n");
      })
      .join("\n\n");
    const blob = new Blob([`# Sticky Notes\n\n${markdown}\n`], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sticky-notes.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="min-h-screen bg-[#dccbb4] relative overflow-hidden select-none"
      ref={constraintsRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && e.detail > 1) {
          e.preventDefault();
        }
      }}
      onDoubleClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          const rect = e.currentTarget.getBoundingClientRect();
          const noteSize = getNoteSize();
          const x = Math.max(
            16,
            Math.min(
              e.clientX - rect.left - noteSize / 2,
              rect.width - noteSize - 16,
            ),
          );
          const y = Math.max(
            16,
            Math.min(
              e.clientY - rect.top - noteSize / 2,
              rect.height - noteSize - 16,
            ),
          );
          addNote(x, y);
        }
      }}
    >
      {/* Background Texture */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <button
        onClick={() => addNote()}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-slate-800 p-4 text-white shadow-xl transition-colors hover:bg-slate-700 md:bottom-8 md:right-8"
        title="Add note"
      >
        <Plus className="h-7 w-7 md:h-8 md:w-8" />
      </button>

      <button
        onClick={() => setIsSettingsOpen((open) => !open)}
        className="fixed right-6 top-6 z-50 rounded-full bg-white/85 p-3 text-slate-800 shadow-lg backdrop-blur transition-colors hover:bg-white"
        title="Settings"
      >
        <Settings className="h-6 w-6" />
      </button>

      {isSettingsOpen && (
        <div className="fixed right-6 top-20 z-50 w-[min(20rem,calc(100vw-3rem))] rounded-lg bg-white/95 p-4 text-slate-900 shadow-2xl backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-sm font-bold uppercase tracking-wide text-slate-600">
              Settings
            </h2>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title="Close settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <label className="mb-4 flex items-center justify-between gap-4 font-sans text-sm">
            <span>Show note IDs</span>
            <input
              checked={showIds}
              onChange={(e) => setShowIds(e.target.checked)}
              type="checkbox"
              className="h-5 w-5 accent-slate-800"
            />
          </label>

          <div className="grid gap-2">
            <button
              onClick={exportNotesToMarkdown}
              className="flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 font-sans text-sm font-bold text-white transition-colors hover:bg-slate-700"
            >
              <Download className="h-4 w-4" />
              Export Markdown
            </button>
            <button
              onClick={resetNotes}
              className="flex items-center justify-center gap-2 rounded-md bg-slate-100 px-3 py-2 font-sans text-sm font-bold text-slate-800 transition-colors hover:bg-slate-200"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Notes
            </button>
          </div>
        </div>
      )}

      {hasLoadedNotes &&
        notes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            constraintsRef={constraintsRef}
            updateNoteText={updateNoteText}
            updateNotePosition={updateNotePosition}
            deleteNote={deleteNote}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
            showIds={showIds}
          />
        ))}

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap");
        .font-handwriting {
          font-family: "Kalam", cursive;
        }
      `}</style>
    </div>
  );
}

function NoteItem({
  note,
  constraintsRef,
  updateNoteText,
  updateNotePosition,
  deleteNote,
  confirmDeleteId,
  setConfirmDeleteId,
  showIds,
}: {
  note: Note;
  constraintsRef: React.RefObject<HTMLDivElement | null>;
  updateNoteText: (id: number, text: string) => void;
  updateNotePosition: (id: number, x: number, y: number) => void;
  deleteNote: (id: number) => void;
  confirmDeleteId: number | null;
  setConfirmDeleteId: (id: number | null) => void;
  showIds: boolean;
}) {
  const dragControls = useDragControls();

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={constraintsRef}
      dragElastic={0}
      dragMomentum={false}
      initial={{ x: note.x, y: note.y, rotate: note.rotation, scale: 0 }}
      animate={{ x: note.x, y: note.y, rotate: note.rotation, scale: 1 }}
      onDragEnd={(_, info) => {
        updateNotePosition(
          note.id,
          note.x + info.offset.x,
          note.y + info.offset.y,
        );
      }}
      whileDrag={{
        scale: 1.06,
        boxShadow: "10px 10px 20px rgba(0,0,0,0.2)",
        zIndex: 100,
      }}
      className={`absolute flex h-48 w-48 flex-col p-4 shadow-lg md:h-64 md:w-64 md:p-6 ${note.color} group select-text`}
    >
      {/* Delete Button - Always visible on mobile, subtle hover on desktop */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!note.text.trim()) {
            deleteNote(note.id);
          } else {
            setConfirmDeleteId(note.id);
          }
        }}
        className="absolute -right-3 -top-3 z-20 rounded-full bg-red-500 p-2 text-white opacity-100 shadow-md transition-opacity hover:scale-110 md:opacity-0 md:group-hover:opacity-100"
        title="Delete Note"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Confirmation Overlay */}
      {confirmDeleteId === note.id && (
        <div className="absolute inset-0 bg-black/60 rounded flex flex-col items-center justify-center p-4 z-30 text-center animate-in fade-in duration-200 backdrop-blur-sm">
          <p className="text-white font-bold mb-4 font-sans text-lg">
            Are you sure?
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => deleteNote(note.id)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Drag Handle (Tape) */}
      <div
        className="absolute left-0 top-0 flex h-10 w-full cursor-move touch-none items-center justify-center bg-black/10 text-black/20"
        onPointerDown={(e) => {
          e.preventDefault();
          dragControls.start(e, { snapToCursor: false });
        }}
        style={{ touchAction: "none" }}
      >
        <GripHorizontal className="w-4 h-4 opacity-50" />
      </div>

      <textarea
        value={note.text}
        onChange={(e) => updateNoteText(note.id, e.target.value)}
        className="mt-5 h-full w-full resize-none bg-transparent font-handwriting text-lg leading-relaxed text-slate-800 focus:outline-none md:mt-4 md:text-xl"
        spellCheck={false}
        placeholder="Type something..."
        onPointerDown={(e) => e.stopPropagation()}
      />
      {showIds && (
        <div className="absolute bottom-2 right-2 select-none text-xs text-black/20">
          ID: {note.id.toString().slice(-4)}
        </div>
      )}
    </motion.div>
  );
}
