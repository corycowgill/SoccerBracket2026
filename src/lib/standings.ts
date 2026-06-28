import type {
  Bracket,
  FeedData,
  FeedMatch,
  Group,
  KnockoutRound,
  StandingRow,
  Tournament,
} from "../types";
import { KNOCKOUT_ROUNDS } from "../types";
import {
  isPlayed,
  matchGoals,
  matchWinnerIndex,
  thirdPlaceGroups,
} from "./feed";

// ---------------------------------------------------------------------------
// Group standings (used for the REAL tournament, computed from feed scores)
// ---------------------------------------------------------------------------

function emptyRow(team: string): StandingRow {
  return {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
    rank: 0,
  };
}

/** Compute a single group's table from the played feed matches. */
export function computeGroupStandings(
  group: Group,
  groupMatches: FeedMatch[],
): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const t of group.teams) rows.set(t, emptyRow(t));

  const played = groupMatches.filter(
    (m) => m.group === group.name && isPlayed(m),
  );
  for (const m of played) {
    const goals = matchGoals(m.score);
    if (!goals) continue;
    const [g1, g2] = goals;
    const r1 = rows.get(m.team1);
    const r2 = rows.get(m.team2);
    if (!r1 || !r2) continue;
    r1.played++;
    r2.played++;
    r1.gf += g1;
    r1.ga += g2;
    r2.gf += g2;
    r2.ga += g1;
    if (g1 > g2) {
      r1.won++;
      r2.lost++;
      r1.points += 3;
    } else if (g1 < g2) {
      r2.won++;
      r1.lost++;
      r2.points += 3;
    } else {
      r1.drawn++;
      r2.drawn++;
      r1.points++;
      r2.points++;
    }
  }

  const ordered = [...rows.values()].sort(compareRows(played));
  ordered.forEach((r, i) => {
    r.gd = r.gf - r.ga;
    r.rank = i + 1;
  });
  return ordered;
}

/**
 * FIFA group ordering: points, then goal difference, then goals for, then
 * head-to-head among tied teams, then (as a stable fallback) team name.
 */
function compareRows(played: FeedMatch[]) {
  return (a: StandingRow, b: StandingRow): number => {
    if (b.points !== a.points) return b.points - a.points;
    const agd = a.gf - a.ga;
    const bgd = b.gf - b.ga;
    if (bgd !== agd) return bgd - agd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    const h2h = headToHead(a.team, b.team, played);
    if (h2h !== 0) return h2h;
    return a.team.localeCompare(b.team);
  };
}

/** Head-to-head result between two teams (negative => a ranks higher). */
function headToHead(a: string, b: string, played: FeedMatch[]): number {
  for (const m of played) {
    const involves =
      (m.team1 === a && m.team2 === b) || (m.team1 === b && m.team2 === a);
    if (!involves) continue;
    const w = matchWinnerIndex(m.score);
    if (w === null) return 0;
    const winner = w === 0 ? m.team1 : m.team2;
    if (winner === a) return -1;
    if (winner === b) return 1;
  }
  return 0;
}

/** Compute every group's table. */
export function allStandings(
  tournament: Tournament,
  feed: FeedData,
): Record<string, StandingRow[]> {
  const out: Record<string, StandingRow[]> = {};
  for (const g of tournament.groups) {
    out[g.letter] = computeGroupStandings(g, feed.matches);
  }
  return out;
}

/** Has a group finished all of its matches? */
export function groupComplete(group: Group, feed: FeedData): boolean {
  const matches = feed.matches.filter((m) => m.group === group.name);
  return matches.length > 0 && matches.every(isPlayed);
}

/** Has the entire group stage finished (every group complete)? */
export function groupStageComplete(tournament: Tournament, feed: FeedData): boolean {
  return tournament.groups.every((g) => groupComplete(g, feed));
}

// ---------------------------------------------------------------------------
// Reach-by-round: the set of teams that reach each knockout round.
// Computed identically in spirit for the REAL tournament and a PREDICTION,
// which makes scoring fair and slot-assignment-independent.
// ---------------------------------------------------------------------------

export interface BracketResolution {
  reach: Record<KnockoutRound, Set<string>>;
  champion?: string;
  runnerUp?: string;
  third?: string;
}

function emptyReach(): Record<KnockoutRound, Set<string>> {
  const r = {} as Record<KnockoutRound, Set<string>>;
  for (const round of KNOCKOUT_ROUNDS) r[round] = new Set();
  return r;
}

