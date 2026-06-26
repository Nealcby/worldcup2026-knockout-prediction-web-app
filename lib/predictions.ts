"use client";

import { Match, Predictions, TeamInfo } from "./types";
import { INITIAL_MATCHES } from "./bracketData";

const STORAGE_KEY = "wc2026_predictions";

export function loadPredictions(): Predictions {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function savePredictions(p: Predictions) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function encodePredictions(data: unknown): string {
  return btoa(JSON.stringify(data));
}

export function decodePredictions(encoded: string): Record<string, unknown> {
  try { return JSON.parse(atob(encoded)); }
  catch { return {}; }
}

// Resolve a placeholder label (e.g. "W74", "RU101") against known match results / predictions
export function resolveTeam(
  label: string,
  matches: Match[],
  predictions: Predictions,
  liveResults: Record<string, string>
): TeamInfo {
  const winnerMatch = label.match(/^W(\d+)$/);
  if (winnerMatch) {
    const matchId = "M" + winnerMatch[1];
    const match = matches.find((m) => m.id === matchId);
    if (!match) return { id: label, name: label, isKnown: false };
    const winnerId = liveResults[matchId] ?? predictions[matchId];
    if (winnerId) {
      if (match.home.id === winnerId) return { ...match.home, isKnown: true };
      if (match.away.id === winnerId) return { ...match.away, isKnown: true };
      // Neither slot matches yet — slots are unresolved placeholders; multi-pass will retry
    }
    return { id: label, name: label, isKnown: false };
  }

  const ruMatch = label.match(/^RU(\d+)$/);
  if (ruMatch) {
    const matchId = "M" + ruMatch[1];
    const match = matches.find((m) => m.id === matchId);
    if (!match) return { id: label, name: label, isKnown: false };
    const winnerId = liveResults[matchId] ?? predictions[matchId];
    if (winnerId) {
      if (match.home.id === winnerId) return { ...match.away, isKnown: true };
      if (match.away.id === winnerId) return { ...match.home, isKnown: true };
      // Neither slot matches yet — multi-pass will retry
    }
    return { id: label, name: label, isKnown: false };
  }

  return { id: label, name: label, isKnown: false };
}

// Build fully resolved match list.
// baseMatches: initial matches already patched with slot assignments (from BracketPage)
// Multiple passes are needed: W90 in QF depends on M90 whose slots (W73, W75) are
// only resolved in a prior pass. 6 passes covers R32→R16→QF→SF→Final depth.
export function buildResolvedMatches(
  predictions: Predictions,
  liveResults: Record<string, string>,
  baseMatches: Match[] = INITIAL_MATCHES
): Match[] {
  let resolved = baseMatches;
  for (let pass = 0; pass < 6; pass++) {
    resolved = resolved.map((m) => ({
      ...m,
      home: m.home.isKnown
        ? m.home
        : resolveTeam(m.home.id, resolved, predictions, liveResults),
      away: m.away.isKnown
        ? m.away
        : resolveTeam(m.away.id, resolved, predictions, liveResults),
    }));
  }
  return resolved;
}
