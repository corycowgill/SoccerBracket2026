import type {
  Bracket,
  BracketScore,
  FeedData,
  ScoreLine,
  ScoringConfig,
  StandingRow,
  Tournament,
} from "../types";
import {
  actualKnockout,
  allStandings,
  groupComplete,
  groupStageComplete,
  resolveActual,
  resolvePredicted,
  resolveKnockoutActual,
} from "./standings";

/**
 * Default scoring. Group-stage accuracy is locked in once the groups finish;
 * knockout points are then earned per correctly-picked match winner, weighted by
 * how deep the round is. All values live here so they are easy to tweak.
 */
export const DEFAULT_SCORING: ScoringConfig = {
  groupQualifier: 4, // each team you sent to the Round of 32 that actually got there
  exactGroupOrder: 3, // bonus per group where you nailed BOTH 1st and 2nd
  knockoutRound: {
    "Round of 32": 5,
    "Round of 16": 8,
    "Quarter-final": 12,
    "Semi-final": 16,
    "Match for third place": 8,
    Final: 20,
  },
  champion: 25, // bonus on top of the Final win for naming the champion
};

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

  // --- Group stage: correct qualifiers (who the player predicted to reach R32). ---
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

  // --- Knockout: a point per correctly-picked match winner on the real bracket. ---
  let knockoutPoints = 0;
  let bonusPoints = 0;
  if (groupStageComplete(tournament, feed)) {
    const play = resolveKnockoutActual(tournament, feed, bracket);
    const ak = actualKnockout(feed);
    for (const km of tournament.knockout) {
      const winner = ak.winners[km.num];
      if (winner && play.pickWinner[km.num] === winner) {
        const pts = config.knockoutRound[km.round] ?? 0;
        knockoutPoints += pts;
        detail.push({ label: `${km.round}: picked ${winner} ✓`, points: pts });
      }
    }
    if (ak.champion && play.champion === ak.champion) {
      bonusPoints += config.champion;
      detail.push({ label: `Champion bonus: ${ak.champion}`, points: config.champion });
    }
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
