"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Bracket from "./Bracket";
import TeamPanel, { PanelTeam } from "./TeamPanel";
import GroupStandings, { LiveGroup } from "./GroupStandings";
import LanguageSwitcher from "./LanguageSwitcher";
import { Predictions, TeamInfo } from "@/lib/types";
import { useLocale } from "@/lib/localeContext";
import {
  buildResolvedMatches,
  decodePredictions,
  encodePredictions,
  loadPredictions,
  savePredictions,
} from "@/lib/predictions";
import { INITIAL_MATCHES } from "@/lib/bracketData";

const SLOT_KEY = "wc2026_slots";
type SlotAssignments = Record<string, string>;

function loadSlots(): SlotAssignments {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(SLOT_KEY) ?? "{}"); } catch { return {}; }
}
function saveSlots(s: SlotAssignments) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SLOT_KEY, JSON.stringify(s));
}

function makeTeamInfo(
  tla: string,
  teamMap: Record<string, { name: string; flag: string }>,
  confirmed: boolean
): TeamInfo {
  const t = teamMap[tla];
  return { id: tla, name: t?.name ?? tla, flag: t?.flag, isKnown: true, isConfirmed: confirmed };
}

function applySlots(
  slots: SlotAssignments,
  apiSlotMap: Record<string, string>,
  teamMap: Record<string, { name: string; flag: string }>
) {
  return INITIAL_MATCHES.map(m => {
    const resolveSlot = (slot: TeamInfo) => {
      if (slot.isKnown) return slot;
      const fromApi = apiSlotMap[slot.id];
      if (fromApi) return makeTeamInfo(fromApi, teamMap, true);
      const fromUser = slots[slot.id];
      if (fromUser) return makeTeamInfo(fromUser, teamMap, false);
      return slot;
    };
    return { ...m, home: resolveSlot(m.home), away: resolveSlot(m.away) };
  });
}

type LeftTab = "groups" | "teams";

