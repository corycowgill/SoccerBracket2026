import type { Bracket, Tournament } from "../types";
import TeamChip from "./TeamChip";

interface Props {
  tournament: Tournament;
  bracket: Bracket;
  onChangeOrder: (letter: string, order: string[]) => void;
  onToggleThird: (team: string) => void;
}

const POS_LABEL = ["1st", "2nd", "3rd", "4th"];
const POS_STYLE = [
  "bg-green-100 text-green-800",
  "bg-green-100 text-green-800",
  "bg-amber-100 text-amber-800",
  "bg-slate-100 text-slate-500",
];

export function groupOrderOf(bracket: Bracket, letter: string, teams: string[]): string[] {
  const saved = bracket.groupOrder[letter];
  if (saved && saved.length === teams.length) return saved;
  return [...teams];
}

export default function GroupStage({ tournament, bracket, onChangeOrder, onToggleThird }: Props) {
  const thirdsChosen = bracket.thirdPlaceTeams.length;

  function move(letter: string, order: string[], idx: number, dir: -1 | 1) {
    const next = [...order];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChangeOrder(letter, next);
  }

  // The third-placed team predicted in each group (position 3).
  const thirdCandidates = tournament.groups.map((g) => {
    const order = groupOrderOf(bracket, g.letter, g.teams);
    return { letter: g.letter, team: order[2] };
  });

  return (
    <div className="space-y-6">
      <div className="card bg-pitch-dark text-white">
        <h2 className="text-lg font-bold">Step 1 · Predict the group stage</h2>
        <p className="text-sm text-white/80 mt-1">
          Put each group in the order you think it will finish. The top 2 of every group go
          through automatically. Use the arrows to reorder.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tournament.groups.map((g) => {
          const order = groupOrderOf(bracket, g.letter, g.teams);
          return (
            <div key={g.letter} className="card">
              <h3 className="font-bold text-pitch-dark mb-2">Group {g.letter}</h3>
              <ul className="space-y-1.5">
                {order.map((team, idx) => (
                  <li key={team} className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${POS_STYLE[idx]}`}>
                      {POS_LABEL[idx]}
                    </span>
                    <span className="flex-1 min-w-0">
                      <TeamChip team={team} size="sm" />
                    </span>
                    <span className="flex flex-col">
                      <button
                        className="text-slate-400 hover:text-pitch leading-none disabled:opacity-30"
                        disabled={idx === 0}
                        onClick={() => move(g.letter, order, idx, -1)}
                        aria-label="Move up"
                      >
                        ▲
                      </button>
                      <button
                        className="text-slate-400 hover:text-pitch leading-none disabled:opacity-30"
                        disabled={idx === order.length - 1}
                        onClick={() => move(g.letter, order, idx, 1)}
                        aria-label="Move down"
                      >
                        ▼
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-pitch-dark">Step 2 · Pick the 8 best third-place teams</h2>
        <p className="text-sm text-slate-600 mt-1">
          In 2026, the <strong>8 best third-placed teams</strong> also advance to the Round of 32.
          Choose which 8 of these 12 you think make it.
        </p>
        <p className={`text-sm font-semibold mt-2 ${thirdsChosen === 8 ? "text-green-700" : "text-amber-700"}`}>
          Picked {thirdsChosen} of 8{thirdsChosen === 8 ? " ✓" : ""}
        </p>
        <div className="grid gap-2 mt-3 sm:grid-cols-2 lg:grid-cols-3">
          {thirdCandidates.map(({ letter, team }) => {
            const selected = bracket.thirdPlaceTeams.includes(team);
            const disabled = !selected && thirdsChosen >= 8;
            return (
              <button
                key={letter}
                onClick={() => onToggleThird(team)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${
                  selected
                    ? "bg-green-50 border-green-500"
                    : disabled
                      ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                      : "bg-white border-slate-300 hover:border-pitch"
                }`}
              >
                <input type="checkbox" readOnly checked={selected} className="accent-pitch" />
                <span className="text-xs font-bold text-slate-400 w-4">{letter}</span>
                <TeamChip team={team} size="sm" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
