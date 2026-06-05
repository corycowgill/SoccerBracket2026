import type {
  Bracket,
  BracketScore,
  FeedData,
  KnockoutRound,
  ScoreLine,
  ScoringConfig,
  StandingRow,
  Tournament,
} from "../types";
import { allStandings, groupComplete, resolveActual, resolvePredicted } from "./standings";

/**
 * Default scoring. Tuned so that deep, correct knockout calls are worth the most,
 * while group-stage accuracy still adds up. All values live here so they are
 * easy to tweak in one place.
 */
export const DEFAULT_SCORING: ScoringConfig = {
  groupQualifier: 4, // each team you sent to the Round of 32 that actually got there
  exactGroupOrder: 3, // bonus per group where you nailed BOTH 1st and 2nd
  reachRound: {
    "Round of 16": 5,
    "Quarter-final": 8,
    "Semi-final": 12,
    Final: 18,
  },
  champion: 30,
  runnerUp: 18,
  thirdPlace: 12,
};

const SCORED_ROUNDS: KnockoutRound[] = [
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Final",
];

function intersectionSize(pred: Set<string>, actual: Set<string>): number {
  let n = 0;
  for (const t of pred) if (actual.has(t)) n++;
  return n;
}

/** Score one family member's bracket against the real results so far. */
export function scoreBracket(
  tournament: Tournament,
  feed: FeedData,
  bracket: Bracket,
  config: ScoringConfig = DEFAULT_SCORING,
): BracketScore {
  const actual = resolveActual(tournament, feed);
  const predicted = resolvePredicted(tournament, bracket);
  const standings = allStandings(tournament, feed);
  const detail: ScoreLine[] = [];

  // --- Group stage: correct qualifiers (who reached the Round of 32). ---
  const qualifiersHit = intersectionSize(
    predicted.reach["Round of 32"],
    actual.reach["Round of 32"],
  );
  const groupQualPoints = qualifiersHit * config.groupQualifier;
  if (qualifiersHit > 0) {
    detail.push({
      label: `${qualifiersHit} correct qualifier${qualifiersHit === 1 ? "" : "s"} to Round of 32`,
      points: groupQualPoints,
    });
  }

  // Exact group order bonus (only for groups that have finished).
  let exactBonus = 0;
  for (const g of tournament.groups) {
    if (!groupComplete(g, feed)) continue;
    const rows = standings[g.letter];
    const actualWinner = rows.find((r) => r.rank === 1)?.team;
    const actualRunner = rows.find((r) => r.rank === 2)?.team;
    const order = bracket.groupOrder[g.letter];
    if (order && order[0] === actualWinner && order[1] === actualRunner) {
      exactBonus += config.exactGroupOrder;
      detail.push({ label: `Group ${g.letter}: exact top-2 order`, points: config.exactGroupOrder });
    }
  }
  const groupPoints = groupQualPoints + exactBonus;

  // --- Knockout: teams correctly predicted to reach each round. ---
  let knockoutPoints = 0;
  for (const round of SCORED_ROUNDS) {
    const per = config.reachRound[round] ?? 0;
    if (!per) continue;
    const hit = intersectionSize(predicted.reach[round], actual.reach[round]);
    if (hit > 0) {
      const pts = hit * per;
      knockoutPoints += pts;
      detail.push({ label: `${hit} team${hit === 1 ? "" : "s"} correct to reach ${round}`, points: pts });
    }
  }

  // --- Final-standings bonuses. ---
  let bonusPoints = 0;
  if (actual.champion && predicted.champion === actual.champion) {
    bonusPoints += config.champion;
    detail.push({ label: `Champion: ${actual.champion}`, points: config.champion });
  }
  if (actual.runnerUp && predicted.runnerUp === actual.runnerUp) {
    bonusPoints += config.runnerUp;
    detail.push({ label: `Runner-up: ${actual.runnerUp}`, points: config.runnerUp });
  }
  if (actual.third && predicted.third === actual.third) {
    bonusPoints += config.thirdPlace;
    detail.push({ label: `Third place: ${actual.third}`, points: config.thirdPlace });
  }

  return {
    bracketId: bracket.id,
    name: bracket.name,
    total: groupPoints + knockoutPoints + bonusPoints,
    breakdown: { groupPoints, knockoutPoints, bonusPoints },
    detail,
  };
}

/** Score every bracket and return a leaderboard (highest first). */
export function leaderboard(
  tournament: Tournament,
  feed: FeedData,
  brackets: Bracket[],
  config: ScoringConfig = DEFAULT_SCORING,
): BracketScore[] {
  return brackets
    .map((b) => scoreBracket(tournament, feed, b, config))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

/** Convenience re-export used by the standings tab. */
export type { StandingRow };
