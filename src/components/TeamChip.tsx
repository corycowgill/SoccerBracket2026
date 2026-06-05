import { flagUrl } from "../lib/teamMeta";

interface Props {
  team: string;
  size?: "sm" | "md";
  muted?: boolean;
}

/** A team name with its flag. Falls back to a ball when the team is unknown/TBD. */
export default function TeamChip({ team, size = "md", muted = false }: Props) {
  const url = team ? flagUrl(team) : null;
  const flagH = size === "sm" ? "h-3.5" : "h-5";
  const text = size === "sm" ? "text-sm" : "text-base";
  return (
    <span className={`inline-flex items-center gap-2 ${text} ${muted ? "text-slate-400" : ""}`}>
      {url ? (
        <img src={url} alt="" className={`${flagH} w-auto rounded-sm shadow-sm`} loading="lazy" />
      ) : (
        <span className={size === "sm" ? "text-sm" : "text-lg"}>{team ? "🏳️" : "⚽"}</span>
      )}
      <span className="truncate">{team || "TBD"}</span>
    </span>
  );
}
