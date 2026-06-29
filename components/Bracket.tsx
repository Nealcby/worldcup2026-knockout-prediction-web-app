"use client";

import { Match, Predictions } from "@/lib/types";
import MatchCard from "./MatchCard";
import LiveMatchTV from "./LiveMatchTV";
import { useLocale } from "@/lib/localeContext";

interface Props {
  matches: Match[];
  predictions: Predictions;
  liveResults: Record<string, string>;
  onPick: (matchId: string, teamId: string) => void;
  onDropTeam: (matchId: string, slot: "home" | "away", teamId: string) => void;
  onRemoveSlot: (matchId: string, slot: "home" | "away") => void;
}

const ROW_H = 48;    // 2 rows per match = 96px, card content ~94px
const HEADER_H = 64; // trophy icon + round label + date range
const TV_ROWS = 2;   // small top buffer so antennas have space to peek above headers

// ── 17-column grid: 9 match cols + 8 arrow cols between them ─────────────────
// Old col:  1   2   3   4   5   6   7   8   9
// New col:  1   3   5   7   9  11  13  15  17
// Arrows:     2   4   6   8  10  12  14  16
const C = [0,1,3,5,7,9,11,13,15,17]; // C[oldCol] = newCol

const MATCH_W = 162;
const ARROW_W = 32;
const COL_WIDTHS = [
  0,
  MATCH_W, ARROW_W, MATCH_W, ARROW_W, MATCH_W, ARROW_W, MATCH_W, ARROW_W,
  164,   // Final column (slightly wider)
  ARROW_W, MATCH_W, ARROW_W, MATCH_W, ARROW_W, MATCH_W, ARROW_W, MATCH_W,
];

// TV_ROWS shifts all row positions down so the TV zone fits above the bracket
const R = (r: number) => r + TV_ROWS; // shift a 1-based row index by TV_ROWS

const GRID: Record<string, { col: number; rs: number; re: number }> = {
  // Left R32
  M74:  { col:C[1], rs:R(2),  re:R(4)  },
  M77:  { col:C[1], rs:R(4),  re:R(6)  },
  M73:  { col:C[1], rs:R(6),  re:R(8)  },
  M75:  { col:C[1], rs:R(8),  re:R(10) },
  M83:  { col:C[1], rs:R(10), re:R(12) },
  M84:  { col:C[1], rs:R(12), re:R(14) },
  M81:  { col:C[1], rs:R(14), re:R(16) },
  M82:  { col:C[1], rs:R(16), re:R(18) },
  // Left R16
  M89:  { col:C[2], rs:R(3),  re:R(5)  },
  M90:  { col:C[2], rs:R(7),  re:R(9)  },
  M93:  { col:C[2], rs:R(11), re:R(13) },
  M94:  { col:C[2], rs:R(15), re:R(17) },
  // Left QF
  M97:  { col:C[3], rs:R(5),  re:R(7)  },
  M98:  { col:C[3], rs:R(13), re:R(15) },
  // Left SF
  M101: { col:C[4], rs:R(9),  re:R(11) },
  // Final + 3rd
  M104: { col:C[5], rs:R(7),  re:R(9)  },
  M103: { col:C[5], rs:R(11), re:R(13) },
  // Right SF
  M102: { col:C[6], rs:R(9),  re:R(11) },
  // Right QF
  M99:  { col:C[7], rs:R(5),  re:R(7)  },
  M100: { col:C[7], rs:R(13), re:R(15) },
  // Right R16
  M91:  { col:C[8], rs:R(3),  re:R(5)  },
  M92:  { col:C[8], rs:R(7),  re:R(9)  },
  M95:  { col:C[8], rs:R(11), re:R(13) },
  M96:  { col:C[8], rs:R(15), re:R(17) },
  // Right R32
  M76:  { col:C[9], rs:R(2),  re:R(4)  },
  M78:  { col:C[9], rs:R(4),  re:R(6)  },
  M79:  { col:C[9], rs:R(6),  re:R(8)  },
  M80:  { col:C[9], rs:R(8),  re:R(10) },
  M86:  { col:C[9], rs:R(10), re:R(12) },
  M88:  { col:C[9], rs:R(12), re:R(14) },
  M85:  { col:C[9], rs:R(14), re:R(16) },
  M87:  { col:C[9], rs:R(16), re:R(18) },
};

// Connector arrows between rounds (rows shifted by TV_ROWS)
const ARROWS: { col: number; rs: number; re: number; dir: "left"|"right" }[] = [
  // Left: R32 → R16
  { col:2,  rs:R(3),  re:R(5),  dir:"right" },
  { col:2,  rs:R(7),  re:R(9),  dir:"right" },
  { col:2,  rs:R(11), re:R(13), dir:"right" },
  { col:2,  rs:R(15), re:R(17), dir:"right" },
  // Left: R16 → QF
  { col:4,  rs:R(5),  re:R(7),  dir:"right" },
  { col:4,  rs:R(13), re:R(15), dir:"right" },
  // Left: QF → SF
  { col:6,  rs:R(9),  re:R(11), dir:"right" },
  // Left: SF → Final & 3rd
  { col:8,  rs:R(7),  re:R(9),  dir:"right" },
  { col:8,  rs:R(11), re:R(13), dir:"right" },
  // Right: SF → Final & 3rd
  { col:10, rs:R(7),  re:R(9),  dir:"left"  },
  { col:10, rs:R(11), re:R(13), dir:"left"  },
  // Right: QF → SF
  { col:12, rs:R(9),  re:R(11), dir:"left"  },
  // Right: R16 → QF
  { col:14, rs:R(5),  re:R(7),  dir:"left"  },
  { col:14, rs:R(13), re:R(15), dir:"left"  },
  // Right: R32 → R16
  { col:16, rs:R(3),  re:R(5),  dir:"left"  },
  { col:16, rs:R(7),  re:R(9),  dir:"left"  },
  { col:16, rs:R(11), re:R(13), dir:"left"  },
  { col:16, rs:R(15), re:R(17), dir:"left"  },
];

