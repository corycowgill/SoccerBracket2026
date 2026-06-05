import { describe, expect, it } from "vitest";
import type { Bracket, FeedData, FeedMatch } from "../types";
import { buildTournament } from "./feed";
import { bundledFeed } from "./feedClient";
import { allStandings, assignThirdPlace, resolvePredicted } from "./standings";
import { scoreBracket } from "./scoring";

const tournament = buildTournament(bundledFeed());

/** Helper: set a score on a group match between two named teams. */
function withGroupScore(
  feed: FeedData,
  group: string,
  team1: string,
  team2: string,
  s1: number,
  s2: number,
): FeedData {
  const matches = feed.matches.map((m) => {
    if (m.group === group && m.team1 === team1 && m.team2 === team2) {
      return { ...m, score: { ft: [s1, s2] as [number, number] } };
    }
    return m;
  });
  return { ...feed, matches };
}

describe("tournament skeleton", () => {
  it("has 12 groups of 4 and 32 knockout matches", () => {
    expect(tournament.groups).toHaveLength(12);
    for (const g of tournament.groups) expect(g.teams).toHaveLength(4);
    expect(tournament.knockout).toHaveLength(32);
  });

  it("wires the final as match 104 and third-place as 103", () => {
    const nums = tournament.knockout.map((k) => k.num);
    expect(nums).toContain(103);
    expect(nums).toContain(104);
  });
});

describe("group standings", () => {
  it("ranks by points then goal difference", () => {
    // Group A: Mexico, South Africa, South Korea, Czech Republic.
    let feed = bundledFeed();
    // Mexico beats everyone; South Korea beats the other two; etc.
    feed = withGroupScore(feed, "Group A", "Mexico", "South Africa", 3, 0);
    feed = withGroupScore(feed, "Group A", "Mexico", "South Korea", 1, 0);
    feed = withGroupScore(feed, "Group A", "Czech Republic", "Mexico", 0, 2);
    const table = allStandings(tournament, feed)["A"];
    expect(table[0].team).toBe("Mexico");
    expect(table[0].points).toBe(9);
    expect(table[0].rank).toBe(1);
  });
});

describe("predicted bracket resolution", () => {
  const bracket = makeBracket();

  it("puts exactly 32 teams in the Round of 32", () => {
    const r = resolvePredicted(tournament, bracket);
    expect(r.reach["Round of 32"].size).toBe(32);
  });

  it("halves the field each subsequent round and yields a champion", () => {
    const r = resolvePredicted(tournament, bracket);
    expect(r.reach["Round of 16"].size).toBe(16);
    expect(r.reach["Quarter-final"].size).toBe(8);
    expect(r.reach["Semi-final"].size).toBe(4);
    expect(r.reach["Final"].size).toBe(2);
    expect(r.champion).toBeTruthy();
  });

  it("assigns every chosen third-place team to an eligible slot", () => {
    const slots = assignThirdPlace(tournament, bracket);
    expect(Object.keys(slots)).toHaveLength(8);
    expect(new Set(Object.values(slots)).size).toBe(8); // no team used twice
  });
});

describe("scoring", () => {
  it("awards qualifier points when a predicted top team actually advances", () => {
    const bracket = makeBracket();
    // Make Mexico clearly win Group A in reality.
    let feed = bundledFeed();
    feed = withGroupScore(feed, "Group A", "Mexico", "South Africa", 3, 0);
    feed = withGroupScore(feed, "Group A", "Mexico", "South Korea", 2, 0);
    feed = withGroupScore(feed, "Group A", "Czech Republic", "Mexico", 0, 1);
    feed = withGroupScore(feed, "Group A", "South Korea", "Czech Republic", 2, 0);
    feed = withGroupScore(feed, "Group A", "South Africa", "South Korea", 0, 1);
    feed = withGroupScore(feed, "Group A", "Czech Republic", "South Africa", 1, 1);
    // Promote the two Group A winners into the Round of 32 feed so they "reached" it.
    feed = appearInRound(feed, "Round of 32", "Mexico");
    feed = appearInRound(feed, "Round of 32", "South Korea");

    const score = scoreBracket(tournament, feed, bracket);
    expect(score.total).toBeGreaterThan(0);
  });

  it("gives the champion bonus for a correct final", () => {
    const bracket = makeBracket();
    const champ = resolvePredicted(tournament, bracket).champion!;
    let feed = bundledFeed();
    feed = setFinal(feed, champ, "Some Other Team", 2, 0);
    const score = scoreBracket(tournament, feed, bracket);
    // champion(30) + finalists reaching the Final(18*?) -> at least the champion bonus.
    expect(score.breakdown.bonusPoints).toBeGreaterThanOrEqual(30);
  });
});

// ---- test helpers ----

function makeBracket(): Bracket {
  const groupOrder: Record<string, string[]> = {};
  const thirdPlaceTeams: string[] = [];
  tournament.groups.forEach((g, i) => {
    groupOrder[g.letter] = [...g.teams];
    if (i < 8) thirdPlaceTeams.push(g.teams[2]); // pick first 8 groups' 3rd team
  });
  return {
    id: "test",
    name: "Tester",
    createdAt: 0,
    updatedAt: 0,
    groupOrder,
    thirdPlaceTeams,
    knockoutPick: {},
  };
}

function appearInRound(feed: FeedData, round: string, team: string): FeedData {
  const match: FeedMatch = { round, num: 9000 + Math.floor(Math.random() * 1000), team1: team, team2: "Placeholder XI", score: { ft: [1, 0] } };
  return { ...feed, matches: [...feed.matches, match] };
}

function setFinal(feed: FeedData, t1: string, t2: string, s1: number, s2: number): FeedData {
  const matches = feed.matches.map((m) =>
    m.round === "Final" ? { ...m, team1: t1, team2: t2, score: { ft: [s1, s2] as [number, number] } } : m,
  );
  return { ...feed, matches };
}
