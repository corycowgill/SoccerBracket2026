import { useMemo, useState } from "react";
import type { FeedData, FeedMatch } from "../types";
import { isPlayed, matchGoals } from "../lib/feed";
import TeamChip from "./TeamChip";

interface Props {
  feed: FeedData;
}

const TODAY = new Date().toISOString().slice(0, 10);

/** Recent results and upcoming fixtures, grouped by date. */
export default function Fixtures({ feed }: Props) {
  const { played, upcoming } = useMemo(() => {
    const p = feed.matches.filter(isPlayed).sort((a, b) => cmpDate(b) - cmpDate(a));
    const u = feed.matches.filter((m) => !isPlayed(m)).sort((a, b) => cmpDate(a) - cmpDate(b));
    return { played: p, upcoming: u };
  }, [feed]);

  const [view, setView] = useState<"recent" | "upcoming">(played.length ? "recent" : "upcoming");
  const list = (view === "recent" ? played : upcoming).slice(0, 24);
  const groups = groupByDate(list);

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-bold text-pitch-dark">Matches</h3>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-sm font-semibold">
          <button
            className={`px-3 py-1 rounded-md ${view === "recent" ? "bg-white shadow text-pitch-dark" : "text-slate-500"}`}
            onClick={() => setView("recent")}
          >
            Results ({played.length})
          </button>
          <button
            className={`px-3 py-1 rounded-md ${view === "upcoming" ? "bg-white shadow text-pitch-dark" : "text-slate-500"}`}
            onClick={() => setView("upcoming")}
          >
            Upcoming ({upcoming.length})
          </button>
        </div>
      </div>

      {list.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">
          {view === "recent" ? "No matches played yet." : "No upcoming matches."}
        </p>
      )}

      <div className="space-y-4">
        {groups.map(({ date, matches }) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-slate-500">{formatDate(date)}</span>
              {date === TODAY && (
                <span className="text-[10px] font-bold bg-pitch text-white rounded-full px-2 py-0.5">
                  TODAY
                </span>
              )}
            </div>
            <div className="space-y-1">
              {matches.map((m, i) => (
                <FixtureRow key={`${m.num ?? m.group}-${i}`} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FixtureRow({ match }: { match: FeedMatch }) {
  const goals = matchGoals(match.score);
  const played = isPlayed(match);
  const pens = match.score?.p;
  const w = goals ? (goals[0] > goals[1] ? 0 : goals[1] > goals[0] ? 1 : -1) : -1;
  const penW = pens ? (pens[0] > pens[1] ? 0 : 1) : -1;
  const winner = penW >= 0 ? penW : w;

  return (
    <div className="flex items-center gap-2 text-sm py-1">
      <div className={`flex-1 flex justify-end items-center gap-2 min-w-0 ${winner === 0 ? "font-bold" : ""}`}>
        <FixtureTeam name={match.team1} />
      </div>
      <div className="shrink-0 text-center w-16">
        {played && goals ? (
          <span className="font-bold tabular-nums">
            {goals[0]}–{goals[1]}
          </span>
        ) : (
          <span className="text-xs text-slate-400">{cleanTime(match.time)}</span>
        )}
      </div>
      <div className={`flex-1 flex items-center gap-2 min-w-0 ${winner === 1 ? "font-bold" : ""}`}>
        <FixtureTeam name={match.team2} />
      </div>
    </div>
  );
}

function FixtureTeam({ name }: { name: string }) {
  if (!isReal(name)) {
    return <span className="text-xs text-slate-400 italic truncate">{slotLabel(name)}</span>;
  }
  return <TeamChip team={name} size="sm" showRank={false} />;
}

// ---- helpers ----

function cmpDate(m: FeedMatch): number {
  return m.date ? Date.parse(m.date) : 0;
}

function groupByDate(matches: FeedMatch[]): { date: string; matches: FeedMatch[] }[] {
  const map = new Map<string, FeedMatch[]>();
  for (const m of matches) {
    const d = m.date ?? "";
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(m);
  }
  return [...map.entries()].map(([date, matches]) => ({ date, matches }));
}

function formatDate(date: string): string {
  if (!date) return "TBD";
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function cleanTime(time?: string): string {
  if (!time) return "";
  return time.replace(/\s*UTC.*$/, "");
}

function isReal(name: string): boolean {
  return !/^([12][A-L]|W\d+|L\d+|3[A-L](\/[A-L])+)$/i.test(name.trim());
}

function slotLabel(raw: string): string {
  const v = raw.trim();
  let m: RegExpMatchArray | null;
  if ((m = v.match(/^1([A-L])$/i))) return `Winner ${m[1].toUpperCase()}`;
  if ((m = v.match(/^2([A-L])$/i))) return `Runner-up ${m[1].toUpperCase()}`;
  if (/^3[A-L](\/[A-L])+$/i.test(v)) return "3rd place";
  if ((m = v.match(/^W(\d+)$/i))) return `Winner #${m[1]}`;
  if ((m = v.match(/^L(\d+)$/i))) return `Loser #${m[1]}`;
  return v;
}
