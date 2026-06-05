import type {
  FeedData,
  FeedMatch,
  FeedScore,
  Group,
  KnockoutMatch,
  KnockoutRound,
  SlotRef,
  Tournament,
} from "../types";
import { KNOCKOUT_ROUNDS } from "../types";

const KNOCKOUT_ROUND_SET = new Set<string>(KNOCKOUT_ROUNDS);

/** Is this feed match part of the group stage? */
export function isGroupMatch(m: FeedMatch): boolean {
  return !!m.group;
}

/** Parse a knockout team placeholder into a structured slot reference. */
export function parseSlot(raw: string): SlotRef {
  const value = raw.trim();
  // Winner of a match: "W74"
  if (/^W\d+$/i.test(value)) return { raw: value, kind: "winner" };
  // Loser of a match: "L101"
  if (/^L\d+$/i.test(value)) return { raw: value, kind: "loser" };
  // Third-place combo: "3A/B/C/D/F"
  if (/^3[A-L](\/[A-L])+$/i.test(value)) return { raw: value, kind: "thirdPlace" };
  // Group placement: "1A", "2B" (winner / runner-up of a group)
  if (/^[12][A-L]$/i.test(value)) return { raw: value, kind: "groupPlace" };
  // Otherwise it's an actual team name (the feed fills these in once played).
  return { raw: value, kind: "team", team: value };
}

/** Eligible group letters encoded in a third-place placeholder ("3A/B/C/D/F" -> [A,B,C,D,F]). */
export function thirdPlaceGroups(raw: string): string[] {
  return raw
    .replace(/^3/, "")
    .split("/")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

/** Build the static tournament skeleton (groups + knockout wiring) from feed data. */
export function buildTournament(feed: FeedData): Tournament {
  const groupMatches = feed.matches.filter(isGroupMatch);
  const knockoutFeed = feed.matches.filter((m) => KNOCKOUT_ROUND_SET.has(m.round));

  // Derive groups and their teams.
  const groupTeams = new Map<string, Set<string>>();
  for (const m of groupMatches) {
    const g = m.group as string;
    if (!groupTeams.has(g)) groupTeams.set(g, new Set());
    groupTeams.get(g)!.add(m.team1);
    groupTeams.get(g)!.add(m.team2);
  }
  const groups: Group[] = [...groupTeams.keys()]
    .sort()
    .map((name) => ({
      letter: name.replace(/^Group\s+/i, "").trim(),
      name,
      teams: [...groupTeams.get(name)!].sort(),
    }));

  // The third-place and final matches in the feed sometimes lack `num`; assign
  // the canonical numbers (third-place = 103, final = 104) so wiring is stable.
  const knockout: KnockoutMatch[] = knockoutFeed.map((m) => {
    let num = m.num;
    if (num === undefined) {
      num = m.round === "Final" ? 104 : 103; // "Match for third place" -> 103
    }
    return {
      num,
      round: m.round as KnockoutRound,
      team1: parseSlot(m.team1),
      team2: parseSlot(m.team2),
      date: m.date,
      ground: m.ground,
    };
  });
  knockout.sort((a, b) => a.num - b.num);

  return { groups, groupMatches, knockout };
}

/** Decide the winner index (0 or 1) of a played match, or null if not yet decided. */
export function matchWinnerIndex(score?: FeedScore): 0 | 1 | null {
  if (!score) return null;
  // Penalties decide knockouts when level after extra time.
  if (score.p) return score.p[0] === score.p[1] ? null : score.p[0] > score.p[1] ? 0 : 1;
  const final = score.et ?? score.ft;
  if (!final) return null;
  if (final[0] === final[1]) return null; // a draw (valid in groups; unresolved for knockout)
  return final[0] > final[1] ? 0 : 1;
}

/** Has this match been played (a final-time score exists)? */
export function isPlayed(m: FeedMatch): boolean {
  return !!(m.score && (m.score.ft || m.score.et));
}

/** Goals from a played match as [team1Goals, team2Goals], using extra time if present. */
export function matchGoals(score?: FeedScore): [number, number] | null {
  if (!score) return null;
  const g = score.et ?? score.ft;
  return g ? [g[0], g[1]] : null;
}
