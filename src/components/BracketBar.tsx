import { useRef, useState } from "react";
import type { Bracket } from "../types";

interface Props {
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
  const fileRef = useRef<HTMLInputElement>(null);
  const active = brackets.find((b) => b.id === activeId);

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
        {brackets.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              b.id === activeId
                ? "bg-pitch text-white border-pitch"
                : "bg-white text-slate-700 border-slate-300 hover:border-pitch"
            }`}
          >
            {b.name}
          </button>
        ))}
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

        {active && (
          <>
            <button
              className="btn-ghost"
              onClick={() => {
                const name = prompt("Rename bracket", active.name);
                if (name) onRename(active.id, name);
              }}
            >
              Rename
            </button>
            <button
              className="btn-ghost text-red-600"
              onClick={() => {
                if (confirm(`Delete ${active.name}'s bracket?`)) onDelete(active.id);
              }}
            >
              Delete
            </button>
          </>
        )}
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
