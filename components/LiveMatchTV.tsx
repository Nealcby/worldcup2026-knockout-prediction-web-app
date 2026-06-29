"use client";

import { useEffect, useState } from "react";
import { Match } from "@/lib/types";

interface Props {
  matches: Match[];
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** Parse an EDT date+time string (MM/DD/YYYY, HH:MM) to a UTC timestamp. */
function edtToUtcMs(dateStr: string, timeStr: string): number | null {
  if (!dateStr || !timeStr) return null;
  const [mm, dd, yyyy] = dateStr.split("/").map(Number);
  const [hh, mi] = timeStr.split(":").map(Number);
  if (!yyyy || isNaN(hh)) return null;
  return Date.UTC(yyyy, mm - 1, dd, hh + 4, mi); // EDT = UTC−4
}

/** Format countdown: "in 2h 15m" or "in 45m" */
function formatCountdown(diffMs: number): string {
  const totalMin = Math.ceil(diffMs / 60_000);
  if (totalMin <= 0) return "";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `in ${h}h ${m > 0 ? `${m}m` : ""}`.trim();
  return `in ${m}m`;
}

// Max knockout match duration: 150 min (90 + ET + penalties)
const MATCH_DURATION_MS = 150 * 60_000;

export default function LiveMatchTV({ matches }: Props) {
  // Tick every 30 s so badge and countdown stay fresh
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Find live-or-next match with both teams known
  let picked: Match | null = null;
  let pickedDiff = Infinity; // startMs - nowMs

  for (const m of matches) {
    if (!m.home.isKnown || !m.away.isKnown) continue;
    const startMs = edtToUtcMs(m.date ?? "", m.time ?? "");
    if (startMs == null) continue;
    const diff = startMs - nowMs;
    // Within the 150-min live window OR upcoming
    if (diff > -MATCH_DURATION_MS && diff < pickedDiff) {
      pickedDiff = diff;
      picked = m;
    }
  }

  const isLive   = picked !== null && pickedDiff <= 0;
  const isNext   = picked !== null && pickedDiff > 0;
  const countdown = isNext ? formatCountdown(pickedDiff) : "";

  const homeName = picked ? (picked.home.name || picked.home.id) : "";
  const awayName = picked ? (picked.away.name || picked.away.id) : "";

  const embedUrl = picked
    ? `https://embed.st/embed/admin/ppv-${toSlug(homeName)}-vs-${toSlug(awayName)}/1`
    : null;

  return (
    <div style={{ width:"100%", height:"100%", padding:"4px", display:"flex", flexDirection:"column" }}>
      <div style={{
        flex: 1,
        minHeight: 0,
        background: "#0d1117",
        border: "2px solid #30363d",
        borderRadius: 8,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.7)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}>

        {/* ── Thin top chrome bar ── */}
        <div style={{ display:"flex", alignItems:"center", padding:"5px 10px", background:"#161b22", borderBottom:"1px solid #30363d", flexShrink:0, gap:6 }}>
          {/* Traffic-light dots — left */}
          <div style={{ display:"flex", gap:5, flexShrink:0 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#ff5f57" }} />
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#febc2e" }} />
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#28c840" }} />
          </div>

          {/* Centred badge + match title */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
            {isLive && (
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:"#ef4444", display:"inline-block", boxShadow:"0 0 6px #ef4444" }} />
                <span style={{ color:"#ef4444", fontSize:9, fontWeight:800, letterSpacing:"0.12em" }}>LIVE NOW</span>
              </div>
            )}
            {isNext && (
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ color:"#60a5fa", fontSize:9, fontWeight:800, letterSpacing:"0.12em" }}>▶ NEXT UP</span>
                {countdown && <span style={{ color:"rgba(255,255,255,0.35)", fontSize:8 }}>{countdown}</span>}
              </div>
            )}
            {picked && (
              <span style={{ color:"rgba(255,255,255,0.60)", fontSize:9, fontWeight:600, letterSpacing:"0.04em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"100%" }}>
                {homeName} <span style={{ color:"rgba(255,255,255,0.25)" }}>vs</span> {awayName}
              </span>
            )}
            {!picked && (
              <span style={{ color:"rgba(255,255,255,0.2)", fontSize:9 }}>No match scheduled</span>
            )}
          </div>

          {/* Match time — right */}
          {picked?.time && (
            <span style={{ color:"rgba(255,255,255,0.25)", fontSize:8, flexShrink:0, letterSpacing:"0.06em" }}>
              {picked.time} ET
            </span>
          )}
        </div>

        {/* ── Screen (iframe) ── */}
        <div style={{ flex:1, minHeight:0, background:"#000", position:"relative" }}>
          {embedUrl ? (
            <iframe
              key={embedUrl}
              src={embedUrl}
              style={{ width:"100%", height:"100%", border:"none", display:"block" }}
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              title={`${homeName} vs ${awayName}`}
            />
          ) : (
            <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.15)", fontSize:11, letterSpacing:"0.08em" }}>
              No upcoming match
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
