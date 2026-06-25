"use client";

import { Match, Predictions } from "@/lib/types";
import MatchCard from "./MatchCard";
import { useLocale } from "@/lib/localeContext";

interface Props {
  matches: Match[];
  predictions: Predictions;
  liveResults: Record<string, string>;
  onPick: (matchId: string, teamId: string) => void;
  onDropTeam: (matchId: string, slot: "home" | "away", teamId: string) => void;
  onRemoveSlot: (matchId: string, slot: "home" | "away") => void;
}

const ROW_H = 48;   // 2 rows per match = 96px, card content ~94px
const HEADER_H = 64; // tall enough for trophy icon + round label + date range

// ── 17-column grid: 9 match cols + 8 arrow cols between them ─────────────────
// Old col:  1   2   3   4   5   6   7   8   9
// New col:  1   3   5   7   9  11  13  15  17
// Arrows:     2   4   6   8  10  12  14  16
const C = [0,1,3,5,7,9,11,13,15,17]; // C[oldCol] = newCol

const MATCH_W = 150;
const ARROW_W = 32;
const COL_WIDTHS = [
  0,
  MATCH_W, ARROW_W, MATCH_W, ARROW_W, MATCH_W, ARROW_W, MATCH_W, ARROW_W,
  164,   // Final column (slightly wider)
  ARROW_W, MATCH_W, ARROW_W, MATCH_W, ARROW_W, MATCH_W, ARROW_W, MATCH_W,
];

const GRID: Record<string, { col: number; rs: number; re: number }> = {
  // Left R32
  M74:  { col:C[1], rs:2,  re:4  },
  M77:  { col:C[1], rs:4,  re:6  },
  M73:  { col:C[1], rs:6,  re:8  },
  M75:  { col:C[1], rs:8,  re:10 },
  M83:  { col:C[1], rs:10, re:12 },
  M84:  { col:C[1], rs:12, re:14 },
  M81:  { col:C[1], rs:14, re:16 },
  M82:  { col:C[1], rs:16, re:18 },
  // Left R16
  M89:  { col:C[2], rs:3,  re:5  },
  M90:  { col:C[2], rs:7,  re:9  },
  M93:  { col:C[2], rs:11, re:13 },
  M94:  { col:C[2], rs:15, re:17 },
  // Left QF
  M97:  { col:C[3], rs:5,  re:7  },
  M98:  { col:C[3], rs:13, re:15 },
  // Left SF
  M101: { col:C[4], rs:9,  re:11 },
  // Final + 3rd
  M104: { col:C[5], rs:7,  re:9  },
  M103: { col:C[5], rs:11, re:13 },
  // Right SF
  M102: { col:C[6], rs:9,  re:11 },
  // Right QF
  M99:  { col:C[7], rs:5,  re:7  },
  M100: { col:C[7], rs:13, re:15 },
  // Right R16
  M91:  { col:C[8], rs:3,  re:5  },
  M92:  { col:C[8], rs:7,  re:9  },
  M95:  { col:C[8], rs:11, re:13 },
  M96:  { col:C[8], rs:15, re:17 },
  // Right R32
  M76:  { col:C[9], rs:2,  re:4  },
  M78:  { col:C[9], rs:4,  re:6  },
  M79:  { col:C[9], rs:6,  re:8  },
  M80:  { col:C[9], rs:8,  re:10 },
  M86:  { col:C[9], rs:10, re:12 },
  M88:  { col:C[9], rs:12, re:14 },
  M85:  { col:C[9], rs:14, re:16 },
  M87:  { col:C[9], rs:16, re:18 },
};

// Connector arrows between rounds
// For left half: → arrows at the destination match position
// For right half: ← arrows (displayed as "→" but pointing left via transform)
const ARROWS: { col: number; rs: number; re: number; dir: "left"|"right" }[] = [
  // Left: R32 → R16
  { col:2,  rs:3,  re:5,  dir:"right" },
  { col:2,  rs:7,  re:9,  dir:"right" },
  { col:2,  rs:11, re:13, dir:"right" },
  { col:2,  rs:15, re:17, dir:"right" },
  // Left: R16 → QF
  { col:4,  rs:5,  re:7,  dir:"right" },
  { col:4,  rs:13, re:15, dir:"right" },
  // Left: QF → SF
  { col:6,  rs:9,  re:11, dir:"right" },
  // Left: SF → Final & 3rd
  { col:8,  rs:7,  re:9,  dir:"right" },
  { col:8,  rs:11, re:13, dir:"right" },
  // Right: SF → Final & 3rd
  { col:10, rs:7,  re:9,  dir:"left"  },
  { col:10, rs:11, re:13, dir:"left"  },
  // Right: QF → SF
  { col:12, rs:9,  re:11, dir:"left"  },
  // Right: R16 → QF
  { col:14, rs:5,  re:7,  dir:"left"  },
  { col:14, rs:13, re:15, dir:"left"  },
  // Right: R32 → R16
  { col:16, rs:3,  re:5,  dir:"left"  },
  { col:16, rs:7,  re:9,  dir:"left"  },
  { col:16, rs:11, re:13, dir:"left"  },
  { col:16, rs:15, re:17, dir:"left"  },
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
  const totalH = HEADER_H + ROW_H * 16;

  const gridTemplateColumns = COL_WIDTHS.slice(1).map(w => `${w}px`).join(" ");
  const gridTemplateRows = `${HEADER_H}px repeat(16, ${ROW_H}px)`;

  return (
    <div style={{ display:"grid", gridTemplateColumns, gridTemplateRows, width:totalW, height:totalH }}>

      {/* Column headers */}
      {Object.entries(COL_HEADERS).map(([colStr, { key, dates }]) => {
        const col = parseInt(colStr);
        const isFinal = col === 9;
        return (
          <div key={`hdr-${col}`} style={{ gridColumn:col, gridRow:1 }}
            className="flex flex-col items-center justify-end pb-2.5 gap-0.5">
            {/* Trophy lives in the header for the Final column — keeps the card cell unobstructed */}
            {isFinal && <span className="text-lg mb-0.5">🏆</span>}
            <span className={`text-[9px] font-bold uppercase tracking-[0.18em] ${isFinal ? "text-amber-300/90" : "text-white/40"}`}>
              {t(key as any)}
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
          style={{ gridColumn:a.col, gridRow:`${a.rs}/${a.re}` }}
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
            style={{ gridColumn:pos.col, gridRow:`${pos.rs}/${pos.re}`, display:"flex", flexDirection:"column", justifyContent:"center", padding:"3px 0" }}>
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
