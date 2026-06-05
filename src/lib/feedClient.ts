import type { FeedData } from "../types";
import snapshot from "../data/wc2026-snapshot.json";

const FEED_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const CACHE_KEY = "wc2026-feed-cache";

export interface FeedState {
  data: FeedData;
  source: "live" | "cache" | "bundled";
  fetchedAt: number | null;
}

/** The bundled snapshot ships with the app so it works offline / on first load. */
export function bundledFeed(): FeedData {
  return snapshot as FeedData;
}

/** Load the best feed we have without hitting the network (cache, else bundled). */
export function loadCachedFeed(): FeedState {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { data: FeedData; fetchedAt: number };
      if (parsed?.data?.matches?.length) {
        return { data: parsed.data, source: "cache", fetchedAt: parsed.fetchedAt };
      }
    }
  } catch {
    /* ignore */
  }
  return { data: bundledFeed(), source: "bundled", fetchedAt: null };
}

/**
 * Fetch the latest results from the openfootball feed. Falls back to cached /
 * bundled data on any failure (offline, CORS, rate limit) so the app never breaks.
 */
export async function refreshFeed(): Promise<FeedState> {
  try {
    const res = await fetch(FEED_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as FeedData;
    if (!data?.matches?.length) throw new Error("Empty feed");
    const fetchedAt = Date.now();
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt }));
    } catch {
      /* storage full / unavailable — still return the live data */
    }
    return { data, source: "live", fetchedAt };
  } catch (err) {
    console.warn("Live feed refresh failed, using cached/bundled data.", err);
    return loadCachedFeed();
  }
}
