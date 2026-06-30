"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Bracket from "./Bracket";
import TeamPanel, { PanelTeam } from "./TeamPanel";
import GroupStandings, { LiveGroup } from "./GroupStandings";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTheme } from "@/lib/themeContext";
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
  const { t } = useLocale();
  const { theme, toggle: toggleTheme } = useTheme();
  const [predictions, setPredictions] = useState<Predictions>({});
  const [slots, setSlots] = useState<SlotAssignments>({});
  const [leftTab, setLeftTab] = useState<LeftTab>("groups");
  const [copied, setCopied] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);     // mobile drawer
  const [panelCollapsed, setPanelCollapsed] = useState(false); // desktop collapse
  const bracketRef = useRef<HTMLDivElement>(null);

  const [groups, setGroups] = useState<LiveGroup[]>([]);
  const [apiSlotMap, setApiSlotMap] = useState<Record<string, string>>({});
  const [teamMap, setTeamMap] = useState<Record<string, { name: string; flag: string }>>({});
  const [matchSchedule, setMatchSchedule] = useState<Record<string, { date: string; time: string }>>({});
  const [liveResultsById, setLiveResultsById] = useState<Record<string, string>>({});
  const [liveScores, setLiveScores] = useState<Record<string, { home: string; away: string }>>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("p");
    if (shared) {
      const decoded = decodePredictions(shared);
      // Batch both state updates in a single tick to avoid cascading renders
      setTimeout(() => {
        setPredictions((decoded.preds ?? decoded) as Predictions);
        setSlots((decoded.slots ?? {}) as SlotAssignments);
      }, 0);
    } else {
      setTimeout(() => {
        setPredictions(loadPredictions());
        setSlots(loadSlots());
      }, 0);
    }
  }, []);

  useEffect(() => {
    fetch("/api/tournament")
      .then(r => r.json())
      .then(data => {
        if (data.groups?.length) {
          const map: Record<string, { name: string; flag: string }> = {};
          for (const g of data.groups as LiveGroup[])
            for (const team of g.teams) map[team.tla] = { name: team.name, flag: team.flag };
          // Batch all state updates together
          setGroups(data.groups);
          setTeamMap(map);
          setApiSlotMap(data.slotMap ?? {});
          setMatchSchedule(data.matchSchedule ?? {});
          setLiveResultsById(data.liveResultsById ?? {});
          setLiveScores(data.liveScores ?? {});
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
          setMatchSchedule(data.matchSchedule ?? {});
          setLiveResultsById(data.liveResultsById ?? {});
          setLiveScores(data.liveScores ?? {});
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
  // Apply API-accurate EDT times over bracketData fallback times
  const resolvedMatches = buildResolvedMatches(predictions, liveResultsById, slotsApplied)
    .map(m => matchSchedule[m.id] ? { ...m, ...matchSchedule[m.id] } : m);

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

  // Build complete eliminated set:
  // 1. Position-4 teams (group stage eliminated)
  const pos4 = groups.flatMap(g => g.teams.filter(t => t.position === 4).map(t => t.tla));

  // 2. Position-3 teams whose group is complete (3+ MP) but NOT in the best-8 third-place slots
  const qualifiedThirds = new Set(
    Object.entries(apiSlotMap).filter(([k]) => k.startsWith("3")).map(([, v]) => v)
  );
  const eliminatedThirds = groups.flatMap(g =>
    g.teams.filter(t => t.position === 3 && t.mp >= 3 && !qualifiedThirds.has(t.tla)).map(t => t.tla)
  );

  // 3. Losers of completed R32/R16/QF/SF matches (from API live results)
  const eliminatedByResult: string[] = [];
  resolvedMatches.forEach(m => {
    const winner = liveResultsById[m.id];
    if (!winner) return;
    const loserTeam = m.home.id === winner ? m.away : m.home;
    if (loserTeam.isKnown && loserTeam.id !== winner) eliminatedByResult.push(loserTeam.id);
  });

  const eliminatedTeamIds = new Set<string>([...pos4, ...eliminatedThirds, ...eliminatedByResult]);

  const panelContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-white/[0.07] flex-shrink-0">
        {(["groups","teams"] as LeftTab[]).map(tab => (
          <button key={tab} onClick={() => setLeftTab(tab)}
            className={`flex-1 text-[10px] py-2.5 font-semibold uppercase tracking-[0.14em] transition-all ${
              leftTab === tab
                ? "text-white border-b-2 border-blue-500"
                : "text-white/25 hover:text-white/50"
            }`}>
            {t(tab as "groups" | "teams")}
          </button>
        ))}
      </div>
      {leftTab === "groups" ? (
        <GroupStandings
          groups={groups}
          loading={dataLoading}
          filledSlots={filledSlots}
          slotToTeam={slotToTeam}
          eliminatedTeamIds={eliminatedTeamIds}
          onRemoveByTeamId={handleRemoveByTeamId}
        />
      ) : (
        <TeamPanel
          teams={panelTeams}
          usedTeamIds={usedTeamIds}
          eliminatedTeamIds={eliminatedTeamIds}
          onRemoveByTeamId={handleRemoveByTeamId}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col text-white" style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-white/[0.07]" style={{ background: "var(--bg-header)" }}>
        <div className="flex items-center px-4 py-3 gap-3">

          {/* Mobile panel toggle */}
          <button
            onClick={() => setPanelOpen(v => !v)}
            className="lg:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.1] text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-all text-sm"
            aria-label="Toggle team panel"
          >☰</button>

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-600/20 border border-amber-400/20 flex items-center justify-center text-lg">
              🏆
            </div>
            <div className="hidden sm:block">
              <h1 className="text-[13px] font-semibold text-white leading-tight">World Cup 2026 Predictor</h1>
              <p className="text-[10px] text-white/35">Predict the path. Share your champion.</p>
            </div>
          </div>

          {/* Legend — hidden on small mobile, centered on md+ */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-4">
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
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {/* Dark / Light toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all text-base"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
            <LanguageSwitcher />
            <button onClick={handleReset}
              className="hidden sm:flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/15 hover:bg-white/[0.04] transition-all">
              ↺ {t("reset")}
            </button>
            <button onClick={handleShare}
              className={`hidden sm:flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-all ${
                copied
                  ? "border-emerald-400/40 text-emerald-300 bg-emerald-500/10"
                  : "border-white/[0.12] text-white/60 hover:border-white/25 hover:bg-white/[0.04]"
              }`}>
              🔗 {copied ? t("copied") : t("shareLink")}
            </button>
            {/* Mobile: compact share button */}
            <button onClick={handleShare}
              className={`sm:hidden w-8 h-8 flex items-center justify-center rounded-lg border text-[13px] transition-all ${
                copied ? "border-emerald-400/40 text-emerald-300" : "border-white/[0.12] text-white/50"
              }`}>🔗</button>
            <button onClick={handleDownloadImage}
              className="hidden sm:flex items-center gap-1.5 text-[11px] px-4 py-1.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 transition-all">
              ↓ {t("downloadImage")}
            </button>
            {/* Mobile: icon-only download */}
            <button onClick={handleDownloadImage}
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[13px] transition-all">↓</button>
          </div>
        </div>

        {/* Sub-bar: hint — hidden on mobile to save space */}
        <div className="hidden md:flex px-5 py-1.5 border-t border-white/[0.04] text-[9px] text-white/20 tracking-wide">
          ✦ {t("instructions")}
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative" data-theme-content>

        {/* Mobile overlay backdrop */}
        {panelOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-20"
            onClick={() => setPanelOpen(false)}
          />
        )}

        {/* Left panel — drawer on mobile/tablet, collapsible sidebar on desktop */}
        <div className={`
          flex-col border-r border-white/[0.07] z-30
          fixed lg:relative inset-y-0 left-0 transition-all duration-300 ease-in-out overflow-hidden
          ${panelOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-shrink-0
        `} style={{ background: "var(--bg-panel)",
          width: panelCollapsed ? 0 : (leftTab === "groups" ? 264 : 212),
          top: 0, bottom: 0,
        }}>
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/[0.07] flex-shrink-0">
            <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Teams Panel</span>
            <button onClick={() => setPanelOpen(false)} className="text-white/40 hover:text-white/80 text-lg leading-none">✕</button>
          </div>
          {panelContent}
        </div>

        {/* Desktop collapse toggle — sits on the border between panel and bracket */}
        <button
          onClick={() => setPanelCollapsed(v => !v)}
          className="hidden lg:flex flex-shrink-0 self-start mt-3 w-5 items-center justify-center rounded-r-md border border-l-0 border-white/[0.08] text-white/25 hover:text-white/70 hover:bg-white/[0.05] transition-all z-10"
          style={{ background: "var(--bg-panel)", height: 48 }}
          title={panelCollapsed ? "Expand panel" : "Collapse panel"}
        >
          <span className="text-[10px]">{panelCollapsed ? "›" : "‹"}</span>
        </button>

        {/* Bracket area */}
        <div className="flex-1 overflow-auto p-3 sm:p-5" style={{ background: "var(--bg-page)" }}>
          {/* Mobile legend (shown only below md) */}
          <div className="flex md:hidden items-center justify-center gap-4 mb-3 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-[10px] text-white/45">Your pick</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border-2 border-amber-400 bg-amber-400/15" />
              <span className="text-[10px] text-white/45">Official</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-emerald-400">✓</span>
              <span className="text-[10px] text-white/45">Qualified</span>
            </div>
          </div>

          {/* Mobile reset/share row */}
          <div className="flex sm:hidden items-center gap-2 mb-3">
            <button onClick={handleReset}
              className="flex-1 text-[10px] py-2 rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 transition-all">
              ↺ {t("reset")}
            </button>
            <button onClick={handleShare}
              className={`flex-1 text-[10px] py-2 rounded-lg border font-medium transition-all ${
                copied ? "border-emerald-400/40 text-emerald-300" : "border-white/[0.12] text-white/50"
              }`}>
              🔗 {copied ? t("copied") : t("shareLink")}
            </button>
          </div>

          <div ref={bracketRef} className="inline-block rounded-2xl p-3 sm:p-5" style={{ background: "var(--bg-bracket)" }}>
            <Bracket
              matches={resolvedMatches}
              predictions={predictions}
              liveResults={liveResultsById}
              liveScores={liveScores}
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
