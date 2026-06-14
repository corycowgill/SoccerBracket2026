import { useMemo, useState } from "react";
import type { Bracket, KnockoutRound, Tournament } from "../types";
import { KNOCKOUT_ROUNDS } from "../types";
import { resolvePredicted, type ActualKnockout } from "../lib/standings";
import PanelHeader from "./PanelHeader";
import TeamChip from "./TeamChip";

interface Props {
  tournament: Tournament;
  bracket: Bracket;
  actual: ActualKnockout;
  onPick: (matchNum: number, team: string) => void;
}

const ROUND_LABEL: Record<KnockoutRound, string> = {
  "Round of 32": "Round of 32",
  "Round of 16": "Round of 16",
  "Quarter-final": "Quarters",
  "Semi-final": "Semis",
  "Match for third place": "3rd place",
  Final: "Final",
};

export default function Knockout({ tournament, bracket, actual, onPick }: Props) {
  const resolved = useMemo(() => resolvePredicted(tournament, bracket), [tournament, bracket]);
  const [round, setRound] = useState<KnockoutRound>("Round of 32");

  const byRound = useMemo(() => {
    const map = {} as Record<KnockoutRound, typeof tournament.knockout>;
    for (const r of KNOCKOUT_ROUNDS) map[r] = [];
    for (const km of tournament.knockout) map[km.round].push(km);
    for (const r of KNOCKOUT_ROUNDS) map[r].sort((a, b) => a.num - b.num);
    return map;
  }, [tournament]);

  const ready = bracket.thirdPlaceTeams.length === 8;

  function picksInRound(r: KnockoutRound): { done: number; total: number } {
    const matches = byRound[r];
    let done = 0;
    for (const km of matches) {
      const [t1, t2] = resolved.matchups[km.num] ?? ["", ""];
      const pick = bracket.knockoutPick[km.num];
      if (pick && (pick === t1 || pick === t2)) done++;
    }
    return { done, total: matches.length };
  }

  const roundIdx = KNOCKOUT_ROUNDS.indexOf(round);
  const nextRound = KNOCKOUT_ROUNDS[roundIdx + 1];
  const current = picksInRound(round);

  return (
    <div className="space-y-4">
      <PanelHeader icon="🏆" title="Step 3 · Fill the knockout bracket">
        Tap the team you think wins each match. Your picks flow forward automatically. 🏆
        {!ready && (
          <span className="block text-sm bg-amber-400/20 text-amber-100 rounded px-2 py-1 mt-2">
            Finish Steps 1 &amp; 2 first (order every group and pick 8 third-place teams) so the
            Round of 32 fills in.
          </span>
        )}
        {(Object.keys(actual.winners).length > 0 || actual.eliminated.size > 0) && (
          <span className="block text-xs text-white/70 mt-2">
            As real games finish: ✓ your pick advanced · <span className="line-through">faded</span>{" "}
            teams are knocked out · ✗ means your pick is out.
          </span>
        )}
      </PanelHeader>

      {/* Round selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {KNOCKOUT_ROUNDS.map((r) => {
          const { done, total } = picksInRound(r);
          const complete = done === total && total > 0;
          const isActive = r === round;
          return (
            <button
              key={r}
              onClick={() => setRound(r)}
              className={`shrink-0 flex flex-col items-center rounded-xl px-3.5 py-2 border text-xs font-semibold transition-all ${
                isActive
                  ? "bg-gradient-to-b from-pitch to-pitch-dark text-white border-pitch shadow-md scale-105"
                  : complete
                    ? "bg-green-50 text-green-700 border-green-200 hover:border-pitch"
                    : "bg-white text-slate-600 border-slate-200 hover:border-pitch"
              }`}
            >
              <span>{ROUND_LABEL[r]}</span>
              <span className={`text-[10px] ${isActive ? "text-white/80" : complete ? "text-green-600" : "text-slate-400"}`}>
                {complete ? "✓ done" : `${done}/${total}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Matches for the selected round */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {byRound[round].map((km) => {
          const [t1, t2] = resolved.matchups[km.num] ?? ["", ""];
          const pick = bracket.knockoutPick[km.num];
          return (
            <MatchCard
              key={km.num}
              num={km.num}
              t1={t1}
              t2={t2}
              pick={pick}
              actual={actual}
              onPick={(team) => onPick(km.num, team)}
            />
          );
        })}
      </div>

      {/* Move to next round */}
      {nextRound && (
        <div className="flex justify-end">
          <button className="btn-primary" onClick={() => setRound(nextRound)}>
            {current.done === current.total ? `Next: ${ROUND_LABEL[nextRound]} →` : `Skip to ${ROUND_LABEL[nextRound]} →`}
          </button>
        </div>
      )}

      {resolved.champion && (
        <div className="card text-center bg-gradient-to-br from-yellow-50 via-amber-50 to-amber-100 border-amber-300 animate-glow">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
            Your predicted champion
          </p>
          <div className="text-3xl mt-1 animate-trophy">🏆</div>
          <div className="text-2xl font-extrabold mt-1 flex items-center justify-center gap-2">
            <TeamChip team={resolved.champion} />
          </div>
        </div>
      )}
    </div>
  );
}

interface MatchProps {
  num: number;
  t1: string;
  t2: string;
  pick?: string;
  actual: ActualKnockout;
  onPick: (team: string) => void;
}

function MatchCard({ num, t1, t2, pick, actual, onPick }: MatchProps) {
  // Outcome of the user's pick once reality is known.
  let outcome: "champion" | "advanced" | "out" | null = null;
  if (pick) {
    if (pick === actual.champion) outcome = "champion";
    else if (actual.eliminated.has(pick)) outcome = "out";
    else if (actual.winners[num] === pick) outcome = "advanced";
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-slate-50 border-b border-slate-100 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
        Match {num}
      </div>
      <TeamRow
        team={t1}
        picked={pick === t1 && !!t1}
        eliminated={!!t1 && actual.eliminated.has(t1)}
        outcome={pick === t1 ? outcome : null}
        onPick={() => onPick(t1)}
      />
      {/* center line / "vs" divider, like a scoreboard */}
      <div className="relative h-0 border-t border-slate-100">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-[10px] font-bold text-slate-400 px-1.5 rounded-full border border-slate-200">
          vs
        </span>
      </div>
      <TeamRow
        team={t2}
        picked={pick === t2 && !!t2}
        eliminated={!!t2 && actual.eliminated.has(t2)}
        outcome={pick === t2 ? outcome : null}
        onPick={() => onPick(t2)}
      />
    </div>
  );
}

function TeamRow({
  team,
  picked,
  eliminated,
  outcome,
  onPick,
}: {
  team: string;
  picked: boolean;
  eliminated: boolean;
  outcome: "champion" | "advanced" | "out" | null;
  onPick: () => void;
}) {
  const disabled = !team;
  const bustedPick = picked && outcome === "out";
  return (
    <button
      disabled={disabled}
      onClick={onPick}
      className={`w-full flex items-center gap-2 px-3 py-3 text-left transition-colors min-h-[3rem] ${
        bustedPick
          ? "bg-red-50 text-red-700"
          : picked
            ? "bg-pitch text-white"
            : disabled
              ? "bg-slate-50"
              : "hover:bg-green-50 active:bg-green-100"
      }`}
    >
      <span className={`flex-1 min-w-0 ${eliminated && !picked ? "line-through opacity-50" : ""}`}>
        <TeamChip team={team} muted={!team} />
      </span>
      {picked && outcome === "champion" && <span className="text-sm shrink-0">🏆</span>}
      {picked && outcome === "advanced" && <span className="text-sm shrink-0">✓</span>}
      {picked && outcome === "out" && <span className="text-xs font-bold shrink-0">✗ out</span>}
      {picked && outcome === null && <span className="text-sm shrink-0">✓</span>}
      {!picked && !disabled && <span className="text-xs text-slate-300 shrink-0">tap to pick</span>}
    </button>
  );
}
