import { useMemo, useState } from "react";
import type { Bracket, FeedData, Tournament } from "../types";
import { leaderboard } from "../lib/scoring";
import { resolveActual } from "../lib/standings";

interface Props {
  tournament: Tournament;
  feed: FeedData;
  brackets: Bracket[];
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ tournament, feed, brackets }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const scores = useMemo(
    () => leaderboard(tournament, feed, brackets),
    [tournament, feed, brackets],
  );
  const actual = useMemo(() => resolveActual(tournament, feed), [tournament, feed]);

  if (brackets.length === 0) {
    return (
      <div className="card text-center text-slate-500">
        Add some family members and fill out their brackets to see the leaderboard.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card bg-pitch-dark text-white">
        <h2 className="text-lg font-bold">Family Leaderboard</h2>
        <p className="text-sm text-white/80 mt-1">
          Points update as real results come in. Refresh results on the “Results” tab.
          {actual.champion && (
            <> The champion is <strong>{actual.champion}</strong> 🏆.</>
          )}
        </p>
      </div>

      <div className="space-y-2">
        {scores.map((s, i) => {
          const open = openId === s.bracketId;
          return (
            <div key={s.bracketId} className="card">
              <button
                className="w-full flex items-center gap-3 text-left"
                onClick={() => setOpenId(open ? null : s.bracketId)}
              >
                <span className="text-2xl w-8 text-center">{MEDALS[i] ?? i + 1}</span>
                <span className="flex-1">
                  <span className="font-bold text-lg">{s.name}</span>
                  <span className="block text-xs text-slate-500">
                    Groups {s.breakdown.groupPoints} · Knockout {s.breakdown.knockoutPoints} · Bonus{" "}
                    {s.breakdown.bonusPoints}
                  </span>
                </span>
                <span className="text-2xl font-bold text-pitch-dark">{s.total}</span>
                <span className="text-slate-400">{open ? "▲" : "▼"}</span>
              </button>
              {open && (
                <ul className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-sm">
                  {s.detail.length === 0 && (
                    <li className="text-slate-400">No points yet — come back once matches are played.</li>
                  )}
                  {s.detail.map((d, j) => (
                    <li key={j} className="flex justify-between">
                      <span className="text-slate-600">{d.label}</span>
                      <span className="font-semibold">+{d.points}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
