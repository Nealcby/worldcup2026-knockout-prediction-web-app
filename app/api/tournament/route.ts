import { NextResponse } from "next/server";

const API_KEY = process.env.FOOTBALL_DATA_API_KEY ?? "";
const BASE = "https://api.football-data.org/v4";

let cache: { ts: number; data: unknown } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

function tlaToFlag(tla: string): string {
  // Maps FIFA TLA → ISO 3166-1 alpha-2 (2 letters → emoji flag via regional indicators)
  // ENG/SCO/WAL use GB (🇬🇧) — subdivision flag emojis don't render on Windows
  const MAP: Record<string, string> = {
    // Europe
    GER:"DE", FRA:"FR", ESP:"ES", ENG:"GB", POR:"PT", NED:"NL", ITA:"IT",
    BEL:"BE", SUI:"CH", CRO:"HR", DEN:"DK", AUT:"AT", SVK:"SK", SVN:"SI",
    POL:"PL", SRB:"RS", SWE:"SE", NOR:"NO", FIN:"FI", GRE:"GR", TUR:"TR",
    UKR:"UA", ROU:"RO", BUL:"BG", ISL:"IS", HUN:"HU", SCO:"GB", WAL:"GB",
    BIH:"BA", MNE:"ME", ALB:"AL", MKD:"MK", CZE:"CZ", LVA:"LV", LTU:"LT",
    EST:"EE", BLR:"BY", GEO:"GE", ARM:"AM", AZE:"AZ", KOS:"XK",
    // Americas
    USA:"US", MEX:"MX", CAN:"CA", BRA:"BR", ARG:"AR", COL:"CO", URU:"UY",
    CHI:"CL", ECU:"EC", PAR:"PY", VEN:"VE", PER:"PE", BOL:"BO",
    HTI:"HT", HAI:"HT",           // Haiti (API returns HAI)
    CUW:"CW",                      // Curaçao
    CRC:"CR", PAN:"PA", JAM:"JM", HON:"HN", GUA:"GT", SLV:"SV", TRI:"TT",
    // Africa
    MAR:"MA", SEN:"SN", NGA:"NG", EGY:"EG", CMR:"CM", CIV:"CI", GHA:"GH",
    ALG:"DZ", TUN:"TN", RSA:"ZA", ETH:"ET", MLI:"ML", GUI:"GN", MOZ:"MZ",
    ANG:"AO", COD:"CD", GAB:"GA", TOG:"TG", BEN:"BJ", GNB:"GW", CPV:"CV",
    ZIM:"ZW", ZAM:"ZM", UGA:"UG", KEN:"KE", TAN:"TZ", SUD:"SD", LIB:"LY",
    // Asia & Oceania
    JPN:"JP", KOR:"KR", IRN:"IR",
    SAU:"SA", KSA:"SA",            // Saudi Arabia (API returns KSA)
    AUS:"AU", QAT:"QA", UZB:"UZ",
    IDN:"ID", CHN:"CN", IND:"IN", THA:"TH", VIE:"VN", UAE:"AE", IRQ:"IQ",
    JOR:"JO", OMA:"OM", BHR:"BH", KWT:"KW", KGZ:"KG", TJK:"TJ", KAZ:"KZ",
    NZL:"NZ", FIJ:"FJ",
  };
  const iso = MAP[tla];
  if (!iso) return "🏳️";
  return iso.toUpperCase().split("").map((c) =>
    String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)
  ).join("");
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  if (!API_KEY) {
    return NextResponse.json({
      groups: [], slotMap: {}, liveResults: {},
      error: "Set FOOTBALL_DATA_API_KEY in .env.local to enable live data",
    });
  }

  try {
    const headers = { "X-Auth-Token": API_KEY };

    const [standingsRes, matchesRes] = await Promise.all([
      fetch(`${BASE}/competitions/WC/standings`, { headers }),
      fetch(`${BASE}/competitions/WC/matches`, { headers }),
    ]);

    if (!standingsRes.ok || !matchesRes.ok) {
      throw new Error(`API error: ${standingsRes.status} / ${matchesRes.status}`);
    }

    const standingsJson = await standingsRes.json();
    const matchesJson = await matchesRes.json();

    // ── Process group standings ──────────────────────────────────────────
    const groups: {
      id: string;
      teams: {
        id: string; name: string; flag: string; tla: string;
        position: number; mp: number; w: number; d: number; l: number;
        gf: number; ga: number; pts: number;
      }[];
    }[] = [];

    const slotMap: Record<string, string> = {}; // "1A" → "MEX"

    const standings = (standingsJson.standings ?? []) as any[];
    // API returns group as "Group A" (or legacy "GROUP_A") — handle both
    const groupStandings = standings.filter(
      (s: any) => s.type === "TOTAL" && s.group &&
        (s.group.startsWith("Group ") || s.group.startsWith("GROUP_"))
    );

    for (const gs of groupStandings) {
      const raw: string = gs.group;
      // Extract single letter: "Group A" → "A", "GROUP_A" → "A"
      const groupLetter = raw.startsWith("Group ")
        ? raw.replace("Group ", "").trim()
        : raw.replace("GROUP_", "").trim();
      const teams = (gs.table ?? []).map((row: any) => {
        const tla: string = row.team?.tla ?? "UNK";
        return {
          id: tla,
          name: row.team?.name ?? tla,
          tla,
          flag: tlaToFlag(tla),
          position: row.position,
          mp: row.playedGames ?? 0,
          w: row.won ?? 0,
          d: row.draw ?? 0,
          l: row.lost ?? 0,
          gf: row.goalsFor ?? 0,
          ga: row.goalsAgainst ?? 0,
          pts: row.points ?? 0,
        };
      });

      groups.push({ id: groupLetter, teams });

      // Only auto-fill 1st/2nd when every team has played all 3 group games
      // (positions are final). Groups still in progress are left for user prediction.
      const groupComplete = teams.every((t: any) => t.mp >= 3);
      if (groupComplete) {
        teams.forEach((t: any) => {
          if (t.position === 1) slotMap[`1${groupLetter}`] = t.tla;
          if (t.position === 2) slotMap[`2${groupLetter}`] = t.tla;
          // 3rd place slots are never auto-filled: user must predict which 8
          // best-third teams advance and which bracket position they go to.
        });
      }
    }

    // ── Process knockout match results ───────────────────────────────────
    // football-data.org v4 stage codes for WC 2026
    const STAGE_ROUNDS: Record<string, string> = {
      LAST_32: "R32",
      LAST_16: "R16",
      QUARTER_FINALS: "QF",
      SEMI_FINALS: "SF",
      THIRD_PLACE: "3RD",
      FINAL: "F",
    };

    const liveResults: Record<string, { homeTla: string; awayTla: string; winner: string; homeScore: number; awayScore: number }> = {};
    const allMatches = (matchesJson.matches ?? []) as any[];

    allMatches
      .filter((m: any) => STAGE_ROUNDS[m.stage] && m.status === "FINISHED")
      .forEach((m: any) => {
        const key = `${STAGE_ROUNDS[m.stage]}_${m.homeTeam?.tla}_${m.awayTeam?.tla}`;
        liveResults[key] = {
          homeTla: m.homeTeam?.tla,
          awayTla: m.awayTeam?.tla,
          winner: m.score?.winner === "HOME_TEAM" ? m.homeTeam?.tla :
                  m.score?.winner === "AWAY_TEAM" ? m.awayTeam?.tla : "",
          homeScore: m.score?.fullTime?.home ?? 0,
          awayScore: m.score?.fullTime?.away ?? 0,
        };
      });

    // Sort groups alphabetically
    groups.sort((a, b) => a.id.localeCompare(b.id));

    const data = { groups, slotMap, liveResults };
    cache = { ts: Date.now(), data };
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({
      groups: [], slotMap: {}, liveResults: {},
      error: e.message ?? "Unknown error",
    });
  }
}
