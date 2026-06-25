export type Locale = "en" | "zh" | "es" | "de" | "fr";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
};

type Translations = {
  appTitle: string;
  appSubtitle: string;
  reset: string;
  resetConfirm: string;
  shareLink: string;
  copied: string;
  downloadImage: string;
  yourPick: string;
  officialResult: string;
  instructions: string;
  placed: string;
  picked: string;
  dragHint: string;
  allTeams: string;
  search: string;
  allConfederations: string;
  removeTeam: string;
  dataCredit: string;
  groupStage: string;
  team: string;
  mp: string;
  w: string;
  d: string;
  l: string;
  gf: string;
  ga: string;
  gd: string;
  pts: string;
  roundOf32: string;
  roundOf16: string;
  quarterFinal: string;
  semiFinal: string;
  final: string;
  thirdPlace: string;
  groups: string;
  teams: string;
  clickToFill: string;
  alreadyFilled: string;
  language: string;
};

const translations: Record<Locale, Translations> = {
  en: {
    appTitle: "FIFA World Cup 2026",
    appSubtitle: "Bracket Predictor",
    reset: "Reset",
    resetConfirm: "Reset all predictions and team placements?",
    shareLink: "Share Link",
    copied: "✓ Copied!",
    downloadImage: "Download Image",
    yourPick: "Your pick",
    officialResult: "Official result (locked)",
    instructions: "Drag a team from the panel into a blank slot · Click both-known teams to pick a winner · Click × to remove a placed team",
    placed: "placed",
    picked: "picked",
    dragHint: "Drag a team into a blank slot",
    allTeams: "All Teams",
    search: "Search…",
    allConfederations: "All",
    removeTeam: "Remove team",
    dataCredit: "Data: football-data.org · Stored locally",
    groupStage: "Group Stage",
    team: "Team",
    mp: "MP",
    w: "W",
    d: "D",
    l: "L",
    gf: "GF",
    ga: "GA",
    gd: "GD",
    pts: "Pts",
    groups: "Groups",
    teams: "Teams",
    roundOf32: "Round of 32",
    roundOf16: "Round of 16",
    quarterFinal: "Quarter-final",
    semiFinal: "Semi-final",
    final: "Final",
    thirdPlace: "3rd Place",
    clickToFill: "Click to fill bracket slot",
    alreadyFilled: "Already placed in bracket",
    language: "Language",
  },
  zh: {
    appTitle: "2026 FIFA 世界杯",
    appSubtitle: "赛程预测",
    reset: "重置",
    resetConfirm: "重置所有预测和球队放置？",
    shareLink: "分享链接",
    copied: "✓ 已复制！",
    downloadImage: "下载图片",
    yourPick: "你的选择",
    officialResult: "官方结果（已锁定）",
    instructions: "从面板拖拽球队到空白格 · 点击已知球队选择晋级者 · 点击 × 取消放置",
    placed: "已放置",
    picked: "已选择",
    dragHint: "拖拽球队到空白格",
    allTeams: "所有球队",
    search: "搜索…",
    allConfederations: "全部",
    removeTeam: "移除球队",
    dataCredit: "数据：football-data.org · 本地存储",
    groupStage: "小组赛",
    team: "球队",
    mp: "场",
    w: "胜",
    d: "平",
    l: "负",
    gf: "进球",
    ga: "失球",
    gd: "净胜",
    pts: "积分",
    groups: "小组",
    teams: "球队",
    roundOf32: "32强",
    roundOf16: "16强",
    quarterFinal: "四分之一决赛",
    semiFinal: "半决赛",
    final: "决赛",
    thirdPlace: "三四名决赛",
    clickToFill: "点击填入赛程格",
    alreadyFilled: "已放入赛程",
    language: "语言",
  },
  es: {
    appTitle: "Copa Mundial FIFA 2026",
    appSubtitle: "Predictor de Bracket",
    reset: "Reiniciar",
    resetConfirm: "¿Reiniciar todas las predicciones y selecciones?",
    shareLink: "Compartir enlace",
    copied: "✓ ¡Copiado!",
    downloadImage: "Descargar imagen",
    yourPick: "Tu selección",
    officialResult: "Resultado oficial (bloqueado)",
    instructions: "Arrastra un equipo al casillero vacío · Haz clic para elegir ganador · Haz clic en × para quitar un equipo",
    placed: "colocados",
    picked: "elegidos",
    dragHint: "Arrastra un equipo al casillero",
    allTeams: "Todos los equipos",
    search: "Buscar…",
    allConfederations: "Todos",
    removeTeam: "Quitar equipo",
    dataCredit: "Datos: football-data.org · Almacenado localmente",
    groupStage: "Fase de grupos",
    team: "Equipo",
    mp: "PJ",
    w: "G",
    d: "E",
    l: "P",
    gf: "GF",
    ga: "GC",
    gd: "DG",
    pts: "Pts",
    groups: "Grupos",
    teams: "Equipos",
    roundOf32: "Ronda de 32",
    roundOf16: "Ronda de 16",
    quarterFinal: "Cuartos de final",
    semiFinal: "Semifinal",
    final: "Final",
    thirdPlace: "3.er puesto",
    clickToFill: "Clic para llenar casillero",
    alreadyFilled: "Ya colocado en el bracket",
    language: "Idioma",
  },
  de: {
    appTitle: "FIFA Weltmeisterschaft 2026",
    appSubtitle: "Bracket-Vorhersage",
    reset: "Zurücksetzen",
    resetConfirm: "Alle Vorhersagen und Platzierungen zurücksetzen?",
    shareLink: "Link teilen",
    copied: "✓ Kopiert!",
    downloadImage: "Bild herunterladen",
    yourPick: "Deine Wahl",
    officialResult: "Offizielles Ergebnis (gesperrt)",
    instructions: "Team ins leere Feld ziehen · Klicken um Gewinner zu wählen · × klicken um Team zu entfernen",
    placed: "platziert",
    picked: "gewählt",
    dragHint: "Team in leeres Feld ziehen",
    allTeams: "Alle Teams",
    search: "Suchen…",
    allConfederations: "Alle",
    removeTeam: "Team entfernen",
    dataCredit: "Daten: football-data.org · Lokal gespeichert",
    groupStage: "Gruppenphase",
    team: "Team",
    mp: "Sp",
    w: "S",
    d: "U",
    l: "N",
    gf: "T",
    ga: "G",
    gd: "TD",
    pts: "Pkt",
    groups: "Gruppen",
    teams: "Teams",
    roundOf32: "Runde der 32",
    roundOf16: "Achtelfinale",
    quarterFinal: "Viertelfinale",
    semiFinal: "Halbfinale",
    final: "Finale",
    thirdPlace: "Spiel um Platz 3",
    clickToFill: "Klicken zum Füllen",
    alreadyFilled: "Bereits im Bracket platziert",
    language: "Sprache",
  },
  fr: {
    appTitle: "Coupe du Monde FIFA 2026",
    appSubtitle: "Prédicteur de Tableau",
    reset: "Réinitialiser",
    resetConfirm: "Réinitialiser toutes les prédictions et placements ?",
    shareLink: "Partager le lien",
    copied: "✓ Copié !",
    downloadImage: "Télécharger l'image",
    yourPick: "Votre choix",
    officialResult: "Résultat officiel (verrouillé)",
    instructions: "Glissez une équipe dans une case vide · Cliquez pour choisir le gagnant · Cliquez × pour retirer une équipe",
    placed: "placées",
    picked: "choisies",
    dragHint: "Glisser une équipe dans une case",
    allTeams: "Toutes les équipes",
    search: "Rechercher…",
    allConfederations: "Tous",
    removeTeam: "Retirer l'équipe",
    dataCredit: "Données : football-data.org · Stocké localement",
    groupStage: "Phase de groupes",
    team: "Équipe",
    mp: "MJ",
    w: "G",
    d: "N",
    l: "P",
    gf: "BP",
    ga: "BC",
    gd: "DB",
    pts: "Pts",
    groups: "Groupes",
    teams: "Équipes",
    roundOf32: "Tour de 32",
    roundOf16: "Huitièmes de finale",
    quarterFinal: "Quarts de finale",
    semiFinal: "Demi-finale",
    final: "Finale",
    thirdPlace: "Match pour la 3e place",
    clickToFill: "Cliquer pour remplir",
    alreadyFilled: "Déjà placé dans le tableau",
    language: "Langue",
  },
};

export function t(locale: Locale, key: keyof Translations): string {
  return translations[locale][key] ?? translations.en[key];
}

export { translations };
export type { Translations };