/**
 * REAL tournament: a team "reaches" a round once the feed shows it as a real
 * participant of that round (the feed fills in actual team names as games are
 * played). No placeholder resolution needed.
 */
export function resolveActual(
  _tournament: Tournament,
  feed: FeedData,
): BracketResolution {
  const reach = emptyReach();
  const byNum = new Map<number, FeedMatch>();
  const knockoutFeed = feed.matches.filter((m) =>
    KNOCKOUT_ROUNDS.includes(m.round as KnockoutRound),
  );
  for (const m of knockoutFeed) {
    // The third-place play-off and final may omit `num` in the feed.
    const num =
      m.num ??
      (m.round === "Final" ? 104 : m.round === "Match for third place" ? 103 : undefined);
    if (num !== undefined) byNum.set(num, m);
    // A real (non-placeholder) team named in a round has reached that round.
    for (const t of [m.team1, m.team2]) {
      if (isRealTeam(t)) reach[m.round as KnockoutRound].add(t);
    }
  }

  const final = byNum.get(104);
  const thirdMatch = byNum.get(103);
  if (final && isPlayed(final)) {
    const w = matchWinnerIndex(final.score);
    if (w !== null) {
      const champ = w === 0 ? final.team1 : final.team2;
      const runner = w === 0 ? final.team2 : final.team1;
      if (isRealTeam(champ)) return finalize(reach, champ, runner, thirdMatch);
      return finalize(reach, undefined, undefined, thirdMatch);
    }
  }
  return finalize(reach, undefined, undefined, thirdMatch);
}

function finalize(
  reach: Record<KnockoutRound, Set<string>>,
  champion: string | undefined,
  runnerUp: string | undefined,
  thirdMatch: FeedMatch | undefined,
): BracketResolution {
  let third: string | undefined;
  if (thirdMatch && isPlayed(thirdMatch)) {
    const w = matchWinnerIndex(thirdMatch.score);
    if (w !== null) {
      const t = w === 0 ? thirdMatch.team1 : thirdMatch.team2;
      if (isRealTeam(t)) third = t;
    }
  }
  return { reach, champion, runnerUp, third };
}

function isRealTeam(name: string): boolean {
  // Placeholders look like "1A", "2B", "W74", "L101", "3A/B/C/D/F".
  return !/^([12][A-L]|W\d+|L\d+|3[A-L](\/[A-L])+)$/i.test(name.trim());
}

/** Actual knockout outcomes from the feed: per-match winners, eliminated teams, champion. */
export interface ActualKnockout {
  winners: Record<number, string>; // match num -> winning team (played matches only)
  eliminated: Set<string>; // teams knocked out of the tournament
  champion?: string;
}

export function actualKnockout(feed: FeedData): ActualKnockout {
  const winners: Record<number, string> = {};
  const eliminated = new Set<string>();
  let champion: string | undefined;

  for (const m of feed.matches) {
    if (!KNOCKOUT_ROUNDS.includes(m.round as KnockoutRound)) continue;
    if (!isPlayed(m)) continue;
    const w = matchWinnerIndex(m.score);
    if (w === null) continue;
    const num =
      m.num ??
      (m.round === "Final" ? 104 : m.round === "Match for third place" ? 103 : undefined);
    const winner = w === 0 ? m.team1 : m.team2;
    const loser = w === 0 ? m.team2 : m.team1;
    if (num !== undefined && isRealTeam(winner)) winners[num] = winner;
    // The third-place play-off loser is already out; either way the loser is eliminated.
    if (isRealTeam(loser)) eliminated.add(loser);
    if (num === 104 && isRealTeam(winner)) champion = winner;
  }
  return { winners, eliminated, champion };
}


// ---------------------------------------------------------------------------
// Predicted bracket resolution
// ---------------------------------------------------------------------------

interface PredictedBracket extends BracketResolution {
  /** Resolved teams for each knockout match: [team1, team2] (may be empty strings). */
  matchups: Record<number, [string, string]>;
}

/**
 * Resolve a family member's predicted bracket: flow their group order +
 * third-place picks + knockout winner picks through the whole tree.
 */
