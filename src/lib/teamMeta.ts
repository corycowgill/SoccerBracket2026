// Map openfootball team names to ISO country codes for flagcdn.com flags.
// flagcdn supports UK subdivisions (gb-eng, gb-sct) which the World Cup needs.

const TEAM_CODE: Record<string, string> = {
  Mexico: "mx",
  "South Africa": "za",
  "South Korea": "kr",
  "Czech Republic": "cz",
  Canada: "ca",
  "Bosnia & Herzegovina": "ba",
  Qatar: "qa",
  Switzerland: "ch",
  Brazil: "br",
  Morocco: "ma",
  Haiti: "ht",
  Scotland: "gb-sct",
  USA: "us",
  Paraguay: "py",
  Australia: "au",
  Turkey: "tr",
  Germany: "de",
  "Curaçao": "cw",
  Curacao: "cw",
  "Ivory Coast": "ci",
  Ecuador: "ec",
  Netherlands: "nl",
  Japan: "jp",
  Sweden: "se",
  Tunisia: "tn",
  Belgium: "be",
  Egypt: "eg",
  Iran: "ir",
  "New Zealand": "nz",
  Spain: "es",
  "Cape Verde": "cv",
  "Saudi Arabia": "sa",
  Uruguay: "uy",
  France: "fr",
  Senegal: "sn",
  Iraq: "iq",
  Norway: "no",
  Argentina: "ar",
  Algeria: "dz",
  Austria: "at",
  Jordan: "jo",
  Portugal: "pt",
  "DR Congo": "cd",
  Uzbekistan: "uz",
  Colombia: "co",
  England: "gb-eng",
  Croatia: "hr",
  Ghana: "gh",
  Panama: "pa",
};

/** Flag image URL for a team, or null if we don't have a code (caller shows ⚽). */
export function flagUrl(team: string): string | null {
  const code = TEAM_CODE[team];
  return code ? `https://flagcdn.com/h40/${code}.png` : null;
}

// FIFA Men's World Ranking (June 2026) for the 48 qualified teams.
// Source: FIFA/Coca-Cola Men's World Ranking, June 2026.
const TEAM_RANK: Record<string, number> = {
  France: 1,
  Spain: 2,
  Argentina: 3,
  England: 4,
  Portugal: 5,
  Brazil: 6,
  Netherlands: 7,
  Morocco: 8,
  Belgium: 9,
  Germany: 10,
  Croatia: 11,
  Colombia: 13,
  Senegal: 14,
  Mexico: 15,
  USA: 16,
  Uruguay: 17,
  Japan: 18,
  Switzerland: 19,
  Iran: 21,
  Turkey: 22,
  Ecuador: 23,
  Austria: 24,
  "South Korea": 25,
  Australia: 27,
  Algeria: 28,
  Egypt: 29,
  Canada: 30,
  Norway: 31,
  Panama: 33,
  "Ivory Coast": 34,
  Sweden: 38,
  Paraguay: 40,
  "Czech Republic": 41,
  Scotland: 43,
  Tunisia: 44,
  "DR Congo": 46,
  Uzbekistan: 50,
  Qatar: 55,
  Iraq: 57,
  "South Africa": 60,
  "Saudi Arabia": 61,
  Jordan: 63,
  "Bosnia & Herzegovina": 65,
  "Cape Verde": 69,
  Ghana: 74,
  "Curaçao": 82,
  Haiti: 83,
  "New Zealand": 85,
};

/** FIFA world ranking for a team (lower is better), or undefined if unknown. */
export function teamRank(team: string): number | undefined {
  return TEAM_RANK[team];
}

/** Sort comparator that orders teams by FIFA rank (best first). */
export function byFifaRank(a: string, b: string): number {
  return (TEAM_RANK[a] ?? 999) - (TEAM_RANK[b] ?? 999);
}
