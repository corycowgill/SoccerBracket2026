import { useMemo } from "react";
import type { Bracket, KnockoutRound, Tournament } from "../types";
import { KNOCKOUT_ROUNDS } from "../types";
import { resolvePredicted } from "../lib/standings";
import TeamChip from "./TeamChip";

interface Props {
  tournament: Tournament;
  bracket: Bracket;
  onPick: (matchNum: number, team: string) => void;
}

export default function Knockout({ tournament, bracket, onPick }: Props) {
  const resolved = useMemo(() => resolvePredicted(tournament, bracket), [tournament, bracket]);

  const byRound = useMemo(() => {
    const map = {} as Record<KnockoutRound, typeof tournament.knockout>;
    for (const r of KNOCKOUT_ROUNDS) map[r] = [];
    for (const km of tournament.knockout) map[km.round].push(km);
    for (const r of KNOCKOUT_ROUNDS) map[r].sort((a, b) => a.num - b.num);
    return map;
  }, [tournament]);

  const ready = bracket.thirdPlaceTeams.length === 8;

  return (
    <div className="space-y-4">
      <div className="card bg-pitch-dark text-white">
        <h2 className="text-lg font-bold">Step 3 · Fill the knockout bracket</h2>
        <p className="text-sm text-white/80 mt-1">
          Click the team you think wins each match. Your picks flow forward automatically all
          the way to the Final. 🏆
        </p>
        {!ready && (
          <p className="text-sm bg-amber-400/20 text-amber-100 rounded px-2 py-1 mt-2">
            Finish Step 1 &amp; 2 first (set every group's order and pick 8 third-place teams) so the
            Round of 32 fills in.
          </p>
        )}
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {KNOCKOUT_ROUNDS.filter((r) => r !== "Match for third place").map((round) => (
            <div key={round} className="flex flex-col gap-3 w-60">
              <h3 className="text-sm font-bold text-pitch-dark text-center sticky top-0">{round}</h3>
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
                    onPick={(team) => onPick(km.num, team)}
                  />
                );
              })}
              {round === "Final" && (
                <ThirdPlaceCard
                  km={byRound["Match for third place"][0]}
                  t1={resolved.matchups[103]?.[0] ?? ""}
                  t2={resolved.matchups[103]?.[1] ?? ""}
                  pick={bracket.knockoutPick[103]}
                  onPick={onPick}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {resolved.champion && (
        <div className="card text-center bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-300">
          <p className="text-sm font-semibold text-amber-700">Your predicted champion</p>
          <div className="text-2xl font-bold mt-1 flex items-center justify-center gap-2">
            🏆 <TeamChip team={resolved.champion} />
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
  onPick: (team: string) => void;
}

function MatchCard({ num, t1, t2, pick, onPick }: MatchProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {[t1, t2].map((team, i) => {
        const picked = pick && team && pick === team;
        const disabled = !team;
        return (
          <button
            key={i}
            disabled={disabled}
            onClick={() => onPick(team)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 text-left border-b last:border-b-0 border-slate-100 transition-colors ${
              picked ? "bg-pitch text-white" : disabled ? "bg-slate-50" : "hover:bg-green-50"
            }`}
          >
            <span className="flex-1 min-w-0">
              <TeamChip team={team} size="sm" muted={!team} />
            </span>
            {picked && <span className="text-xs">✓</span>}
          </button>
        );
      })}
      <div className="text-[10px] text-slate-300 text-right px-2 pb-0.5">#{num}</div>
    </div>
  );
}

function ThirdPlaceCard({
  km,
  t1,
  t2,
  pick,
  onPick,
}: {
  km: Tournament["knockout"][number] | undefined;
  t1: string;
  t2: string;
  pick?: string;
  onPick: (matchNum: number, team: string) => void;
}) {
  if (!km) return null;
  return (
    <div className="mt-4">
      <h3 className="text-xs font-bold text-slate-400 text-center mb-1">Third-place play-off</h3>
      <MatchCard num={km.num} t1={t1} t2={t2} pick={pick} onPick={(team) => onPick(km.num, team)} />
    </div>
  );
}
