// Fetches live World Cup 2026 knockout results from football-data.org
// Free tier: 10 req/min. Cached server-side for 5 minutes.

const API_KEY = process.env.FOOTBALL_DATA_API_KEY ?? "";
const BASE = "https://api.football-data.org/v4";

type FDMatch = {
  id: number;
  stage: string;
  status: string;
  homeTeam: { id: number; tla: string; name: string; crest: string };
  awayTeam: { id: number; tla: string; name: string; crest: string };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime: { home: number | null; away: number | null };
  };
};

// Map football-data.org stage names → our round codes
const STAGE_MAP: Record<string, string> = {
  ROUND_OF_32: "R32",
  ROUND_OF_16: "R16",
  QUARTER_FINALS: "QF",
  SEMI_FINALS: "SF",
  THIRD_PLACE: "3RD",
  FINAL: "F",
};

let cache: { ts: number; data: Record<string, string> } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function fetchLiveResults(): Promise<Record<string, string>> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;
  if (!API_KEY) return {};

  try {
    const res = await fetch(`${BASE}/competitions/WC/matches?stage=KNOCKOUT`, {
      headers: { "X-Auth-Token": API_KEY },
      next: { revalidate: 300 },
    });
    if (!res.ok) return cache?.data ?? {};

    const json = await res.json();
    const matches: FDMatch[] = json.matches ?? [];

    const results: Record<string, string> = {};

    // We map by order within each stage — fragile but workable without
    // knowing FIFA's official match IDs. A more robust approach needs a
    // custom mapping table once the bracket is announced.
    matches
      .filter((m) => m.status === "FINISHED" && m.score.winner)
      .forEach((m) => {
        const winnerId =
          m.score.winner === "HOME_TEAM" ? m.homeTeam.tla : m.awayTeam.tla;
        // Store by football-data match id; the bracket resolveTeam will
        // need a secondary mapping. For now, store raw for display.
        results[`fd_${m.id}`] = winnerId;
      });

    cache = { ts: Date.now(), data: results };
    return results;
  } catch {
    return cache?.data ?? {};
  }
}