// Round labels: col number → { label key, dates }
const COL_HEADERS: Record<number, { key: string; dates: string }> = {
  1:  { key:"roundOf32",    dates:"Jun 28 – Jul 1" },
  3:  { key:"roundOf16",    dates:"Jul 4 – 5"      },
  5:  { key:"quarterFinal", dates:"Jul 9 – 10"     },
  7:  { key:"semiFinal",    dates:"Jul 14 – 15"    },
  9:  { key:"final",        dates:"Jul 19"         },
  11: { key:"semiFinal",    dates:"Jul 14 – 15"    },
  13: { key:"quarterFinal", dates:"Jul 9 – 10"     },
  15: { key:"roundOf16",    dates:"Jul 4 – 5"      },
  17: { key:"roundOf32",    dates:"Jun 28 – Jul 1" },
};

export default function Bracket({ matches, predictions, liveResults, onPick, onDropTeam, onRemoveSlot }: Props) {
  const { t } = useLocale();

  const totalW = COL_WIDTHS.slice(1).reduce((a, b) => a + b, 0);
  const totalH = HEADER_H + ROW_H * (16 + TV_ROWS);

  const gridTemplateColumns = COL_WIDTHS.slice(1).map(w => `${w}px`).join(" ");
  // TV_ROWS extra rows on top, then the header row, then 16 match rows
  const gridTemplateRows = `repeat(${TV_ROWS}, ${ROW_H}px) ${HEADER_H}px repeat(16, ${ROW_H}px)`;

  return (
    <div style={{ display:"grid", gridTemplateColumns, gridTemplateRows, width:totalW, height:totalH }}>

      {/* ── Live TV widget
           top    = top edge of top R32 slot  → row R(2)
           bottom = bottom edge of top QF slot → row R(7)
           left   = left edge of left SF slot  → col C[4]=7
           right  = right edge of right SF slot → col C[6]+1=12  ── */}
      <div style={{ gridColumn:`${C[4]}/${C[6]+1}`, gridRow:`${R(2)}/${R(7)}`, zIndex:0, position:"relative" }}>
        <LiveMatchTV matches={matches} />
      </div>

      {/* Column headers */}
      {Object.entries(COL_HEADERS).map(([colStr, { key, dates }]) => {
        const col = parseInt(colStr);
        const isFinal = col === 9;
        return (
          <div key={`hdr-${col}`} style={{ gridColumn:col, gridRow:TV_ROWS + 1 }}
            className="flex flex-col items-center justify-end pb-2.5 gap-0.5">
            {/* Trophy lives in the header for the Final column — keeps the card cell unobstructed */}
            {isFinal && <span className="text-lg mb-0.5">🏆</span>}
            <span className={`text-[9px] font-bold uppercase tracking-[0.18em] ${isFinal ? "text-amber-300/90" : "text-white/40"}`}>
              {t(key as "roundOf32" | "roundOf16" | "quarterFinal" | "semiFinal" | "final")}
            </span>
            <span className={`text-[8px] tracking-wide ${isFinal ? "text-amber-400/50" : "text-white/20"}`}>
              {dates}
            </span>
            <div className={`h-px w-4/5 mt-0.5 rounded-full ${isFinal
              ? "bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
              : "bg-gradient-to-r from-transparent via-white/10 to-transparent"}`} />
          </div>
        );
      })}

      {/* Connector arrows */}
      {ARROWS.map((a, i) => (
        <div key={`arr-${i}`}
          style={{ gridColumn:a.col, gridRow:`${a.rs}/${a.re}`, position:"relative", zIndex:1 }}
          className="flex items-center justify-center">
          <span className={`text-white/15 text-[11px] ${a.dir === "left" ? "rotate-180" : ""}`}>›</span>
        </div>
      ))}

      {/* Match cards */}
      {Object.entries(GRID).map(([matchId, pos]) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return null;
        const isFinal = matchId === "M104";
        const is3rd   = matchId === "M103";
        return (
          <div key={matchId}
            style={{ gridColumn:pos.col, gridRow:`${pos.rs}/${pos.re}`, display:"flex", flexDirection:"column", justifyContent:"center", padding:"3px 0", position:"relative", zIndex:1 }}>
            <div className={`rounded-xl overflow-hidden ${
              isFinal ? "ring-1 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.1)]" :
              is3rd   ? "ring-1 ring-purple-400/25" : ""
            }`}>
              <MatchCard
                match={match}
                predictions={predictions}
                liveResults={liveResults}
                onPick={onPick}
                onDropTeam={onDropTeam}
                onRemoveSlot={onRemoveSlot}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
