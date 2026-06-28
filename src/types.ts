// Core domain types for the World Cup 2026 family bracket app.

/** A raw match as it appears in the openfootball feed (and our bundled snapshot). */
export interface FeedMatch {
  round: string; // e.g. "Matchday 1", "Round of 32", "Final"
  num?: number; // sequential match number (knockout matches have these: 73..104)
  date?: string;
  time?: string;
  team1: string; // a real team name, or a placeholder like "2A", "W74", "3A/B/C/D/F", "L101"
  team2: string;
  group?: string; // e.g. "Group A" for group-stage matches
  ground?: string;
  score?: FeedScore;
}

/** Score block from the feed. Knockout winners are decided by p (penalties) when present. */
export interface FeedScore {
  ft?: [number, number]; // full time
  ht?: [number, number]; // half time
  et?: [number, number]; // after extra time
  p?: [number, number]; // penalty shootout
}

export interface FeedData {
  name: string;
  matches: FeedMatch[];
}

/** One of the 12 groups, with its four drawn teams. */
export interface Group {
  letter: string; // "A".."L"
  name: string; // "Group A"
  teams: string[]; // four team names
}

/** A knockout slot reference resolved into a concrete team (or left as a label). */
export interface SlotRef {
  raw: string; // original placeholder e.g. "2A", "W74", "3A/B/C/D/F", "L101"
  kind: "team" | "groupPlace" | "thirdPlace" | "winner" | "loser";
  team?: string; // resolved team name (when known)
}

/** A knockout fixture in the tournament skeleton. */
export interface KnockoutMatch {
  num: number;
  round: KnockoutRound;
  team1: SlotRef;
  team2: SlotRef;
  date?: string;
  ground?: string;
}

export type KnockoutRound =
  | "Round of 32"
  | "Round of 16"
  | "Quarter-final"
  | "Semi-final"
  | "Match for third place"
  | "Final";

export const KNOCKOUT_ROUNDS: KnockoutRound[] = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Match for third place",
  "Final",
];

/** The static tournament skeleton, derived once from the feed structure. */
export interface Tournament {
  groups: Group[];
  groupMatches: FeedMatch[];
  knockout: KnockoutMatch[];
}

/** A computed row in a group table. */
export interface StandingRow {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // goals for
  ga: number; // goals against
  gd: number; // goal difference
  points: number;
  rank: number; // 1..4 within the group (1 = winner)
}

/**
 * The set of results used to resolve a bracket. Keyed by group letter for group
 * standings, plus per-knockout-match winners. Used identically for the REAL
 * tournament and for any family member's PREDICTED tournament.
 */
export interface ResolvedTournament {
  standings: Record<string, StandingRow[]>; // group letter -> ordered rows
  // teamSlot maps a placeholder ("1A", "2B", "3rd-slot-id", "W74"...) to a team
  slotTeam: Record<string, string>;
  // winner of each knockout match number
  knockoutWinner: Record<number, string>;
  knockoutLoser: Record<number, string>;
  champion?: string;
}

// ---------- User predictions ----------

/**
 * A single family member's bracket. We store the minimal set of choices needed
 * to reconstruct the full bracket: predicted group order + predicted knockout
 * winners. Everything else is derived.
 */
export interface Bracket {
  id: string;
  name: string; // family member name e.g. "Mia"
  createdAt: number;
  updatedAt: number;
  // For each group letter, the predicted finishing order (array of 4 team names, 1st..4th).
  groupOrder: Record<string, string[]>;
  // The 8 third-placed teams the user predicts will advance to the Round of 32.
  thirdPlaceTeams: string[];
  // For each knockout match number, the team the user predicts to win.
  knockoutPick: Record<number, string>;
}

export interface StoredState {
  version: number;
  brackets: Bracket[];
}

// ---------- Scoring ----------

export interface ScoringConfig {
  groupQualifier: number; // points per correctly predicted advancing team (to Round of 32)
  exactGroupOrder: number; // bonus when the group's top-2 order is exactly right
  knockoutRound: Partial<Record<KnockoutRound, number>>; // points for correctly picking a knockout match winner, by round
  champion: number; // bonus for the correct champion
}

export interface BracketScore {
  bracketId: string;
  name: string;
  total: number;
  breakdown: {
    groupPoints: number;
    knockoutPoints: number;
    bonusPoints: number;
  };
  detail: ScoreLine[];
}

export interface ScoreLine {
  label: string;
  points: number;
}
