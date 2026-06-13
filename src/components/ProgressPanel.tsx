import type { Bracket, Tournament } from "../types";
import { bracketProgress } from "../lib/progress";
import TeamChip from "./TeamChip";

interface Props {
  tournament: Tournament;
  bracket: Bracket;
  fillTab: "groups" | "knockout";
  onGoTo: (tab: "groups" | "knockout") => void;
}

export default function ProgressPanel({ tournament, bracket, fillTab, onGoTo }: Props) {
  const p = bracketProgress(tournament, bracket);

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-pitch-dark">
            {bracket.name}'s bracket
            {p.complete && <span className="ml-2 text-green-600">✓ Complete!</span>}
          </h2>
          <p className="text-xs text-slate-500">
            {p.complete
              ? "Nice — every pick is in. You can still tweak it any time."
              : "Fill in the steps below to complete your bracket."}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-pitch-dark">{p.percent}%</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">done</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-pitch transition-all duration-300"
          style={{ width: `${p.percent}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Step
          done={p.thirdsPicked >= 8}
          active={fillTab === "groups"}
          label="Third-place teams"
          detail={`${p.thirdsPicked} / 8 picked`}
          onClick={() => onGoTo("groups")}
        />
        <Step
          done={p.knockoutPicked >= p.knockoutTotal}
          active={fillTab === "knockout"}
          label="Knockout winners"
          detail={`${p.knockoutPicked} / ${p.knockoutTotal} picked`}
          onClick={() => onGoTo("knockout")}
        />
        <Step
          done={!!p.champion}
          active={false}
          label="Your champion"
          detail={p.champion ?? "Not chosen yet"}
          champion={p.champion}
          onClick={() => onGoTo("knockout")}
        />
      </div>
    </div>
  );
}

function Step({
  done,
  active,
  label,
  detail,
  champion,
  onClick,
}: {
  done: boolean;
  active: boolean;
  label: string;
  detail: string;
  champion?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
        active ? "border-pitch bg-green-50" : "border-slate-200 hover:border-pitch"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done ? "bg-pitch text-white" : "bg-slate-200 text-slate-500"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-slate-700">{label}</span>
        <span className="block text-xs text-slate-500 truncate">
          {champion ? <TeamChip team={champion} size="sm" /> : detail}
        </span>
      </span>
    </button>
  );
}
