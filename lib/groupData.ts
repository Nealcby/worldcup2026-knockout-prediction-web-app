// 2026 FIFA World Cup Group Stage standings
// 12 groups (A–L), 4 teams each = 48 teams total
// Data sourced from live results — update as group stage progresses.

export type GroupTeam = {
  id: string;    // 3-letter code
  name: string;
  flag: string;
  mp: number;    // matches played
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
};

export type Group = {
  id: string;   // "A"–"L"
  teams: GroupTeam[]; // sorted by standing (index 0 = 1st place)
};

// Bracket slot labels that map to group positions:
// 1st place → "1{group}" e.g. "1A"
// 2nd place → "2{group}" e.g. "2A"
// 3rd place (best of 12 thirds) → "3ABCDF" etc. (bracket-specific)
// This mapping is used to auto-fill slots when user clicks a group position.
export function slotForGroupPosition(group: string, position: number): string {
  if (position === 1) return `1${group}`;
  if (position === 2) return `2${group}`;
  return `3${group}`; // third-place teams compete for special slots
}

// Live data from screenshot (Groups A, B, C confirmed)
// Remaining groups stubbed with known qualified teams (no results yet)
export const GROUPS: Group[] = [
  {
    id: "A",
    teams: [
      { id: "MEX", name: "Mexico",       flag: "🇲🇽", mp: 3, w: 3, d: 0, l: 0, gf: 6,  ga: 0,  pts: 9 },
      { id: "RSA", name: "South Africa", flag: "🇿🇦", mp: 3, w: 1, d: 1, l: 1, gf: 2,  ga: 3,  pts: 4 },
      { id: "KOR", name: "South Korea",  flag: "🇰🇷", mp: 3, w: 1, d: 0, l: 2, gf: 2,  ga: 3,  pts: 3 },
      { id: "CZE", name: "Czechia",      flag: "🇨🇿", mp: 3, w: 0, d: 1, l: 2, gf: 2,  ga: 6,  pts: 1 },
    ],
  },
  {
    id: "B",
    teams: [
      { id: "SUI", name: "Switzerland",    flag: "🇨🇭", mp: 3, w: 2, d: 1, l: 0, gf: 7,  ga: 3,  pts: 7 },
      { id: "CAN", name: "Canada",         flag: "🇨🇦", mp: 3, w: 1, d: 1, l: 1, gf: 8,  ga: 3,  pts: 4 },
      { id: "BIH", name: "Bosnia & Herz.", flag: "🇧🇦", mp: 3, w: 1, d: 1, l: 1, gf: 5,  ga: 6,  pts: 4 },
      { id: "QAT", name: "Qatar",          flag: "🇶🇦", mp: 3, w: 0, d: 1, l: 2, gf: 2,  ga: 10, pts: 1 },
    ],
  },
  {
    id: "C",
    teams: [
      { id: "BRA", name: "Brazil",   flag: "🇧🇷", mp: 3, w: 2, d: 1, l: 0, gf: 7, ga: 1, pts: 7 },
      { id: "MAR", name: "Morocco",  flag: "🇲🇦", mp: 3, w: 2, d: 1, l: 0, gf: 6, ga: 3, pts: 7 },
      { id: "SCO", name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", mp: 3, w: 1, d: 0, l: 2, gf: 1, ga: 4, pts: 3 },
      { id: "HTI", name: "Haiti",    flag: "🇭🇹", mp: 3, w: 0, d: 0, l: 3, gf: 2, ga: 8, pts: 0 },
    ],
  },
  // Groups D–L: stubs (mp=0) — will update as results come in
  {
    id: "D",
    teams: [
      { id: "USA", name: "USA",         flag: "🇺🇸", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "ARG", name: "Argentina",   flag: "🇦🇷", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "GHA", name: "Ghana",       flag: "🇬🇭", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "PAN", name: "Panama",      flag: "🇵🇦", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
    ],
  },
  {
    id: "E",
    teams: [
      { id: "GER", name: "Germany",   flag: "🇩🇪", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "JPN", name: "Japan",     flag: "🇯🇵", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "COL", name: "Colombia",  flag: "🇨🇴", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "TUN", name: "Tunisia",   flag: "🇹🇳", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
    ],
  },
  {
    id: "F",
    teams: [
      { id: "ESP", name: "Spain",       flag: "🇪🇸", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "URU", name: "Uruguay",     flag: "🇺🇾", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "AUS", name: "Australia",   flag: "🇦🇺", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "CMR", name: "Cameroon",    flag: "🇨🇲", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
    ],
  },
  {
    id: "G",
    teams: [
      { id: "FRA", name: "France",     flag: "🇫🇷", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "ENG", name: "England",    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "SEN", name: "Senegal",    flag: "🇸🇳", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "IRN", name: "Iran",       flag: "🇮🇷", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
    ],
  },
  {
    id: "H",
    teams: [
      { id: "POR", name: "Portugal",  flag: "🇵🇹", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "NED", name: "Netherlands",flag: "🇳🇱", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "EGY", name: "Egypt",     flag: "🇪🇬", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "ECU", name: "Ecuador",   flag: "🇪🇨", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
    ],
  },
  {
    id: "I",
    teams: [
      { id: "BEL", name: "Belgium",    flag: "🇧🇪", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "CRO", name: "Croatia",    flag: "🇭🇷", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "NGA", name: "Nigeria",    flag: "🇳🇬", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "AUT", name: "Austria",    flag: "🇦🇹", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
    ],
  },
  {
    id: "J",
    teams: [
      { id: "ITA", name: "Italy",      flag: "🇮🇹", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "DEN", name: "Denmark",    flag: "🇩🇰", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "SAU", name: "Saudi Arabia",flag: "🇸🇦", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "CIV", name: "Ivory Coast",flag: "🇨🇮", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
    ],
  },
  {
    id: "K",
    teams: [
      { id: "SVK", name: "Slovakia",   flag: "🇸🇰", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "HUN", name: "Hungary",    flag: "🇭🇺", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "IDN", name: "Indonesia",  flag: "🇮🇩", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "ALG", name: "Algeria",    flag: "🇩🇿", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
    ],
  },
  {
    id: "L",
    teams: [
      { id: "SVN", name: "Slovenia",   flag: "🇸🇮", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "PAR", name: "Paraguay",   flag: "🇵🇾", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "NZL", name: "New Zealand",flag: "🇳🇿", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      { id: "UZB", name: "Uzbekistan", flag: "🇺🇿", mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
    ],
  },
];
