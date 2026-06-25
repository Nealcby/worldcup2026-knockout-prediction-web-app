export type Team = {
  id: string;   // 3-letter code
  name: string;
  flag: string; // emoji
  confederation: string;
};

// All 48 FIFA World Cup 2026 qualified teams
export const ALL_TEAMS: Team[] = [
  // CONMEBOL (6)
  { id: "ARG", name: "Argentina",   flag: "🇦🇷", confederation: "CONMEBOL" },
  { id: "BRA", name: "Brazil",      flag: "🇧🇷", confederation: "CONMEBOL" },
  { id: "COL", name: "Colombia",    flag: "🇨🇴", confederation: "CONMEBOL" },
  { id: "URU", name: "Uruguay",     flag: "🇺🇾", confederation: "CONMEBOL" },
  { id: "ECU", name: "Ecuador",     flag: "🇪🇨", confederation: "CONMEBOL" },
  { id: "PAR", name: "Paraguay",    flag: "🇵🇾", confederation: "CONMEBOL" },

  // UEFA (16)
  { id: "ESP", name: "Spain",       flag: "🇪🇸", confederation: "UEFA" },
  { id: "ENG", name: "England",     flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA" },
  { id: "FRA", name: "France",      flag: "🇫🇷", confederation: "UEFA" },
  { id: "GER", name: "Germany",     flag: "🇩🇪", confederation: "UEFA" },
  { id: "POR", name: "Portugal",    flag: "🇵🇹", confederation: "UEFA" },
  { id: "NED", name: "Netherlands", flag: "🇳🇱", confederation: "UEFA" },
  { id: "BEL", name: "Belgium",     flag: "🇧🇪", confederation: "UEFA" },
  { id: "ITA", name: "Italy",       flag: "🇮🇹", confederation: "UEFA" },
  { id: "AUT", name: "Austria",     flag: "🇦🇹", confederation: "UEFA" },
  { id: "SUI", name: "Switzerland", flag: "🇨🇭", confederation: "UEFA" },
  { id: "CRO", name: "Croatia",     flag: "🇭🇷", confederation: "UEFA" },
  { id: "DEN", name: "Denmark",     flag: "🇩🇰", confederation: "UEFA" },
  { id: "SCO", name: "Scotland",    flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", confederation: "UEFA" },
  { id: "HUN", name: "Hungary",     flag: "🇭🇺", confederation: "UEFA" },
  { id: "SVK", name: "Slovakia",    flag: "🇸🇰", confederation: "UEFA" },
  { id: "SVN", name: "Slovenia",    flag: "🇸🇮", confederation: "UEFA" },

  // CONCACAF (6 — includes 3 hosts)
  { id: "USA", name: "USA",         flag: "🇺🇸", confederation: "CONCACAF" },
  { id: "CAN", name: "Canada",      flag: "🇨🇦", confederation: "CONCACAF" },
  { id: "MEX", name: "Mexico",      flag: "🇲🇽", confederation: "CONCACAF" },
  { id: "PAN", name: "Panama",      flag: "🇵🇦", confederation: "CONCACAF" },
  { id: "CRC", name: "Costa Rica",  flag: "🇨🇷", confederation: "CONCACAF" },
  { id: "JAM", name: "Jamaica",     flag: "🇯🇲", confederation: "CONCACAF" },

  // CAF (9)
  { id: "MAR", name: "Morocco",     flag: "🇲🇦", confederation: "CAF" },
  { id: "SEN", name: "Senegal",     flag: "🇸🇳", confederation: "CAF" },
  { id: "EGY", name: "Egypt",       flag: "🇪🇬", confederation: "CAF" },
  { id: "NGA", name: "Nigeria",     flag: "🇳🇬", confederation: "CAF" },
  { id: "CIV", name: "Ivory Coast", flag: "🇨🇮", confederation: "CAF" },
  { id: "CMR", name: "Cameroon",    flag: "🇨🇲", confederation: "CAF" },
  { id: "GHA", name: "Ghana",       flag: "🇬🇭", confederation: "CAF" },
  { id: "ALG", name: "Algeria",     flag: "🇩🇿", confederation: "CAF" },
  { id: "TUN", name: "Tunisia",     flag: "🇹🇳", confederation: "CAF" },

  // AFC (8)
  { id: "JPN", name: "Japan",       flag: "🇯🇵", confederation: "AFC" },
  { id: "KOR", name: "South Korea", flag: "🇰🇷", confederation: "AFC" },
  { id: "AUS", name: "Australia",   flag: "🇦🇺", confederation: "AFC" },
  { id: "IRN", name: "Iran",        flag: "🇮🇷", confederation: "AFC" },
  { id: "SAU", name: "Saudi Arabia",flag: "🇸🇦", confederation: "AFC" },
  { id: "QAT", name: "Qatar",       flag: "🇶🇦", confederation: "AFC" },
  { id: "UZB", name: "Uzbekistan",  flag: "🇺🇿", confederation: "AFC" },
  { id: "IDN", name: "Indonesia",   flag: "🇮🇩", confederation: "AFC" },

  // OFC (1)
  { id: "NZL", name: "New Zealand", flag: "🇳🇿", confederation: "OFC" },

  // Inter-confederation play-off winners (2)
  { id: "VEN", name: "Venezuela",   flag: "🇻🇪", confederation: "CONMEBOL" },
  { id: "CHI", name: "Chile",       flag: "🇨🇱", confederation: "CONMEBOL" },
];

export const CONFEDERATION_COLORS: Record<string, string> = {
  CONMEBOL: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  UEFA:     "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CONCACAF: "bg-red-500/20 text-red-300 border-red-500/30",
  CAF:      "bg-green-500/20 text-green-300 border-green-500/30",
  AFC:      "bg-purple-500/20 text-purple-300 border-purple-500/30",
  OFC:      "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};
