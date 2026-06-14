import { flagUrl, teamColor, teamRank } from "../lib/teamMeta";

interface Props {
  team: string;
  size?: "sm" | "md";
  muted?: boolean;
  showRank?: boolean;
}

/** A team name with its flag, color accent and (optionally) FIFA world ranking. */
export default function TeamChip({ team, size = "md", muted = false, showRank = true }: Props) {
  const url = team ? flagUrl(team) : null;
  const rank = team ? teamRank(team) : undefined;
  const flagH = size === "sm" ? "h-3.5" : "h-5";
  const text = size === "sm" ? "text-sm" : "text-base";
  return (
    <span className={`inline-flex items-center gap-2 min-w-0 ${text} ${muted ? "text-slate-400" : ""}`}>
      {team && !muted && (
        <span
          className={`shrink-0 ${size === "sm" ? "h-3.5" : "h-5"} w-1 rounded-full`}
          style={{ backgroundColor: teamColor(team) }}
          aria-hidden="true"
        />
      )}
      {url ? (
        <img src={url} alt="" className={`${flagH} w-auto rounded-sm shadow-sm shrink-0`} loading="lazy" />
      ) : (
        <span className={`shrink-0 ${size === "sm" ? "text-sm" : "text-lg"}`}>{team ? "🏳️" : "⚽"}</span>
      )}
      <span className="truncate">{team || "TBD"}</span>
      {showRank && rank !== undefined && (
        <span
          className="shrink-0 text-[10px] font-semibold text-slate-400 bg-slate-100 rounded px-1 py-0.5 leading-none"
          title={`FIFA world ranking: #${rank}`}
        >
          #{rank}
        </span>
      )}
    </span>
  );
}
