import { NextResponse } from "next/server";
import { INITIAL_MATCHES } from "@/lib/bracketData";

/** Convert ISO UTC date string → { date: "MM/DD/YYYY", time: "HH:MM" } in EDT (UTC−4). */
function utcToEdt(utcDate: string): { date: string; time: string } {
  const d = new Date(utcDate);
  const edt = new Date(d.getTime() - 4 * 3_600_000);
  const mm = String(edt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(edt.getUTCDate()).padStart(2, "0");
  const hh = String(edt.getUTCHours()).padStart(2, "0");
  const mi = String(edt.getUTCMinutes()).padStart(2, "0");
  return { date: `${mm}/${dd}/${edt.getUTCFullYear()}`, time: `${hh}:${mi}` };
}

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

    type ApiRow = { team?: { tla?: string; name?: string }; position: number; playedGames?: number; won?: number; draw?: number; lost?: number; goalsFor?: number; goalsAgainst?: number; points?: number };
    type ApiStanding = { type: string; group?: string; table?: ApiRow[] };
    type ApiScore = { winner?: string; duration?: string; fullTime?: { home?: number; away?: number }; penalties?: { home?: number; away?: number } };
    type ApiMatch = { stage: string; status: string; utcDate?: string; homeTeam?: { tla?: string }; awayTeam?: { tla?: string }; score?: ApiScore };

    const standings = (standingsJson.standings ?? []) as ApiStanding[];
    // API returns group as "Group A" (or legacy "GROUP_A") — handle both
    const groupStandings = standings.filter(
      (s) => s.type === "TOTAL" && s.group &&
        (s.group.startsWith("Group ") || s.group.startsWith("GROUP_"))
    );

    for (const gs of groupStandings) {
      const raw: string = gs.group!;
      // Extract single letter: "Group A" → "A", "GROUP_A" → "A"
      const groupLetter = raw.startsWith("Group ")
        ? raw.replace("Group ", "").trim()
        : raw.replace("GROUP_", "").trim();
      const teams = (gs.table ?? []).map((row) => {
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
      const groupComplete = teams.every((t) => t.mp >= 3);
      if (groupComplete) {
        teams.forEach((t) => {
          if (t.position === 1) slotMap[`1${groupLetter}`] = t.tla;
          if (t.position === 2) slotMap[`2${groupLetter}`] = t.tla;
          // 3rd place slots are never auto-filled: user must predict which 8
          // best-third teams advance and which bracket position they go to.
        });
      }
    }

    // ── Process knockout match results ───────────────────────────────────
    const allMatches = (matchesJson.matches ?? []) as ApiMatch[];

    // ── Detect 3rd-place slot assignments from Round of 32 API matches ──────
    // Build reverse lookup: TLA → slot label (covers 1st/2nd place)
    const tlaToSlot: Record<string, string> = {};
    for (const [slot, tla] of Object.entries(slotMap)) tlaToSlot[tla] = slot;

    const r32Matches = allMatches.filter((m) => m.stage === "LAST_32");
    for (const apiMatch of r32Matches) {
      const homeTla: string | undefined = apiMatch.homeTeam?.tla;
      const awayTla: string | undefined = apiMatch.awayTeam?.tla;
      if (!homeTla || !awayTla) continue;

      const homeSlot = tlaToSlot[homeTla]; // e.g. "1E" if already in slotMap
      const awaySlot = tlaToSlot[awayTla];

      // Exactly one team is a confirmed 1st/2nd-placer → the other is 3rd-place
      if (homeSlot && !awaySlot) {
        // awayTla is the 3rd-place team — find which INITIAL_MATCH slot it belongs to
        const initMatch = INITIAL_MATCHES.find(
          m => m.home.id === homeSlot || m.away.id === homeSlot
        );
        if (initMatch) {
          const thirdSlot = initMatch.home.id === homeSlot
            ? initMatch.away.id
            : initMatch.home.id;
          if (thirdSlot.startsWith("3") && !slotMap[thirdSlot]) {
            slotMap[thirdSlot] = awayTla;
            tlaToSlot[awayTla] = thirdSlot;
          }
        }
      } else if (awaySlot && !homeSlot) {
        // homeTla is the 3rd-place team
        const initMatch = INITIAL_MATCHES.find(
          m => m.home.id === awaySlot || m.away.id === awaySlot
        );
        if (initMatch) {
          const thirdSlot = initMatch.home.id === awaySlot
            ? initMatch.away.id
            : initMatch.home.id;
          if (thirdSlot.startsWith("3") && !slotMap[thirdSlot]) {
            slotMap[thirdSlot] = homeTla;
            tlaToSlot[homeTla] = thirdSlot;
          }
        }
      }
    }

    // ── Build matchSchedule (EDT times) and liveResultsById ──────────────
    // Process rounds in order so tlaToSlot is updated with each round's winners
    // before the next round is processed. e.g. after R32, tlaToSlot["CAN"]="W74"
    // so R16 matches whose bracketData slot is "W74" can be identified.
    const matchSchedule: Record<string, { date: string; time: string }> = {};
    const liveResultsById: Record<string, string> = {}; // bracketId → winner TLA
    const liveScores: Record<string, { home: string; away: string }> = {};

    const STAGE_ORDER = [
      "LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL",
    ];

    for (const stage of STAGE_ORDER) {
      const stageMatches = allMatches.filter((m) => m.stage === stage);

      for (const apiMatch of stageMatches) {
        const homeTla: string | undefined = apiMatch.homeTeam?.tla;
        const awayTla: string | undefined = apiMatch.awayTeam?.tla;
        if (!homeTla || !awayTla) continue;

        const homeSlot = tlaToSlot[homeTla];
        const awaySlot = tlaToSlot[awayTla];
        if (!homeSlot || !awaySlot) continue;

        // Find the bracketData match whose slots match these two teams
        const bracketMatch = INITIAL_MATCHES.find((m) =>
          (m.home.id === homeSlot && m.away.id === awaySlot) ||
          (m.home.id === awaySlot && m.away.id === homeSlot)
        );
        if (!bracketMatch) continue;

        // Accurate EDT schedule time from API
        if (apiMatch.utcDate) {
          matchSchedule[bracketMatch.id] = utcToEdt(apiMatch.utcDate);
        }

        // Official result + score if match is finished
        if (apiMatch.status === "FINISHED") {
          const winner = apiMatch.score?.winner === "HOME_TEAM" ? homeTla
                       : apiMatch.score?.winner === "AWAY_TEAM" ? awayTla
                       : "";

          if (winner) {
            liveResultsById[bracketMatch.id] = winner;
            // Key fix: register the winner under their next-round slot ID ("W74" etc.)
            // so subsequent rounds can resolve their bracket slot from their TLA.
            const winnerSlot = `W${bracketMatch.id.slice(1)}`; // "M74" → "W74"
            tlaToSlot[winner] = winnerSlot;
          }

          const ft = apiMatch.score?.fullTime;
          if (ft && ft.home != null && ft.away != null) {
            const isPens = apiMatch.score?.duration === "PENALTY_SHOOTOUT";
            const pens   = apiMatch.score?.penalties;
            const homeRegular = isPens && pens?.home != null ? ft.home - pens.home : ft.home;
            const awayRegular = isPens && pens?.away != null ? ft.away - pens.away : ft.away;
            liveScores[bracketMatch.id] = {
              home: isPens && pens?.home != null ? `${homeRegular}(${pens.home})` : `${ft.home}`,
              away: isPens && pens?.away != null ? `${awayRegular}(${pens.away})` : `${ft.away}`,
            };
          }
        }
      }
    }

    // Sort groups alphabetically
    groups.sort((a, b) => a.id.localeCompare(b.id));

    const data = { groups, slotMap, matchSchedule, liveResultsById, liveScores };
    cache = { ts: Date.now(), data };
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({
      groups: [], slotMap: {}, liveResults: {},
      error: msg,
    });
  }
}
