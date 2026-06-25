"use client";

import { useState } from "react";
import { useLocale } from "@/lib/localeContext";
import { getTeamName } from "@/lib/teamTranslations";

export type LiveGroup = {
  id: string;
  teams: {
    id: string; name: string; flag: string; tla: string;
    position: number; mp: number; w: number; d: number; l: number;
    gf: number; ga: number; pts: number;
  }[];
};

interface Props {
  groups: LiveGroup[];
  loading: boolean;
  filledSlots: Set<string>;
  slotToTeam: Record<string, string>;
  onFillSlot: (slotLabel: string, teamId: string) => void;
  onRemoveByTeamId: (teamId: string) => void;
}

const POS_BADGE: Record<number, string> = {
  1: "bg-amber-400/20 text-amber-300 border-amber-400/30",
  2: "bg-slate-300/15 text-slate-300 border-slate-400/25",
  3: "bg-white/5 text-white/35 border-white/10",
  4: "bg-transparent text-white/15 border-white/5",
};

export default function GroupStandings({ groups, loading, filledSlots, slotToTeam, onFillSlot, onRemoveByTeamId }: Props) {
  const { t, locale } = useLocale();
  // Default: first 4 groups expanded
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["A","B","C","D"]));
  const [showAll, setShowAll] = useState(false);
  const [panelDragOver, setPanelDragOver] = useState(false);

  const visible = showAll ? groups : groups.slice(0, 6);

  function toggle(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function handlePanelDrop(e: React.DragEvent) {
    e.preventDefault(); setPanelDragOver(false);
    const raw = e.dataTransfer.getData("application/json");
    if (raw) { try { const d = JSON.parse(raw); if (d.teamId) { onRemoveByTeamId(d.teamId); return; } } catch {} }
    const tid = e.dataTransfer.getData("teamId");
    if (tid) onRemoveByTeamId(tid);
  }

  const groupLabel = (id: string) => {
    const prefix = locale === "zh" ? "小组 " : locale === "de" ? "Gruppe " :
                   locale === "fr" ? "Groupe " : locale === "es" ? "Grupo " : "Group ";
    return `${prefix}${id}`;
  };

  return (
    <div
      className={`flex flex-col h-full overflow-hidden transition-all ${panelDragOver ? "bg-red-950/30" : ""}`}
      onDragOver={e => { e.preventDefault(); setPanelDragOver(true); }}
      onDragLeave={() => setPanelDragOver(false)}
      onDrop={handlePanelDrop}
    >
      {/* Hint */}
      <div className="px-4 py-2 border-b border-white/[0.06] flex-shrink-0">
        {panelDragOver
          ? <p className="text-[9px] text-red-300/80">Drop here to remove from bracket</p>
          : loading
            ? <p className="text-[9px] text-blue-300/50">⟳ Loading live data…</p>
            : <p className="text-[9px] text-white/20">Click or drag a team to fill a bracket slot · Drag back to remove</p>
        }
      </div>

      {/* Group list */}
      <div className="flex-1 overflow-y-auto">
        {visible.map(group => {
          const open = expanded.has(group.id);
          return (
            <div key={group.id} className="border-b border-white/[0.05]">
              {/* Group header */}
              <button onClick={() => toggle(group.id)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/[0.025] transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                  {groupLabel(group.id)}
                </span>
                <div className="flex items-center gap-3">
                  {/* Mini stats hint */}
                  <span className="text-[8px] text-white/20 uppercase tracking-widest">
                    P &nbsp; GD &nbsp; PTS
                  </span>
                  <span className={`text-[9px] text-white/20 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
                </div>
              </button>

              {open && (
                <table className="w-full border-collapse">
                  <tbody>
                    {group.teams.map((team, idx) => {
                      const pos = idx + 1;
                      const canAdvance = pos <= 3;
                      const slotLabel = pos === 1 ? `1${group.id}` : pos === 2 ? `2${group.id}` : `3${group.id}`;
                      const isFilled = canAdvance && (
                        filledSlots.has(slotLabel) || Object.values(slotToTeam).includes(team.tla)
                      );
                      const draggable = canAdvance && !isFilled;
                      const gd = team.gf - team.ga;
                      const name = getTeamName(team.tla, locale, team.name);

                      return (
                        <tr key={team.id}
                          draggable={draggable}
                          onDragStart={draggable ? e => {
                            e.dataTransfer.setData("teamId", team.tla);
                            e.dataTransfer.setData("application/json", JSON.stringify({ teamId: team.tla, slotLabel }));
                            e.dataTransfer.effectAllowed = "copy";
                          } : e => e.preventDefault()}
                          onClick={() => draggable && onFillSlot(slotLabel, team.tla)}
                          className={`text-[10px] select-none transition-colors
                            ${draggable ? "hover:bg-white/[0.035] cursor-pointer" : "cursor-default"}
                            ${isFilled ? "opacity-35" : !canAdvance ? "opacity-20" : ""}
                          `}
                          title={!canAdvance ? "Eliminated" : isFilled ? t("alreadyFilled") : t("clickToFill")}
                        >
                          {/* Position badge */}
                          <td className="pl-4 pr-2 py-1.5 w-8">
                            <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold border ${POS_BADGE[pos] ?? POS_BADGE[4]}`}>
                              {pos}
                            </span>
                          </td>
                          {/* Flag + name */}
                          <td className="py-1.5 pr-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm leading-none">{team.flag}</span>
                              <span className={`truncate ${isFilled ? "text-white/35" : pos <= 2 ? "text-white/80" : "text-white/55"}`}
                                style={{ maxWidth: 90 }}>
                                {name}
                              </span>
                            </div>
                          </td>
                          {/* P */}
                          <td className="py-1.5 text-center text-white/30 w-6">{team.mp}</td>
                          {/* GD */}
                          <td className="py-1.5 text-center text-white/30 w-8 text-[9px]">
                            {gd > 0 ? `+${gd}` : gd}
                          </td>
                          {/* PTS */}
                          <td className="py-1.5 text-center font-bold text-white/70 w-8">{team.pts}</td>
                          {/* Status icon */}
                          <td className="py-1.5 pr-3 w-5 text-right">
                            {isFilled
                              ? <span className="text-emerald-400/60 text-[9px]">✓</span>
                              : draggable
                                ? <span className="text-white/10 text-[9px] opacity-0 group-hover:opacity-100">→</span>
                                : null
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}

        {/* View all / collapse */}
        {groups.length > 6 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="w-full py-3 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2 border-t border-white/[0.05]"
          >
            <span>{showAll ? "▲ Show less" : `▼ View all groups (${groups.length - 6} more)`}</span>
          </button>
        )}
      </div>
    </div>
  );
}
