import { useEffect, useRef, useState } from "react";
import type { Bracket, Tournament } from "../types";
import { bracketProgress } from "../lib/progress";

interface Props {
  tournament: Tournament;
  brackets: Bracket[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onExport: () => void;
  onImport: (json: string) => void;
}

/** Persistent bar to pick / add / manage the family member whose bracket is shown. */
export default function BracketBar({
  tournament,
  brackets,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onExport,
  onImport,
}: Props) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const active = brackets.find((b) => b.id === activeId);

  // Reset inline rename/delete state when the selected player changes.
  useEffect(() => {
    setEditing(false);
    setConfirmDelete(false);
  }, [activeId]);

  function saveRename() {
    const n = editValue.trim();
    if (n && activeId) onRename(activeId, n);
    setEditing(false);
  }

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName("");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImport(String(reader.result));
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-500">Whose bracket:</span>
        {brackets.length === 0 && (
          <span className="text-sm text-slate-400">No brackets yet — add a family member →</span>
        )}
        {brackets.map((b) => {
          const p = bracketProgress(tournament, b);
          return (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                b.id === activeId
                  ? "bg-pitch text-white border-pitch"
                  : "bg-white text-slate-700 border-slate-300 hover:border-pitch"
              }`}
              title={`${p.percent}% complete`}
            >
              {b.name}
              <span
                className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${
                  p.complete
                    ? b.id === activeId
                      ? "bg-white/25 text-white"
                      : "bg-green-100 text-green-700"
                    : b.id === activeId
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {p.complete ? "✓" : `${p.percent}%`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add name (e.g. Mia)"
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-pitch"
        />
        <button className="btn-primary" onClick={handleAdd}>
          + Add player
        </button>

        <div className="flex-1" />

        {active &&
          (editing ? (
            <span className="flex items-center gap-1">
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRename();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="px-2 py-1.5 rounded-lg border border-slate-300 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-pitch"
              />
              <button className="btn-primary" onClick={saveRename}>
                Save
              </button>
              <button className="btn-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </span>
          ) : confirmDelete ? (
            <span className="flex items-center gap-1">
              <span className="text-sm text-slate-600">Delete {active.name}?</span>
              <button
                className="btn bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  onDelete(active.id);
                  setConfirmDelete(false);
                }}
              >
                Yes, delete
              </button>
              <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <>
              <button
                className="btn-ghost"
                onClick={() => {
                  setEditValue(active.name);
                  setEditing(true);
                }}
              >
                Rename
              </button>
              <button className="btn-ghost text-red-600" onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            </>
          ))}
        <button className="btn-ghost" onClick={onExport} title="Download a backup of all brackets">
          ⬇︎ Export
        </button>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()} title="Restore brackets from a backup file">
          ⬆︎ Import
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleFile} />
      </div>
    </div>
  );
}
