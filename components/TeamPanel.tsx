"use client";

import { useState } from "react";
import { useLocale } from "@/lib/localeContext";
import { getTeamName } from "@/lib/teamTranslations";

export type PanelTeam = {
  id: string;
  name: string;
  flag: string;
  confederation?: string;
};

interface Props {
  teams: PanelTeam[];
  usedTeamIds: Set<string>;
  eliminatedTeamIds: Set<string>;
  onRemoveByTeamId: (teamId: string) => void;
}

const CONFEDERATIONS = ["UEFA","CONMEBOL","CONCACAF","CAF","AFC","OFC"];
const CONF_COLORS: Record<string, string> = {
  UEFA:     "border-blue-400/40 text-blue-300 bg-blue-400/8",
  CONMEBOL: "border-emerald-400/40 text-emerald-300 bg-emerald-400/8",
  CONCACAF: "border-orange-400/40 text-orange-300 bg-orange-400/8",
  CAF:      "border-yellow-400/40 text-yellow-300 bg-yellow-400/8",
  AFC:      "border-red-400/40 text-red-300 bg-red-400/8",
  OFC:      "border-purple-400/40 text-purple-300 bg-purple-400/8",
};

export default function TeamPanel({ teams, usedTeamIds, eliminatedTeamIds, onRemoveByTeamId }: Props) {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const [activeConf, setActiveConf] = useState<string | null>(null);
  const [panelDragOver, setPanelDragOver] = useState(false);

  const filtered = teams.filter(team => {
    const name = getTeamName(team.id, locale, team.name);
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      team.id.toLowerCase().includes(search.toLowerCase());
    const matchConf = !activeConf || team.confederation === activeConf;
    return matchSearch && matchConf;
  });

  const available  = filtered.filter(t => !usedTeamIds.has(t.id) && !eliminatedTeamIds.has(t.id));
  const eliminated = filtered.filter(t => !usedTeamIds.has(t.id) && eliminatedTeamIds.has(t.id));
  const placed     = filtered.filter(t => usedTeamIds.has(t.id));

  function handlePanelDrop(e: React.DragEvent) {
    e.preventDefault();
    setPanelDragOver(false);
    const raw = e.dataTransfer.getData("application/json");
    if (raw) {
      try { const d = JSON.parse(raw); if (d.teamId) { onRemoveByTeamId(d.teamId); return; } } catch {}
    }
    const teamId = e.dataTransfer.getData("teamId");
    if (teamId) onRemoveByTeamId(teamId);
  }

  return (
    <div
      className={`flex flex-col h-full w-52 flex-shrink-0 transition-all duration-200 ${
        panelDragOver
          ? "bg-red-950/40 border-r border-red-500/30"
          : "bg-transparent border-r border-white/[0.06]"
      }`}
      onDragOver={e => { e.preventDefault(); setPanelDragOver(true); }}
      onDragLeave={() => setPanelDragOver(false)}
      onDrop={handlePanelDrop}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-3.5 rounded-full bg-gradient-to-b from-purple-400 to-purple-600" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
            {t("allTeams")}
          </span>
        </div>
        {/* Search */}
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25 text-[10px]">⌕</span>
          <input
            type="text"
            placeholder={t("search")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-white placeholder-white/20 outline-none focus:border-blue-400/40 focus:bg-white/[0.06] transition-all duration-150"
          />
        </div>
        {panelDragOver && (
          <p className="text-[9px] text-red-300/80 mt-2">Drop here to remove from bracket</p>
        )}
      </div>

      {/* Confederation filter */}
      <div className="px-3 py-2 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveConf(null)}
            className={`text-[8px] px-2 py-0.5 rounded-full border font-medium transition-all ${
              !activeConf
                ? "bg-white/15 border-white/30 text-white"
                : "border-white/[0.08] text-white/25 hover:text-white/50 hover:border-white/20"
            }`}>
            All
          </button>
          {CONFEDERATIONS.map(c => (
            <button key={c}
              onClick={() => setActiveConf(activeConf === c ? null : c)}
              className={`text-[8px] px-2 py-0.5 rounded-full border font-medium transition-all ${
                activeConf === c
                  ? CONF_COLORS[c]
                  : "border-white/[0.08] text-white/25 hover:text-white/50 hover:border-white/20"
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Team list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {available.length === 0 && placed.length === 0 && eliminated.length === 0 && (
          <div className="text-[10px] text-white/20 text-center py-6">—</div>
        )}

        {/* Available teams */}
        <div className="space-y-0.5">
          {available.map(team => {
            const displayName = getTeamName(team.id, locale, team.name);
            return (
              <div
                key={team.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData("teamId", team.id);
                  e.dataTransfer.setData("application/json", JSON.stringify({ teamId: team.id }));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] cursor-grab active:cursor-grabbing hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all duration-100 select-none group"
              >
                <span className="text-base leading-none flex-shrink-0">{team.flag}</span>
                <span className="text-white/80 truncate flex-1 group-hover:text-white transition-colors">{displayName}</span>
              </div>
            );
          })}
        </div>

        {/* Placed teams */}
        {placed.length > 0 && (
          <>
            <div className="flex items-center gap-2 my-2 px-1">
              <div className="h-px flex-1 bg-white/[0.04]" />
              <span className="text-[8px] text-white/15 uppercase tracking-widest">Placed ✓</span>
              <div className="h-px flex-1 bg-white/[0.04]" />
            </div>
            <div className="space-y-0.5">
              {placed.map(team => {
                const displayName = getTeamName(team.id, locale, team.name);
                return (
                  <div key={team.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] select-none opacity-30 cursor-not-allowed"
                    title={`${displayName} already placed`}
                  >
                    <span className="text-base leading-none flex-shrink-0">{team.flag}</span>
                    <span className="text-white/60 truncate flex-1">{displayName}</span>
                    <span className="text-[11px] font-bold text-emerald-400 flex-shrink-0">✓</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Eliminated teams — not draggable */}
        {eliminated.length > 0 && (
          <>
            <div className="flex items-center gap-2 my-2 px-1">
              <div className="h-px flex-1 bg-white/[0.04]" />
              <span className="text-[8px] text-red-400/30 uppercase tracking-widest">Eliminated</span>
              <div className="h-px flex-1 bg-white/[0.04]" />
            </div>
            <div className="space-y-0.5">
              {eliminated.map(team => {
                const displayName = getTeamName(team.id, locale, team.name);
                return (
                  <div key={team.id}
                    draggable={false}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] select-none opacity-20 cursor-not-allowed"
                    title={`${displayName} eliminated`}
                  >
                    <span className="text-base leading-none flex-shrink-0 grayscale">{team.flag}</span>
                    <span className="text-white/40 truncate flex-1 line-through decoration-white/20">{displayName}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/[0.04] text-[8px] text-white/15 text-center flex-shrink-0 tracking-wide">
        {t("dragHint")} · drag back to remove
      </div>
    </div>
  );
}
