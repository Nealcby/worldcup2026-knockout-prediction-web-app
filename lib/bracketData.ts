import { Match, TeamInfo } from "./types";

function ph(label: string): TeamInfo {
  return { id: label, name: label, isKnown: false };
}

// FIFA World Cup 2026 — knockout bracket structure.
// All team slots use group-position codes (e.g. "1A", "2B", "3ABCDF").
// Actual teams are resolved at runtime from live API group standings.
// nextMatchId / nextMatchSlot defines the bracket graph.

export const INITIAL_MATCHES: Match[] = [
  // ── LEFT HALF — R32 ───────────────────────────────────────────────────────
  { id:"M74", round:"R32", date:"06/29/2026", time:"16:30",
    home:ph("1E"), away:ph("3ABCDF"), nextMatchId:"M89", nextMatchSlot:"home" },
  { id:"M77", round:"R32", date:"06/30/2026", time:"17:00",
    home:ph("1I"), away:ph("3CDFGH"), nextMatchId:"M89", nextMatchSlot:"away" },
  { id:"M73", round:"R32", date:"06/28/2026", time:"15:00",
    home:ph("2A"), away:ph("2B"),     nextMatchId:"M90", nextMatchSlot:"home" },
  { id:"M75", round:"R32", date:"06/29/2026", time:"21:00",
    home:ph("1F"), away:ph("2C"),     nextMatchId:"M90", nextMatchSlot:"away" },
  { id:"M83", round:"R32", date:"07/02/2026", time:"19:00",
    home:ph("2K"), away:ph("2L"),     nextMatchId:"M93", nextMatchSlot:"home" },
  { id:"M84", round:"R32", date:"07/02/2026", time:"15:00",
    home:ph("1H"), away:ph("2J"),     nextMatchId:"M93", nextMatchSlot:"away" },
  { id:"M81", round:"R32", date:"07/01/2026", time:"20:00",
    home:ph("1D"), away:ph("3BEFIJ"), nextMatchId:"M94", nextMatchSlot:"home" },
  { id:"M82", round:"R32", date:"07/01/2026", time:"16:00",
    home:ph("1G"), away:ph("3AEHIJ"), nextMatchId:"M94", nextMatchSlot:"away" },

  // ── LEFT HALF — R16 ───────────────────────────────────────────────────────
  { id:"M89", round:"R16", date:"07/04/2026", time:"17:00",
    home:ph("W74"), away:ph("W77"), nextMatchId:"M97", nextMatchSlot:"home" },
  { id:"M90", round:"R16", date:"07/04/2026", time:"13:00",
    home:ph("W73"), away:ph("W75"), nextMatchId:"M97", nextMatchSlot:"away" },
  { id:"M93", round:"R16", date:"07/06/2026", time:"15:00",
    home:ph("W83"), away:ph("W84"), nextMatchId:"M98", nextMatchSlot:"home" },
  { id:"M94", round:"R16", date:"07/06/2026", time:"20:00",
    home:ph("W81"), away:ph("W82"), nextMatchId:"M98", nextMatchSlot:"away" },

  // ── LEFT HALF — QF ────────────────────────────────────────────────────────
  { id:"M97", round:"QF", date:"07/09/2026", time:"16:00",
    home:ph("W89"), away:ph("W90"), nextMatchId:"M101", nextMatchSlot:"home" },
  { id:"M98", round:"QF", date:"07/10/2026", time:"15:00",
    home:ph("W93"), away:ph("W94"), nextMatchId:"M101", nextMatchSlot:"away" },

  // ── LEFT HALF — SF ────────────────────────────────────────────────────────
  { id:"M101", round:"SF", date:"07/14/2026", time:"15:00",
    home:ph("W97"), away:ph("W98"), nextMatchId:"M104", nextMatchSlot:"home" },

  // ── RIGHT HALF — R32 ──────────────────────────────────────────────────────
  { id:"M76", round:"R32", date:"06/29/2026", time:"13:00",
    home:ph("1C"), away:ph("2F"),     nextMatchId:"M91", nextMatchSlot:"home" },
  { id:"M78", round:"R32", date:"06/30/2026", time:"13:00",
    home:ph("2E"), away:ph("2I"),     nextMatchId:"M91", nextMatchSlot:"away" },
  { id:"M79", round:"R32", date:"06/30/2026", time:"21:00",
    home:ph("1A"), away:ph("3CEFHI"), nextMatchId:"M92", nextMatchSlot:"home" },
  { id:"M80", round:"R32", date:"07/01/2026", time:"12:00",
    home:ph("1L"), away:ph("3EHIJK"), nextMatchId:"M92", nextMatchSlot:"away" },
  { id:"M86", round:"R32", date:"07/03/2026", time:"18:00",
    home:ph("1J"), away:ph("2H"),     nextMatchId:"M95", nextMatchSlot:"home" },
  { id:"M88", round:"R32", date:"07/03/2026", time:"14:00",
    home:ph("2D"), away:ph("2G"),     nextMatchId:"M95", nextMatchSlot:"away" },
  { id:"M85", round:"R32", date:"07/02/2026", time:"23:00",
    home:ph("1B"), away:ph("3EFGIJ"), nextMatchId:"M96", nextMatchSlot:"home" },
  { id:"M87", round:"R32", date:"07/03/2026", time:"21:30",
    home:ph("1K"), away:ph("3DEIJL"), nextMatchId:"M96", nextMatchSlot:"away" },

  // ── RIGHT HALF — R16 ──────────────────────────────────────────────────────
  { id:"M91", round:"R16", date:"07/05/2026", time:"16:00",
    home:ph("W76"), away:ph("W78"), nextMatchId:"M99", nextMatchSlot:"home" },
  { id:"M92", round:"R16", date:"07/05/2026", time:"20:00",
    home:ph("W79"), away:ph("W80"), nextMatchId:"M99", nextMatchSlot:"away" },
  { id:"M95", round:"R16", date:"07/07/2026", time:"12:00",
    home:ph("W86"), away:ph("W88"), nextMatchId:"M100", nextMatchSlot:"home" },
  { id:"M96", round:"R16", date:"07/07/2026", time:"16:00",
    home:ph("W85"), away:ph("W87"), nextMatchId:"M100", nextMatchSlot:"away" },

  // ── RIGHT HALF — QF ───────────────────────────────────────────────────────
  { id:"M99",  round:"QF", date:"07/11/2026", time:"17:00",
    home:ph("W91"), away:ph("W92"), nextMatchId:"M102", nextMatchSlot:"home" },
  { id:"M100", round:"QF", date:"07/11/2026", time:"21:00",
    home:ph("W95"), away:ph("W96"), nextMatchId:"M102", nextMatchSlot:"away" },

  // ── RIGHT HALF — SF ───────────────────────────────────────────────────────
  { id:"M102", round:"SF", date:"07/15/2026", time:"15:00",
    home:ph("W99"), away:ph("W100"), nextMatchId:"M104", nextMatchSlot:"away" },

  // ── FINAL + 3RD ───────────────────────────────────────────────────────────
  { id:"M104", round:"F",   date:"07/19/2026", time:"15:00",
    home:ph("W101"), away:ph("W102") },
  { id:"M103", round:"3RD", date:"07/18/2026", time:"17:00",
    home:ph("RU101"), away:ph("RU102") },
];
