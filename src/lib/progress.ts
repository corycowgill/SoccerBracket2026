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

/**
 * How far along a family member's bracket is — drives progress UI.
 *
 * When `playMatchups` is supplied (group stage finished, real Round-of-32 known)
 * progress is purely about picking knockout winners on the real bracket; group
 * predictions are locked and no longer count toward completion.
 */
export function bracketProgress(
  tournament: Tournament,
  bracket: Bracket,
  playMatchups?: Record<number, [string, string]>,
): Progress {
  const groupsTotal = tournament.groups.length;
  const knockoutTotal = tournament.knockout.length;

  const validThirds = new Set(
    tournament.groups.map((g) => orderOf(bracket, g.letter, g.teams)[2]),
  );
  const thirdsPicked = bracket.thirdPlaceTeams.filter((t) => validThirds.has(t)).length;
  const groupsOrdered = tournament.groups.filter(
    (g) => bracket.groupOrder[g.letter]?.length === g.teams.length,
  ).length;

  // Use the real knockout matchups in play mode, else the player's predicted ones.
  const matchups = playMatchups ?? resolvePredicted(tournament, bracket).matchups;
  let knockoutPicked = 0;
  for (const km of tournament.knockout) {
    const [t1, t2] = matchups[km.num] ?? ["", ""];
    const pick = bracket.knockoutPick[km.num];
    if (pick && (pick === t1 || pick === t2)) knockoutPicked++;
  }
  const finalPick = bracket.knockoutPick[104];
  const finalMatch = matchups[104] ?? ["", ""];
  const champion = finalPick && (finalPick === finalMatch[0] || finalPick === finalMatch[1]) ? finalPick : undefined;

  let required: number;
  let done: number;
  let complete: boolean;
  if (playMatchups) {
    required = knockoutTotal;
    done = knockoutPicked;
    complete = knockoutPicked >= knockoutTotal;
  } else {
    required = 8 + knockoutTotal; // 8 third-place teams + every knockout pick
    done = Math.min(thirdsPicked, 8) + knockoutPicked;
    complete = thirdsPicked >= 8 && knockoutPicked >= knockoutTotal;
  }
  const percent = required > 0 ? Math.round((done / required) * 100) : 0;

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
