import type { Bracket, FeedData, Tournament } from "../types";
import { groupStageComplete, resolveKnockoutActual, resolvePredicted } from "./standings";
import { byFifaRank } from "./teamMeta";

function orderOf(bracket: Bracket, letter: string, teams: string[]): string[] {
  const saved = bracket.groupOrder[letter];
  return saved && saved.length === teams.length ? saved : teams;
}

/** Better-ranked of two teams (lower FIFA rank wins). */
function favourite(a: string, b: string): string {
  return byFifaRank(a, b) <= 0 ? a : b;
}

/** Fill remaining knockout picks on a set of matchups, higher seed advancing. */
function fillKnockout(
  tournament: Tournament,
  bracket: Bracket,
  resolve: (b: Bracket) => Record<number, [string, string]>,
): Record<number, string> {
  let work: Bracket = { ...bracket, knockoutPick: { ...bracket.knockoutPick } };
  const ordered = [...tournament.knockout].sort((a, b) => a.num - b.num);
  for (const km of ordered) {
    const [t1, t2] = resolve(work)[km.num] ?? ["", ""];
    if (!t1 || !t2) continue;
    const pick = work.knockoutPick[km.num];
    if (pick === t1 || pick === t2) continue; // keep existing valid pick
    work = { ...work, knockoutPick: { ...work.knockoutPick, [km.num]: favourite(t1, t2) } };
  }
  return work.knockoutPick;
}

/**
 * Fill in everything still missing in a bracket using FIFA ranking as a guide.
 * Before the group stage ends this also picks the 8 best third-place teams and
 * flows a predicted bracket; once the real Round of 32 is set it just completes
 * the knockout picks on the actual bracket. Existing choices are preserved.
 */
export function autoFillRest(
  tournament: Tournament,
  feed: FeedData,
  bracket: Bracket,
): Bracket {
  if (groupStageComplete(tournament, feed)) {
    const knockoutPick = fillKnockout(
      tournament,
      bracket,
      (b) => resolveKnockoutActual(tournament, feed, b).matchups,
    );
    return { ...bracket, knockoutPick };
  }

  // Pre-tournament: also choose the 8 best-ranked third-place teams.
  const thirds = tournament.groups.map((g) => orderOf(bracket, g.letter, g.teams)[2]);
  const validExisting = bracket.thirdPlaceTeams.filter((t) => thirds.includes(t));
  const need = Math.max(0, 8 - validExisting.length);
  const fill = thirds
    .filter((t) => !validExisting.includes(t))
    .sort(byFifaRank)
    .slice(0, need);
  const thirdPlaceTeams = [...validExisting, ...fill];

  const seeded: Bracket = { ...bracket, thirdPlaceTeams };
  const knockoutPick = fillKnockout(
    tournament,
    seeded,
    (b) => resolvePredicted(tournament, b).matchups,
  );
  return { ...bracket, thirdPlaceTeams, knockoutPick };
}
