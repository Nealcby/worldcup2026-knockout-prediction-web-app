"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const DARK_VARS = `
  --bg-page: #0b0f1a;
  --bg-header: #0f1420;
  --bg-panel: #0d1220;
  --bg-card: #141927;
  --bg-bracket: #0b0f1a;
  --text-primary: #f0f4ff;
  --text-secondary: rgba(240,244,255,0.60);
  --text-muted: rgba(240,244,255,0.30);
  --border-subtle: rgba(255,255,255,0.07);
  --border-medium: rgba(255,255,255,0.12);
  --scrollbar-thumb: rgba(255,255,255,0.12);
  --scrollbar-hover: rgba(255,255,255,0.22);
`;

const LIGHT_VARS = `
  --bg-page:    #f2f5ff;
  --bg-header:  #1a3480;
  --bg-panel:   #ffffff;
  --bg-card:    #ffffff;
  --bg-bracket: #e8eeff;

  --text-primary:   #0a0d14;
  --text-secondary: #1f2937;
  --text-muted:     #4b5563;

  --border-subtle:  rgba(0,0,0,0.09);
  --border-medium:  rgba(0,0,0,0.16);

  --scrollbar-thumb: rgba(0,0,0,0.15);
  --scrollbar-hover: rgba(0,0,0,0.28);
`;

function buildLightOverrideCSS() {
  /* Colour palette constants */
  const T1 = "#0a0d14";  /* primary text — near black */
  const T2 = "#1f2937";  /* secondary text — dark gray */
  const TM = "#4b5563";  /* muted text — medium gray */
  const B1 = "rgba(0,0,0,0.09)";  /* subtle border */
  const B2 = "rgba(0,0,0,0.16)";  /* medium border */
  const BG1 = "rgba(0,0,0,0.04)"; /* light bg tint */
  const BG2 = "rgba(0,0,0,0.07)"; /* slightly stronger tint */

  /* Selector shorthand — only targets panel/bracket/footer, NOT the header */
  const S = "html.light [data-theme-content]";

  return `
/* ── Light mode: base ──────────────────────────────────────────────────── */
html.light body { background: #f2f5ff; color: ${T1}; }
html.light ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); }

/* ── Text (panel / bracket / footer only — header keeps white text) ─────── */
${S} .text-white,
${S} .text-white\\/80,
${S} .text-white\\/70,
${S} .text-white\\/60 { color: ${T1} !important; }

${S} .text-white\\/55,
${S} .text-white\\/50,
${S} .text-white\\/45,
${S} .text-white\\/40,
${S} .text-white\\/35 { color: ${T2} !important; }

${S} .text-white\\/30,
${S} .text-white\\/25,
${S} .text-white\\/20,
${S} .text-white\\/18,
${S} .text-white\\/15,
${S} .text-white\\/12 { color: ${TM} !important; }

/* ── TeamSlot: winner/loser text should be dark, not amber-100/blue-100 ─── */
${S} .text-amber-100 { color: ${T1} !important; }
${S} .text-blue-100  { color: ${T1} !important; }

/* ── Backgrounds ────────────────────────────────────────────────────────── */
${S} .bg-white\\/\\[0\\.08\\],
${S} .bg-white\\/\\[0\\.06\\],
${S} .bg-white\\/\\[0\\.05\\],
${S} .bg-white\\/\\[0\\.04\\],
${S} .bg-white\\/\\[0\\.035\\],
${S} .bg-white\\/\\[0\\.03\\] { background: ${BG1} !important; }
${S} .bg-white\\/15 { background: ${BG2} !important; }

/* ── Borders ────────────────────────────────────────────────────────────── */
${S} .border-white\\/\\[0\\.07\\],
${S} .border-white\\/\\[0\\.06\\],
${S} .border-white\\/\\[0\\.05\\],
${S} .border-white\\/\\[0\\.04\\] { border-color: ${B1} !important; }
${S} .border-white\\/\\[0\\.08\\],
${S} .border-white\\/\\[0\\.10\\],
${S} .border-white\\/\\[0\\.12\\],
${S} .border-white\\/\\[0\\.1\\],
${S} .border-white\\/10,
${S} .border-white\\/20 { border-color: ${B2} !important; }
${S} .border-white\\/\\[0\\.25\\],
${S} .border-white\\/30 { border-color: rgba(0,0,0,0.22) !important; }

/* Footer border */
html.light footer { border-color: ${B1} !important; color: ${TM}; }

/* ── Hover ───────────────────────────────────────────────────────────────── */
${S} .hover\\:bg-white\\/\\[0\\.025\\]:hover,
${S} .hover\\:bg-white\\/\\[0\\.02\\]:hover,
${S} .hover\\:bg-white\\/\\[0\\.03\\]:hover,
${S} .hover\\:bg-white\\/\\[0\\.04\\]:hover,
${S} .hover\\:bg-white\\/\\[0\\.05\\]:hover { background: ${BG1} !important; }

/* ── Drop zone ───────────────────────────────────────────────────────────── */
html.light .bg-red-950\\/30,
html.light .bg-red-950\\/40 { background: rgba(248,113,113,0.12) !important; }

/* ── Match card shadow ───────────────────────────────────────────────────── */
${S} .rounded-xl.overflow-hidden {
  border-color: rgba(0,0,0,0.10) !important;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
}

/* ── Inputs ──────────────────────────────────────────────────────────────── */
html.light input { background: rgba(0,0,0,0.04); color: ${T1}; border-color: ${B2}; }
html.light input::placeholder { color: ${TM}; }
html.light input:focus { background: rgba(0,0,0,0.06); }
`;
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise from localStorage so the state is correct on first render
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return ((localStorage.getItem("wc2026_theme") as Theme) ?? "dark");
  });

  function applyTheme(t: Theme) {
    // 1. CSS class for selector-based overrides
    document.documentElement.classList.toggle("light", t === "light");

    // 2. Inject / update CSS variables via a runtime <style> tag
    let varStyle = document.getElementById("wc-theme-vars") as HTMLStyleElement | null;
    if (!varStyle) {
      varStyle = document.createElement("style");
      varStyle.id = "wc-theme-vars";
      document.head.appendChild(varStyle);
    }
    varStyle.textContent = `:root { ${t === "light" ? LIGHT_VARS : DARK_VARS} }`;

    // 3. Inject / update the utility override CSS
    let overrideStyle = document.getElementById("wc-theme-overrides") as HTMLStyleElement | null;
    if (!overrideStyle) {
      overrideStyle = document.createElement("style");
      overrideStyle.id = "wc-theme-overrides";
      document.head.appendChild(overrideStyle);
    }
    overrideStyle.textContent = t === "light" ? buildLightOverrideCSS() : "";
  }

  // Apply CSS variables/classes whenever theme changes (including on mount)
  useEffect(() => { applyTheme(theme); }, [theme]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle() {
    setTheme(prev => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("wc2026_theme", next);
      applyTheme(next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
