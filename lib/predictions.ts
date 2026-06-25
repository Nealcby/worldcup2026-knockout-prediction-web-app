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

export function decodePredictions(encoded: string): any {
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
      const t = match.home.id === winnerId ? match.home : match.away;
      return { ...t, isKnown: true };
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
      const t = match.home.id === winnerId ? match.away : match.home;
      return { ...t, isKnown: true };
    }
    return { id: label, name: label, isKnown: false };
  }

  return { id: label, name: label, isKnown: false };
}

// Build fully resolved match list.
// baseMatches: initial matches already patched with slot assignments (from BracketPage)
export function buildResolvedMatches(
  predictions: Predictions,
  liveResults: Record<string, string>,
  baseMatches: Match[] = INITIAL_MATCHES
): Match[] {
  return baseMatches.map((m) => ({
    ...m,
    home: m.home.isKnown
      ? m.home
      : resolveTeam(m.home.id, baseMatches, predictions, liveResults),
    away: m.away.isKnown
      ? m.away
      : resolveTeam(m.away.id, baseMatches, predictions, liveResults),
  }));
}
