import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Bracket, StandingRow, Tournament } from "../types";
import TeamChip from "./TeamChip";

interface Props {
  tournament: Tournament;
  bracket: Bracket;
  standings: Record<string, StandingRow[]>;
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

const LIVE_STYLE = [
  "text-green-600",
  "text-green-600",
  "text-amber-600",
  "text-slate-400",
];

export function groupOrderOf(bracket: Bracket, letter: string, teams: string[]): string[] {
  const saved = bracket.groupOrder[letter];
  if (saved && saved.length === teams.length) return saved;
  return [...teams];
}

export default function GroupStage({
  tournament,
  bracket,
  standings,
  onChangeOrder,
  onToggleThird,
}: Props) {
  // The third-placed team predicted in each group (position 3) — the only valid picks.
  const thirdCandidates = tournament.groups.map((g) => {
    const order = groupOrderOf(bracket, g.letter, g.teams);
    return { letter: g.letter, team: order[2] };
  });
  const candidateSet = new Set(thirdCandidates.map((c) => c.team));
  // Count only picks that are still a current 3rd-place team (ignore stale ones
  // left over from reordering, so the picker never gets wedged at a phantom 8).
  const thirdsChosen = bracket.thirdPlaceTeams.filter((t) => candidateSet.has(t)).length;

  // Pointer sensor works for both mouse and touch (iPhone). The small distance
  // constraint lets normal taps/scrolls through until the user actually drags.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function move(letter: string, order: string[], idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    onChangeOrder(letter, arrayMove(order, idx, j));
  }

  function handleDragEnd(letter: string, order: string[], e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onChangeOrder(letter, arrayMove(order, from, to));
  }

  return (
    <div className="space-y-6">
      <div className="pitch-panel">
        <h2 className="text-lg font-bold">Step 1 · Predict the group stage</h2>
        <p className="text-sm text-white/80 mt-1">
          Put each group in the order you think it will finish. The top 2 of every group go
          through automatically. <strong>Drag the ⠿ handle</strong> to reorder, or use the arrows.
          Once games are played, each team shows its <strong>live position</strong> in the real table.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tournament.groups.map((g) => {
          const order = groupOrderOf(bracket, g.letter, g.teams);
          const rows = standings[g.letter] ?? [];
          const byTeam = new Map(rows.map((r) => [r.team, r]));
          const groupPlayed = rows.some((r) => r.played > 0);
          return (
            <div key={g.letter} className="card">
              <h3 className="font-bold text-pitch-dark mb-2">Group {g.letter}</h3>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(g.letter, order, e)}
              >
                <SortableContext items={order} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-1.5">
                    {order.map((team, idx) => (
                      <SortableTeamRow
                        key={team}
                        team={team}
                        idx={idx}
                        last={idx === order.length - 1}
                        liveRank={groupPlayed ? byTeam.get(team)?.rank : undefined}
                        onUp={() => move(g.letter, order, idx, -1)}
                        onDown={() => move(g.letter, order, idx, 1)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
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

interface RowProps {
  team: string;
  idx: number;
  last: boolean;
  liveRank?: number;
  onUp: () => void;
  onDown: () => void;
}

function SortableTeamRow({ team, idx, last, liveRank, onUp, onDown }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: team,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg px-1 py-1 bg-white ${
        isDragging ? "shadow-lg ring-2 ring-pitch/40" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 px-1 select-none"
        aria-label={`Drag ${team} to reorder`}
        // Prevent the browser from scrolling/selecting while dragging on touch.
        style={{ touchAction: "none" }}
      >
        ⠿
      </button>
      <span className={`text-xs font-bold px-2 py-0.5 rounded ${POS_STYLE[idx]}`}>
        {POS_LABEL[idx]}
      </span>
      <span className={`flex-1 min-w-0 ${liveRank === 4 ? "opacity-60" : ""}`}>
        <TeamChip team={team} size="sm" />
      </span>
      {liveRank !== undefined && (
        <span
          className={`text-[10px] font-bold whitespace-nowrap ${LIVE_STYLE[liveRank - 1]}`}
          title="Current actual position in the real group table"
        >
          ● now {POS_LABEL[liveRank - 1]}
        </span>
      )}
      <span className="flex flex-col">
        <button
          className="text-slate-400 hover:text-pitch leading-none disabled:opacity-30"
          disabled={idx === 0}
          onClick={onUp}
          aria-label="Move up"
        >
          ▲
        </button>
        <button
          className="text-slate-400 hover:text-pitch leading-none disabled:opacity-30"
          disabled={last}
          onClick={onDown}
          aria-label="Move down"
        >
          ▼
        </button>
      </span>
    </li>
  );
}
