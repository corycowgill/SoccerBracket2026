import type { FeedData, FeedMatch } from "../types";

const KEY = "wc2026-manual-results";

/** A manually entered score for one match, keyed by a stable match id. */
export interface ManualResult {
  team1Goals: number;
  team2Goals: number;
  // Optional penalty result for knockout ties that finish level.
  pens1?: number;
  pens2?: number;
}

export type ManualResults = Record<string, ManualResult>;

/** Stable identity for a match so manual results survive feed refreshes. */
export function matchKey(m: FeedMatch): string {
  if (m.num !== undefined) return `num:${m.num}`;
  if (m.group) return `grp:${m.group}:${m.team1}-${m.team2}`;
  return `ko:${m.round}:${m.team1}-${m.team2}`;
}

export function loadManualResults(): ManualResults {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ManualResults) : {};
  } catch {
    return {};
  }
}

export function saveManualResults(results: ManualResults): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(results));
  } catch (err) {
    console.error("Failed to save manual results", err);
  }
}

/**
 * Overlay manual results onto feed data. Live feed scores win when present;
 * manual entries fill the gaps (and let you play ahead of the feed).
 */
export function applyManualResults(feed: FeedData, manual: ManualResults): FeedData {
  if (!Object.keys(manual).length) return feed;
  const matches = feed.matches.map((m) => {
    const hasLive = !!(m.score && (m.score.ft || m.score.et));
    if (hasLive) return m;
    const entry = manual[matchKey(m)];
    if (!entry) return m;
    const score: FeedMatch["score"] = {
      ft: [entry.team1Goals, entry.team2Goals],
    };
    if (entry.pens1 !== undefined && entry.pens2 !== undefined) {
      score.p = [entry.pens1, entry.pens2];
    }
    return { ...m, score };
  });
  return { ...feed, matches };
}
