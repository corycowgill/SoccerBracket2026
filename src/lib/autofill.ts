import type { Bracket, Tournament } from "../types";
import { resolvePredicted } from "./standings";
import { byFifaRank } from "./teamMeta";

function orderOf(bracket: Bracket, letter: string, teams: string[]): string[] {
  const saved = bracket.groupOrder[letter];
  return saved && saved.length === teams.length ? saved : teams;
}

/** Better-ranked of two teams (lower FIFA rank wins). */
function favourite(a: string, b: string): string {
  return byFifaRank(a, b) <= 0 ? a : b;
}

/**
 * Fill in everything still missing in a bracket using FIFA ranking as a guide:
 * the 8 best-ranked third-place teams advance, and the higher-ranked team is
 * picked to win each knockout match. Existing choices are preserved.
 */
export function autoFillRest(tournament: Tournament, bracket: Bracket): Bracket {
  // Third place: keep the user's valid picks, top up with best-ranked others.
  const thirds = tournament.groups.map((g) => orderOf(bracket, g.letter, g.teams)[2]);
  const validExisting = bracket.thirdPlaceTeams.filter((t) => thirds.includes(t));
  const need = Math.max(0, 8 - validExisting.length);
  const fill = thirds
    .filter((t) => !validExisting.includes(t))
    .sort(byFifaRank)
    .slice(0, need);
  const thirdPlaceTeams = [...validExisting, ...fill];

  // Knockout: walk matches in order, filling only those without a valid pick.
  let work: Bracket = { ...bracket, thirdPlaceTeams, knockoutPick: { ...bracket.knockoutPick } };
  const ordered = [...tournament.knockout].sort((a, b) => a.num - b.num);
  for (const km of ordered) {
    const r = resolvePredicted(tournament, work);
    const [t1, t2] = r.matchups[km.num] ?? ["", ""];
    if (!t1 || !t2) continue;
    const pick = work.knockoutPick[km.num];
    if (pick === t1 || pick === t2) continue; // keep existing valid pick
    work = { ...work, knockoutPick: { ...work.knockoutPick, [km.num]: favourite(t1, t2) } };
  }

  return { ...bracket, thirdPlaceTeams, knockoutPick: work.knockoutPick };
}
