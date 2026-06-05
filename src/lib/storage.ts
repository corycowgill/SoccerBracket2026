import type { Bracket, StoredState } from "../types";

const STORAGE_KEY = "wc2026-brackets";
const SCHEMA_VERSION = 1;

function emptyState(): StoredState {
  return { version: SCHEMA_VERSION, brackets: [] };
}

/** Load all saved brackets from localStorage. */
export function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed || !Array.isArray(parsed.brackets)) return emptyState();
    return migrate(parsed);
  } catch {
    return emptyState();
  }
}

/** Persist all brackets to localStorage. */
export function saveState(state: StoredState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, version: SCHEMA_VERSION }),
    );
  } catch (err) {
    console.error("Failed to save brackets", err);
  }
}

/** Forward-compatible migration hook for future schema changes. */
function migrate(state: StoredState): StoredState {
  const brackets = state.brackets.map((b) => ({
    ...b,
    groupOrder: b.groupOrder ?? {},
    thirdPlaceTeams: b.thirdPlaceTeams ?? [],
    knockoutPick: b.knockoutPick ?? {},
  }));
  return { version: SCHEMA_VERSION, brackets };
}

export function createBracket(name: string): Bracket {
  const now = Date.now();
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || "Player",
    createdAt: now,
    updatedAt: now,
    groupOrder: {},
    thirdPlaceTeams: [],
    knockoutPick: {},
  };
}

// ---- Export / import (backup + move between devices) ----

export function exportBrackets(brackets: Bracket[]): string {
  return JSON.stringify({ version: SCHEMA_VERSION, brackets }, null, 2);
}

export function importBrackets(json: string): Bracket[] {
  const parsed = JSON.parse(json) as StoredState;
  if (!parsed || !Array.isArray(parsed.brackets)) {
    throw new Error("That file does not look like a brackets backup.");
  }
  return migrate(parsed).brackets;
}

/** Trigger a browser download of the brackets backup file. */
export function downloadBrackets(brackets: Bracket[]): void {
  const blob = new Blob([exportBrackets(brackets)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `world-cup-2026-brackets-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
