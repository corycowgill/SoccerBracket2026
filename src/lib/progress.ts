import type { Bracket, Tournament } from "../types";
import { resolvePredicted } from "./standings";

export interface Progress {
  groupsOrdered: number; // groups the user explicitly arranged (0..12)
  groupsTotal: number;
  thirdsPicked: number; // valid third-place picks (0..8)
  knockoutPicked: number; // knockout matches with an explicit valid winner pick
  knockoutTotal: number;
  champion?: string; // predicted champion, once the final is picked
  percent: number; // overall completion 0..100
  complete: boolean;
}

/** How far along a family member's bracket is — drives progress UI. */
export function bracketProgress(tournament: Tournament, bracket: Bracket): Progress {
  const groupsTotal = tournament.groups.length;

  // Valid third-place picks (ignore stale leftovers from reordering).
  const validThirds = new Set(
    tournament.groups.map((g) => orderOf(bracket, g.letter, g.teams)[2]),
  );
  const thirdsPicked = bracket.thirdPlaceTeams.filter((t) => validThirds.has(t)).length;

  const groupsOrdered = tournament.groups.filter(
    (g) => bracket.groupOrder[g.letter]?.length === g.teams.length,
  ).length;

  // Knockout: count matches where the user explicitly picked one of the two teams.
  const resolved = resolvePredicted(tournament, bracket);
  const knockoutTotal = tournament.knockout.length;
  let knockoutPicked = 0;
  for (const km of tournament.knockout) {
    const [t1, t2] = resolved.matchups[km.num] ?? ["", ""];
    const pick = bracket.knockoutPick[km.num];
    if (pick && (pick === t1 || pick === t2)) knockoutPicked++;
  }

  const champion = bracket.knockoutPick[104] ? resolved.champion : undefined;
  const required = 8 + knockoutTotal; // 8 third-place teams + every knockout pick
  const done = Math.min(thirdsPicked, 8) + knockoutPicked;
  const percent = Math.round((done / required) * 100);
  const complete = thirdsPicked >= 8 && knockoutPicked >= knockoutTotal;

  return {
    groupsOrdered,
    groupsTotal,
    thirdsPicked,
    knockoutPicked,
    knockoutTotal,
    champion,
    percent,
    complete,
  };
}

function orderOf(bracket: Bracket, letter: string, teams: string[]): string[] {
  const saved = bracket.groupOrder[letter];
  return saved && saved.length === teams.length ? saved : teams;
}
