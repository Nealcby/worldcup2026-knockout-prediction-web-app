"use client";

import { useState, useEffect, useRef } from "react";
import { Match, Predictions } from "@/lib/types";
import { INITIAL_MATCHES } from "@/lib/bracketData";
import { useLocale } from "@/lib/localeContext";
import { getTeamName } from "@/lib/teamTranslations";
import TeamSlot from "./TeamSlot";

interface Props {
  match: Match;
  predictions: Predictions;
  liveResults: Record<string, string>;
  onPick: (matchId: string, teamId: string) => void;
  onDropTeam: (matchId: string, slot: "home" | "away", teamId: string) => void;
  onRemoveSlot: (matchId: string, slot: "home" | "away") => void;
}

/** Returns true if the match has already started (EDT = UTC−4). */
function hasMatchStarted(dateStr?: string, timeStr?: string): boolean {
  if (!dateStr || !timeStr) return false;
  const [mm, dd, yyyy] = dateStr.split("/").map(Number);
  const [hh, mi] = timeStr.split(":").map(Number);
  if (!yyyy || isNaN(hh)) return false;
  const startMs = Date.UTC(yyyy, mm - 1, dd, hh + 4, mi); // EDT → UTC
  return Date.now() >= startMs + 165 * 60_000; // show 165 min after kickoff
}

export default function MatchCard({ match, predictions, liveResults, onPick, onDropTeam, onRemoveSlot }: Props) {
  const { locale } = useLocale();
  const liveWinner = liveResults[match.id];
  const predWinner = predictions[match.id];
  const winner = liveWinner ?? predWinner;
  const isLocked = !!liveWinner;

  const [homeDragOver, setHomeDragOver] = useState(false);
  const [awayDragOver, setAwayDragOver] = useState(false);

  const orig = INITIAL_MATCHES.find(m => m.id === match.id);
  const homeWasPlaceholder = orig ? !orig.home.isKnown : false;
  const awayWasPlaceholder = orig ? !orig.away.isKnown : false;
  const homeRemovable = homeWasPlaceholder && match.home.isKnown && !isLocked && !match.home.isConfirmed;
  const awayRemovable = awayWasPlaceholder && match.away.isKnown && !isLocked && !match.away.isConfirmed;

  const bothKnown = match.home.isKnown && match.away.isKnown;

  function handlePick(teamId: string) {
    if (isLocked) return;
    onPick(match.id, predWinner === teamId ? "" : teamId);
  }

  const homeTeam = {
    ...match.home,
    name: match.home.isKnown ? getTeamName(match.home.id, locale, match.home.name) : match.home.name,
  };
  const awayTeam = {
    ...match.away,
    name: match.away.isKnown ? getTeamName(match.away.id, locale, match.away.name) : match.away.name,
  };

  // Tick every minute so hasMatchStarted() re-evaluates after the threshold passes
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const showWatch = hasMatchStarted(match.date, match.time);

  // YouTube highlight URL — fetched from server-side API (key stays secret).
  // Falls back to a YouTube search URL so the button always appears after 4h.
  const homeName = homeTeam.name || match.home.id;
  const awayName = awayTeam.name || match.away.id;

  // Fallback: YouTube search for the highlight if the specific video can't be found
  const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${homeName} ${awayName} Full Highlights FIFA World Cup 2026`
  )}`;

  // exactVideoUrl is set once the API finds a specific TSN video.
  // Until then the button falls back to ytSearchUrl so it's always visible.
  const [exactVideoUrl, setExactVideoUrl] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!showWatch || fetchedRef.current) return;
    if (!match.home.isKnown || !match.away.isKnown) return;
    fetchedRef.current = true;
    const qs = new URLSearchParams({
      home: homeName,
      away: awayName,
      date: match.date ?? "",
      time: match.time ?? "",
    });
    fetch(`/api/yt-highlight?${qs}`)
      .then(r => r.json())
      .then(d => { if (d.url) setExactVideoUrl(d.url); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWatch]);

  // Derive the URL to use: specific video if found, else YouTube search
  const highlightUrl = showWatch ? (exactVideoUrl ?? ytSearchUrl) : null;

return (
    <div className="border border-white/[0.08] rounded-xl overflow-hidden transition-shadow"
      style={{ background: "var(--bg-card)", boxShadow: "0 2px 8px var(--border-subtle)" }}>
      {/* Date/time + watch button */}
      {match.date && (
        <div className="flex items-center gap-1 px-2.5 pt-2 pb-0.5">
          <span className="text-[8px] text-white/25 uppercase tracking-wide">
            {match.date}{match.time ? ` – ${match.time}` : ""}
          </span>
          {match.time && (
            <span className="text-[7px] text-white/15 uppercase tracking-wider ml-0.5">ET</span>
          )}
          {showWatch && highlightUrl && (
            <a
              href={highlightUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Watch highlights: ${homeTeam.name || match.home.id} vs ${awayTeam.name || match.away.id}`}
              className="ml-auto flex-shrink-0 opacity-70 hover:opacity-100 hover:scale-110 transition-all duration-150 inline-flex"
              onClick={e => e.stopPropagation()}
            >
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="20" height="14" rx="3.5" fill="#FF0000" />
                <polygon points="8,3.5 8,10.5 14,7" fill="white" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="mx-2.5 h-px bg-white/[0.05] my-1" />

      {/* Home slot */}
      <TeamSlot
        team={homeTeam}
        isWinner={!!winner && winner === match.home.id}
        isLoser={!!winner && winner !== match.home.id}
        isLocked={isLocked}
        onClick={bothKnown && !isLocked ? () => handlePick(match.home.id) : undefined}
        onDropTeam={homeWasPlaceholder && !match.home.isKnown ? tid => onDropTeam(match.id, "home", tid) : undefined}
        onRemove={homeRemovable ? () => onRemoveSlot(match.id, "home") : undefined}
        draggable={homeRemovable}
        isDragOver={homeDragOver}
        onDragOver={setHomeDragOver}
      />

      {/* Thin inner divider */}
      <div className="mx-2.5 h-px bg-white/[0.04]" />

      {/* Away slot */}
      <TeamSlot
        team={awayTeam}
        isWinner={!!winner && winner === match.away.id}
        isLoser={!!winner && winner !== match.away.id}
        isLocked={isLocked}
        onClick={bothKnown && !isLocked ? () => handlePick(match.away.id) : undefined}
        onDropTeam={awayWasPlaceholder && !match.away.isKnown ? tid => onDropTeam(match.id, "away", tid) : undefined}
        onRemove={awayRemovable ? () => onRemoveSlot(match.id, "away") : undefined}
        draggable={awayRemovable}
        isDragOver={awayDragOver}
        onDragOver={setAwayDragOver}
      />

      {/* Bottom padding */}
      <div className="h-1.5" />
    </div>
  );
}
