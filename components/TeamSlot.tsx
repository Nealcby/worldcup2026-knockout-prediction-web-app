"use client";

import { TeamInfo } from "@/lib/types";
import clsx from "clsx";

interface Props {
  team: TeamInfo;
  isWinner?: boolean;
  isLoser?: boolean;
  isLocked?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  onDropTeam?: (teamId: string) => void;
  isDragOver?: boolean;
  onDragOver?: (over: boolean) => void;
  draggable?: boolean;
}

export default function TeamSlot({
  team, isWinner, isLoser, isLocked, onClick, onRemove,
  onDropTeam, isDragOver, onDragOver, draggable: isDraggable,
}: Props) {
  // isConfirmed = team is group-stage-confirmed in this slot (slot is locked, but match winner is still pickable)
  // isLocked    = official live result exists (match is fully over, nothing is changeable)
  const clickable = !!onClick && !isLocked && team.isKnown;
  const droppable  = !!onDropTeam && !isLocked && !team.isKnown;
  const removable  = !!onRemove && !isLocked && team.isKnown && !team.isConfirmed; // confirmed slots can't be removed

  // Determine visual state
  const isUserWinner     = !isLocked && isWinner;           // blue ●  "Your pick"
  const isOfficialWinner = isLocked && isWinner;            // amber ○ "Official result"
  const isConfirmedSlot  = !isLocked && !isWinner && !isLoser && team.isKnown && team.isConfirmed; // green ✓ "Confirmed"

  function handleDragOver(e: React.DragEvent) {
    if (!droppable) return;
    e.preventDefault(); e.dataTransfer.dropEffect = "copy"; onDragOver?.(true);
  }
  function handleDrop(e: React.DragEvent) {
    if (!droppable) return;
    e.preventDefault(); onDragOver?.(false);
    const tid = e.dataTransfer.getData("teamId");
    if (tid) onDropTeam(tid);
  }

  return (
    <div className="relative group/slot flex"
      draggable={isDraggable && !isLocked}
      onDragStart={isDraggable && !isLocked ? e => {
        e.dataTransfer.setData("teamId", team.id);
        e.dataTransfer.setData("application/json", JSON.stringify({ teamId: team.id }));
        e.dataTransfer.effectAllowed = "move";
      } : undefined}
    >
      {/* Left accent bar */}
      <div className={clsx(
        "w-[3px] flex-shrink-0 self-stretch rounded-l",
        isUserWinner     && "bg-blue-400",
        isOfficialWinner && "bg-amber-400",
        isConfirmedSlot  && "bg-emerald-500/60",
        !isUserWinner && !isOfficialWinner && !isConfirmedSlot && "bg-transparent",
      )} />

      <button
        onClick={clickable ? onClick : undefined}
        disabled={!clickable && !droppable}
        onDragOver={handleDragOver}
        onDragLeave={() => onDragOver?.(false)}
        onDrop={handleDrop}
        className={clsx(
          "flex items-center gap-2 px-2 h-[28px] text-[11px] font-medium flex-1 min-w-0 overflow-hidden text-left transition-all duration-100",
          removable && "pr-6",

          // ── User pick winner (blue)
          isUserWinner && "bg-blue-500/10 text-blue-100",

          // ── Official winner (amber)
          isOfficialWinner && "bg-amber-400/12 text-amber-100",

          // ── Official loser
          isLocked && !isWinner && team.isKnown && "text-white/25",

          // ── User-predicted loser
          !isLocked && isLoser && "text-white/25",

          // ── Confirmed from API (group stage done) — green tint
          isConfirmedSlot && "bg-emerald-500/[0.05] text-white/55 cursor-default",

          // ── Normal user-placed (not winner/loser/confirmed)
          !isLocked && !isWinner && !isLoser && team.isKnown && !team.isConfirmed && clickable &&
            "text-white hover:bg-white/[0.05] cursor-pointer",
          !isLocked && !isWinner && !isLoser && team.isKnown && !team.isConfirmed && !clickable &&
            "text-white cursor-default",

          // ── Empty droppable
          droppable && !isDragOver && "text-white/20 cursor-default hover:bg-white/[0.025]",
          droppable && isDragOver  && "bg-blue-500/15 text-blue-300",

          // ── Empty non-droppable placeholder
          !team.isKnown && !droppable && "text-white/18 cursor-default",
        )}
      >
        {/* Flag / dot / empty box */}
        {team.isKnown && team.flag
          ? <span className="text-sm leading-none flex-shrink-0">{team.flag}</span>
          : team.isKnown
            ? <span className="w-4 h-4 flex-shrink-0" />
            : <span className="w-3 h-3 rounded-sm border border-white/[0.08] flex-shrink-0" />
        }

        {/* Name */}
        <span className="truncate flex-1 min-w-0">
          {team.isKnown
            ? team.name
            : <span className="font-mono text-[9px] tracking-widest opacity-60">{team.name}</span>
          }
        </span>

        {/* State indicator (right side) */}
        {isUserWinner && (
          <span className="flex-shrink-0 w-3 h-3 rounded-full bg-blue-400 ring-2 ring-blue-400/30 shadow-[0_0_6px_rgba(96,165,250,0.6)]" />
        )}
        {isOfficialWinner && (
          <span className="flex-shrink-0 w-3 h-3 rounded-full border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
        )}
        {isConfirmedSlot && (
          <span className="flex-shrink-0 text-emerald-400 text-[10px] font-bold leading-none">✓</span>
        )}
        {!isUserWinner && !isOfficialWinner && !isConfirmedSlot && team.isKnown && (
          <span className="flex-shrink-0 text-white/12 text-[10px] leading-none">–</span>
        )}
      </button>

      {/* × remove button */}
      {removable && (
        <button
          onClick={e => { e.stopPropagation(); onRemove!(); }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-[11px] text-white/20 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover/slot:opacity-100 transition-all z-10"
        >×</button>
      )}
    </div>
  );
}
