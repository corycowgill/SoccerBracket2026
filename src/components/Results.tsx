import { useMemo, useState } from "react";
import type { FeedData, FeedMatch, Tournament } from "../types";
import type { FeedState } from "../lib/feedClient";
import type { ManualResult, ManualResults } from "../lib/manualResults";
import { matchKey } from "../lib/manualResults";
import { allStandings } from "../lib/standings";
import { isPlayed } from "../lib/feed";
import TeamChip from "./TeamChip";

interface Props {
  tournament: Tournament;
  feed: FeedData; // merged (live + manual)
  liveFeed: FeedData; // live/cache/bundled only — used to lock real results
  feedState: FeedState;
  manual: ManualResults;
  refreshing: boolean;
  onRefresh: () => void;
  onSetManual: (key: string, result: ManualResult | null) => void;
}

export default function Results({
  tournament,
  feed,
  liveFeed,
  feedState,
  manual,
  refreshing,
  onRefresh,
  onSetManual,
}: Props) {
  const [showEntry, setShowEntry] = useState(false);
  const standings = useMemo(() => allStandings(tournament, feed), [tournament, feed]);

  const liveByKey = useMemo(() => {
    const m = new Map<string, FeedMatch>();
    for (const fm of liveFeed.matches) m.set(matchKey(fm), fm);
    return m;
  }, [liveFeed]);

  const playedCount = feed.matches.filter(isPlayed).length;

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[12rem]">
          <h2 className="text-lg font-bold text-pitch-dark">Live results</h2>
          <p className="text-sm text-slate-500">
            {playedCount} of {feed.matches.length} matches recorded · source: {sourceLabel(feedState)}
            {feedState.fetchedAt && <> · updated {timeAgo(feedState.fetchedAt)}</>}
          </p>
        </div>
        <button className="btn-primary" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "↻ Refresh from internet"}
        </button>
      </div>

      <div className="card text-sm text-slate-600">
        Results are pulled automatically from the free{" "}
        <a
          className="text-pitch font-semibold underline"
          href="https://github.com/openfootball/worldcup.json"
          target="_blank"
          rel="noreferrer"
        >
          openfootball
        </a>{" "}
        data feed. If the feed is behind, you can also{" "}
        <button className="text-pitch font-semibold underline" onClick={() => setShowEntry((v) => !v)}>
          enter results by hand
        </button>
        .
      </div>

      {/* Standings */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tournament.groups.map((g) => (
          <div key={g.letter} className="card">
            <h3 className="font-bold text-pitch-dark mb-2">Group {g.letter}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs">
                  <th className="text-left font-medium">Team</th>
                  <th className="w-8">P</th>
                  <th className="w-8">GD</th>
                  <th className="w-8">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings[g.letter].map((r) => (
                  <tr key={r.team} className={r.rank <= 2 ? "font-semibold" : r.rank === 3 ? "" : "text-slate-400"}>
                    <td className="py-0.5">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-3 text-xs text-slate-300">{r.rank}</span>
                        <TeamChip team={r.team} size="sm" />
                      </span>
                    </td>
                    <td className="text-center">{r.played}</td>
                    <td className="text-center">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                    <td className="text-center font-bold">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Manual entry */}
      {showEntry && (
        <div className="card">
          <h3 className="font-bold text-pitch-dark mb-1">Enter results by hand</h3>
          <p className="text-sm text-slate-500 mb-3">
            Real results from the internet always take priority and show as locked 🔒. For knockout
            ties that finish level, add penalty scores too.
          </p>
          <div className="space-y-4">
            {tournament.groups.map((g) => (
              <MatchGroup
                key={g.letter}
                title={`Group ${g.letter}`}
                matches={feed.matches.filter((m) => m.group === g.name)}
                liveByKey={liveByKey}
                manual={manual}
                onSetManual={onSetManual}
              />
            ))}
            <MatchGroup
              title="Knockout stage"
              matches={tournament.knockout.map((km) => toFeedMatch(km))}
              liveByKey={liveByKey}
              manual={manual}
              onSetManual={onSetManual}
              knockout
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MatchGroup({
  title,
  matches,
  liveByKey,
  manual,
  onSetManual,
  knockout = false,
}: {
  title: string;
  matches: FeedMatch[];
  liveByKey: Map<string, FeedMatch>;
  manual: ManualResults;
  onSetManual: (key: string, result: ManualResult | null) => void;
  knockout?: boolean;
}) {
  return (
    <details className="rounded-lg border border-slate-200">
      <summary className="cursor-pointer px-3 py-2 font-semibold text-slate-700">{title}</summary>
      <div className="p-3 pt-0 space-y-2">
        {matches.map((m) => {
          const key = matchKey(m);
          const live = liveByKey.get(key);
          const locked = !!(live && live.score && (live.score.ft || live.score.et));
          const entry = manual[key];
          return (
            <ScoreRow
              key={key}
              team1={m.team1}
              team2={m.team2}
              locked={locked}
              lockedScore={locked ? live!.score!.et ?? live!.score!.ft : undefined}
              entry={entry}
              knockout={knockout}
              onChange={(r) => onSetManual(key, r)}
            />
          );
        })}
      </div>
    </details>
  );
}

function ScoreRow({
  team1,
  team2,
  locked,
  lockedScore,
  entry,
  knockout,
  onChange,
}: {
  team1: string;
  team2: string;
  locked: boolean;
  lockedScore?: [number, number];
  entry?: ManualResult;
  knockout: boolean;
  onChange: (r: ManualResult | null) => void;
}) {
  function setField(field: keyof ManualResult, value: string) {
    const num = value === "" ? undefined : Math.max(0, Math.floor(Number(value)));
    const base: ManualResult = { team1Goals: 0, team2Goals: 0, ...entry };
    const next = { ...base, [field]: num ?? 0 } as ManualResult;
    if (field.startsWith("pens") && num === undefined) {
      delete next.pens1;
      delete next.pens2;
    }
    onChange(next);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex-1 text-right min-w-0 truncate">
        <span className="inline-flex items-center gap-1 justify-end">
          <TeamChip team={team1} size="sm" muted={!isReal(team1)} />
        </span>
      </span>
      {locked ? (
        <span className="font-bold tabular-nums px-2">
          {lockedScore?.[0]}–{lockedScore?.[1]} 🔒
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            value={entry?.team1Goals ?? ""}
            onChange={(e) => setField("team1Goals", e.target.value)}
            className="w-10 text-center border rounded py-0.5"
          />
          <span>–</span>
          <input
            type="number"
            min={0}
            value={entry?.team2Goals ?? ""}
            onChange={(e) => setField("team2Goals", e.target.value)}
            className="w-10 text-center border rounded py-0.5"
          />
        </span>
      )}
      <span className="flex-1 min-w-0 truncate">
        <TeamChip team={team2} size="sm" muted={!isReal(team2)} />
      </span>
      {knockout && !locked && (
        <span className="flex items-center gap-1 text-xs text-slate-400" title="Penalty shootout (if level)">
          pens
          <input
            type="number"
            min={0}
            value={entry?.pens1 ?? ""}
            onChange={(e) => setField("pens1", e.target.value)}
            className="w-9 text-center border rounded py-0.5"
          />
          <input
            type="number"
            min={0}
            value={entry?.pens2 ?? ""}
            onChange={(e) => setField("pens2", e.target.value)}
            className="w-9 text-center border rounded py-0.5"
          />
        </span>
      )}
    </div>
  );
}

function toFeedMatch(km: Tournament["knockout"][number]): FeedMatch {
  return {
    round: km.round,
    num: km.num,
    team1: km.team1.team ?? km.team1.raw,
    team2: km.team2.team ?? km.team2.raw,
  };
}

function isReal(name: string): boolean {
  return !/^([12][A-L]|W\d+|L\d+|3[A-L](\/[A-L])+)$/i.test(name.trim());
}

function sourceLabel(s: FeedState): string {
  return s.source === "live" ? "live internet" : s.source === "cache" ? "saved copy" : "built-in snapshot";
}

function timeAgo(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return new Date(ts).toLocaleDateString();
}
