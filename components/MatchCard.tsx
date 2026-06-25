"use client";

import { useState } from "react";
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

  return (
    <div className="bg-[#141927] border border-white/[0.08] rounded-xl overflow-hidden">
      {/* Date/time */}
      {match.date && (
        <div className="flex items-center gap-1 px-2.5 pt-2 pb-0.5">
          <span className="text-[8px] text-white/25 uppercase tracking-wide">
            {match.date}{match.time ? ` – ${match.time}` : ""}
          </span>
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