export function resolvePredicted(
  tournament: Tournament,
  bracket: Bracket,
): PredictedBracket {
  const reach = emptyReach();
  const matchups: Record<number, [string, string]> = {};

  // 1. Group placements from predicted order.
  const groupWinner: Record<string, string> = {};
  const runnerUp: Record<string, string> = {};
  for (const g of tournament.groups) {
    const order = bracket.groupOrder[g.letter] ?? g.teams;
    groupWinner[g.letter] = order[0];
    runnerUp[g.letter] = order[1];
  }

  // 2. Assign chosen third-place teams to the eligible R32 slots.
  const thirdSlotTeam = assignThirdPlace(tournament, bracket);

  // 3. Walk knockout matches in order, resolving teams and applying picks.
  const winnerOf: Record<number, string> = {};
  const loserOf: Record<number, string> = {};
  const ordered = [...tournament.knockout].sort((a, b) => a.num - b.num);
  for (const km of ordered) {
    const t1 = resolveSlot(km.team1.raw, { groupWinner, runnerUp, thirdSlotTeam, winnerOf, loserOf });
    const t2 = resolveSlot(km.team2.raw, { groupWinner, runnerUp, thirdSlotTeam, winnerOf, loserOf });
    matchups[km.num] = [t1, t2];
    if (t1) reach[km.round].add(t1);
    if (t2) reach[km.round].add(t2);

    const pick = bracket.knockoutPick[km.num];
    let winner = "";
    if (pick && (pick === t1 || pick === t2)) winner = pick;
    else if (t1 && t2) winner = t1; // sensible default until the user picks
    if (winner) {
      winnerOf[km.num] = winner;
      loserOf[km.num] = winner === t1 ? t2 : t1;
    }
  }

  const champion = winnerOf[104] || undefined;
  const runnerUpFinal = loserOf[104] || undefined;
  const third = winnerOf[103] || undefined;
  return { reach, matchups, champion, runnerUp: runnerUpFinal, third };
}

interface SlotContext {
  groupWinner: Record<string, string>;
  runnerUp: Record<string, string>;
  thirdSlotTeam: Record<string, string>; // raw third-place placeholder -> team
  winnerOf: Record<number, string>;
  loserOf: Record<number, string>;
}

function resolveSlot(raw: string, ctx: SlotContext): string {
  const v = raw.trim();
  let m: RegExpMatchArray | null;
  if ((m = v.match(/^1([A-L])$/i))) return ctx.groupWinner[m[1].toUpperCase()] ?? "";
  if ((m = v.match(/^2([A-L])$/i))) return ctx.runnerUp[m[1].toUpperCase()] ?? "";
  if (/^3[A-L](\/[A-L])+$/i.test(v)) return ctx.thirdSlotTeam[v] ?? "";
  if ((m = v.match(/^W(\d+)$/i))) return ctx.winnerOf[Number(m[1])] ?? "";
  if ((m = v.match(/^L(\d+)$/i))) return ctx.loserOf[Number(m[1])] ?? "";
  return v; // already a real team name
}

/**
 * Assign the user's 8 chosen third-place teams to the 8 third-place R32 slots,
 * respecting each slot's eligible groups. Uses bipartite matching so every slot
 * gets a team from an eligible group when a perfect matching exists.
 */
export function assignThirdPlace(
  tournament: Tournament,
  bracket: Bracket,
): Record<string, string> {
  // Map each third-place team to its group letter.
  const teamGroup: Record<string, string> = {};
  for (const g of tournament.groups) {
    const order = bracket.groupOrder[g.letter] ?? g.teams;
    if (order[2]) teamGroup[order[2]] = g.letter;
  }
  const chosen = bracket.thirdPlaceTeams.filter((t) => teamGroup[t]);

  // The third-place slots (R32 matches whose team1/team2 is a "3.." placeholder).
  const slots: { raw: string; eligible: Set<string> }[] = [];
  for (const km of tournament.knockout) {
    for (const ref of [km.team1, km.team2]) {
      if (ref.kind === "thirdPlace") {
        slots.push({ raw: ref.raw, eligible: new Set(thirdPlaceGroups(ref.raw)) });
      }
    }
  }

  // Bipartite matching (Kuhn's algorithm): slots <- teams.
  const slotForTeam: Record<string, number> = {};
  const teamForSlot: (string | null)[] = slots.map(() => null);

  const tryAssign = (team: string, seen: Set<number>): boolean => {
    for (let s = 0; s < slots.length; s++) {
      if (!slots[s].eligible.has(teamGroup[team])) continue;
      if (seen.has(s)) continue;
      seen.add(s);
      const occupant = teamForSlot[s];
      if (occupant === null || tryAssign(occupant, seen)) {
        teamForSlot[s] = team;
        slotForTeam[team] = s;
        return true;
      }
    }
    return false;
  };

  for (const team of chosen) tryAssign(team, new Set());

  const result: Record<string, string> = {};
  slots.forEach((slot, i) => {
    const team = teamForSlot[i];
    if (team) result[slot.raw] = team;
  });
  return result;
}