export default function BracketPage() {
  const { t, locale } = useLocale();
  const [predictions, setPredictions] = useState<Predictions>({});
  const [slots, setSlots] = useState<SlotAssignments>({});
  const [leftTab, setLeftTab] = useState<LeftTab>("groups");
  const [copied, setCopied] = useState(false);
  const bracketRef = useRef<HTMLDivElement>(null);

  const [groups, setGroups] = useState<LiveGroup[]>([]);
  const [apiSlotMap, setApiSlotMap] = useState<Record<string, string>>({});
  const [teamMap, setTeamMap] = useState<Record<string, { name: string; flag: string }>>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("p");
    if (shared) {
      const decoded = decodePredictions(shared);
      setPredictions(decoded.preds ?? decoded);
      setSlots(decoded.slots ?? {});
    } else {
      setPredictions(loadPredictions());
      setSlots(loadSlots());
    }
  }, []);

  useEffect(() => {
    setDataLoading(true);
    fetch("/api/tournament")
      .then(r => r.json())
      .then(data => {
        if (data.groups?.length) {
          setGroups(data.groups);
          const map: Record<string, { name: string; flag: string }> = {};
          for (const g of data.groups as LiveGroup[])
            for (const team of g.teams) map[team.tla] = { name: team.name, flag: team.flag };
          setTeamMap(map);
          setApiSlotMap(data.slotMap ?? {});
        }
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      fetch("/api/tournament").then(r => r.json()).then(data => {
        if (data.groups?.length) {
          setGroups(data.groups);
          const map: Record<string, { name: string; flag: string }> = {};
          for (const g of data.groups as LiveGroup[])
            for (const team of g.teams) map[team.tla] = { name: team.name, flag: team.flag };
          setTeamMap(map);
          setApiSlotMap(data.slotMap ?? {});
        }
      }).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  function assignSlot(slotLabel: string, teamId: string) {
    setSlots(prev => {
      const cleaned: SlotAssignments = {};
      for (const [k, v] of Object.entries(prev)) if (v !== teamId) cleaned[k] = v;
      cleaned[slotLabel] = teamId;
      saveSlots(cleaned);
      return cleaned;
    });
  }

  function handleDropTeam(matchId: string, slotPos: "home" | "away", teamId: string) {
    const match = INITIAL_MATCHES.find(m => m.id === matchId);
    if (!match) return;
    const placeholder = slotPos === "home" ? match.home : match.away;
    if (placeholder.isKnown) return;
    assignSlot(placeholder.id, teamId);
  }

  const handleRemoveByTeamId = useCallback((teamId: string) => {
    setSlots(prev => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(next)) { if (v === teamId) { delete next[k]; break; } }
      saveSlots(next);
      return next;
    });
    setPredictions(prev => {
      const next = { ...prev };
      const resolved = buildResolvedMatches(next, {}, applySlots({}, apiSlotMap, teamMap));
      resolved.forEach(m => {
        if ((m.home.id === teamId || m.away.id === teamId) && next[m.id]) delete next[m.id];
      });
      savePredictions(next);
      return next;
    });
  }, [apiSlotMap, teamMap]);

  function handleRemoveSlot(matchId: string, slotPos: "home" | "away") {
    const match = INITIAL_MATCHES.find(m => m.id === matchId);
    if (!match) return;
    const placeholder = slotPos === "home" ? match.home : match.away;
    if (placeholder.isKnown) return;
    setSlots(prev => { const next = { ...prev }; delete next[placeholder.id]; saveSlots(next); return next; });
    setPredictions(prev => {
      const next = { ...prev };
      delete next[matchId];
      cascadeClear(matchId, next);
      savePredictions(next);
      return next;
    });
  }

  function handlePick(matchId: string, teamId: string) {
    setPredictions(prev => {
      const next = { ...prev };
      if (!teamId) { delete next[matchId]; cascadeClear(matchId, next); } else next[matchId] = teamId;
      savePredictions(next);
      return next;
    });
  }

  function cascadeClear(changedMatchId: string, preds: Predictions) {
    const base = applySlots(slots, apiSlotMap, teamMap);
    const resolved = buildResolvedMatches(preds, {}, base);
    resolved.forEach(m => {
      const num = changedMatchId.slice(1);
      if ((m.home.id === `W${num}` || m.away.id === `W${num}`) && preds[m.id]) {
        delete preds[m.id]; cascadeClear(m.id, preds);
      }
    });
  }

  function handleShare() {
    const encoded = encodePredictions({ preds: predictions, slots });
    const url = `${window.location.origin}${window.location.pathname}?p=${encoded}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  }

  async function handleDownloadImage() {
    const el = bracketRef.current;
    if (!el) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(el, { backgroundColor: "#07090f", pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = "wc2026-bracket.png";
    link.href = dataUrl;
    link.click();
  }

  function handleReset() {
    if (!confirm(t("resetConfirm"))) return;
    setPredictions({}); setSlots({});
    savePredictions({}); saveSlots({});
  }

  const slotsApplied = applySlots(slots, apiSlotMap, teamMap);
  const resolvedMatches = buildResolvedMatches(predictions, {}, slotsApplied);

  const usedTeamIds = new Set<string>();
  resolvedMatches.forEach(m => {
    if (m.home.isKnown) usedTeamIds.add(m.home.id);
    if (m.away.isKnown) usedTeamIds.add(m.away.id);
  });

  const filledSlots = new Set([...Object.keys(slots), ...Object.keys(apiSlotMap)]);
  const slotToTeam = { ...apiSlotMap, ...slots };
  const panelTeams: PanelTeam[] = Object.entries(teamMap).map(([tla, info]) => ({
    id: tla, name: info.name, flag: info.flag,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f1a] text-white">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-[#0f1420] border-b border-white/[0.07]">
        <div className="flex items-center px-5 py-3 gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-600/20 border border-amber-400/20 flex items-center justify-center text-xl">
              🏆
            </div>
            <div>
              <h1 className="text-[13px] font-semibold text-white leading-tight">World Cup 2026 Predictor</h1>
              <p className="text-[10px] text-white/35">Predict the path. Share your champion.</p>
            </div>
          </div>

          {/* Legend — centred */}
          <div className="flex-1 flex items-center justify-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.7)]" />
              <span className="text-[11px] text-white/50">Your pick</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
              <span className="text-[11px] text-white/50">Official result</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-emerald-400">✓</span>
              <span className="text-[11px] text-white/50">Qualified</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSwitcher />
            <button onClick={handleReset}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/15 hover:bg-white/[0.04] transition-all">
              ↺ {t("reset")}
            </button>
            <button onClick={handleShare}
              className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-all ${
                copied
                  ? "border-emerald-400/40 text-emerald-300 bg-emerald-500/10"
                  : "border-white/[0.12] text-white/60 hover:border-white/25 hover:bg-white/[0.04]"
              }`}>
              🔗 {copied ? t("copied") : t("shareLink")}
            </button>
            <button onClick={handleDownloadImage}
              className="flex items-center gap-1.5 text-[11px] px-4 py-1.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 transition-all">
              ↓ {t("downloadImage")}
            </button>
          </div>
        </div>

        {/* Sub-bar: hint */}
        <div className="px-5 py-1.5 border-t border-white/[0.04] text-[9px] text-white/20 tracking-wide">
          ✦ {t("instructions")}
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <div className="flex flex-col flex-shrink-0 bg-[#0d1220] border-r border-white/[0.07]" style={{ width: leftTab === "groups" ? 264 : 212 }}>
          {/* Tab bar */}
          <div className="flex border-b border-white/[0.07]">
            {(["groups","teams"] as LeftTab[]).map(tab => (
              <button key={tab} onClick={() => setLeftTab(tab)}
                className={`flex-1 text-[10px] py-2.5 font-semibold uppercase tracking-[0.14em] transition-all ${
                  leftTab === tab
                    ? "text-white border-b-2 border-blue-500"
                    : "text-white/25 hover:text-white/50"
                }`}>
                {t(tab as any)}
              </button>
            ))}
          </div>

          {leftTab === "groups" ? (
            <GroupStandings
              groups={groups}
              loading={dataLoading}
              filledSlots={filledSlots}
              slotToTeam={slotToTeam}
              onFillSlot={assignSlot}
              onRemoveByTeamId={handleRemoveByTeamId}
            />
          ) : (
            <TeamPanel
              teams={panelTeams}
              usedTeamIds={usedTeamIds}
              onRemoveByTeamId={handleRemoveByTeamId}
            />
          )}
        </div>

        {/* Bracket */}
        <div className="flex-1 overflow-auto p-5">
          <div ref={bracketRef} className="inline-block rounded-2xl p-5" style={{ background: "#0b0f1a" }}>
            <Bracket
              matches={resolvedMatches}
              predictions={predictions}
              liveResults={{}}
              onPick={handlePick}
              onDropTeam={handleDropTeam}
              onRemoveSlot={handleRemoveSlot}
            />
          </div>
        </div>
      </div>

      <footer className="flex-shrink-0 px-5 py-2 border-t border-white/[0.04] text-[9px] text-white/15 text-center">
        {t("dataCredit")}
      </footer>
    </div>
  );
}