// ---------------------------------------------------------------------------
// Real knockout bracket (used once the group stage is complete): the actual
// qualified teams are slotted into the Round of 32, and the player picks winners
// from there. Their picks flow forward to populate later rounds.
// ---------------------------------------------------------------------------

export interface ActualPlayBracket {
  matchups: Record<number, [string, string]>; // num -> [team1, team2]
  pickWinner: Record<number, string>; // num -> the player's explicit, valid winner pick
  champion?: string; // the player's final (match 104) pick
  seeded: boolean; // whether the real Round of 32 line-up is known yet
}

/**
 * Build a player's knockout bracket on the REAL Round of 32 line-up. Group
 * winners/runners-up come from the actual standings; third-place slots come from
 * the feed's Round-of-32 fixtures. The player's picks flow forward (W##/L##).
 */
export function resolveKnockoutActual(
  tournament: Tournament,
  feed: FeedData,
  bracket: Bracket,
): ActualPlayBracket {
  const standings = allStandings(tournament, feed);
  const groupRank = (letter: string, rank: number) =>
    standings[letter]?.find((r) => r.rank === rank)?.team ?? "";

  // Seed Round-of-32 placeholders from the feed's real team names.
  const feedSeed: Record<string, string> = {};
  const r32ByNum = new Map<number, FeedMatch>();
  for (const m of feed.matches) {
    if (m.round === "Round of 32" && m.num !== undefined) r32ByNum.set(m.num, m);
  }
  let seeded = false;
  for (const km of tournament.knockout) {
    if (km.round !== "Round of 32") continue;
    const fm = r32ByNum.get(km.num);
    if (!fm) continue;
    if (isRealTeam(fm.team1)) {
      feedSeed[km.team1.raw] = fm.team1;
      seeded = true;
    }
    if (isRealTeam(fm.team2)) {
      feedSeed[km.team2.raw] = fm.team2;
      seeded = true;
    }
  }

  const winnerOf: Record<number, string> = {};
  const loserOf: Record<number, string> = {};
  const pickWinner: Record<number, string> = {};
  const matchups: Record<number, [string, string]> = {};

  const resolveSlot = (raw: string): string => {
    const v = raw.trim();
    let m: RegExpMatchArray | null;
    if ((m = v.match(/^1([A-L])$/i))) return feedSeed[v] || groupRank(m[1].toUpperCase(), 1);
    if ((m = v.match(/^2([A-L])$/i))) return feedSeed[v] || groupRank(m[1].toUpperCase(), 2);
    if (/^3[A-L](\/[A-L])+$/i.test(v)) return feedSeed[v] || ""; // third-place slots rely on the feed
    if ((m = v.match(/^W(\d+)$/i))) return winnerOf[Number(m[1])] ?? "";
    if ((m = v.match(/^L(\d+)$/i))) return loserOf[Number(m[1])] ?? "";
    return v;
  };

  for (const km of [...tournament.knockout].sort((a, b) => a.num - b.num)) {
    const t1 = resolveSlot(km.team1.raw);
    const t2 = resolveSlot(km.team2.raw);
    matchups[km.num] = [t1, t2];
    const pick = bracket.knockoutPick[km.num];
    let winner = "";
    if (pick && (pick === t1 || pick === t2)) {
      winner = pick;
      pickWinner[km.num] = pick;
    } else if (t1 && t2) {
      winner = t1; // default only so later rounds can render; not a scored pick
    }
    if (winner) {
      winnerOf[km.num] = winner;
      loserOf[km.num] = winner === t1 ? t2 : t1;
    }
  }

  return { matchups, pickWinner, champion: pickWinner[104], seeded };
}

/** Third-placed team of each group, ranked across groups (best first) for the REAL tournament. */
export function rankThirdPlace(
  standings: Record<string, StandingRow[]>,
): { team: string; group: string; row: StandingRow }[] {
  const thirds: { team: string; group: string; row: StandingRow }[] = [];
  for (const [letter, rows] of Object.entries(standings)) {
    const r = rows.find((x) => x.rank === 3);
    if (r) thirds.push({ team: r.team, group: letter, row: r });
  }
  thirds.sort((a, b) => {
    if (b.row.points !== a.row.points) return b.row.points - a.row.points;
    if (b.row.gd !== a.row.gd) return b.row.gd - a.row.gd;
    if (b.row.gf !== a.row.gf) return b.row.gf - a.row.gf;
    return a.team.localeCompare(b.team);
  });
  return thirds;
}
