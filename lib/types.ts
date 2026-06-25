export type TeamInfo = {
  id: string;
  name: string;
  flag?: string; // emoji flag
  isKnown: boolean;    // true = team is resolved (not a placeholder like "W74")
  isConfirmed?: boolean; // true = position locked by API (group stage complete, cannot be changed by user)
};

export type MatchResult = {
  homeScore?: number;
  awayScore?: number;
  winner?: string; // team id
  played: boolean;
};

export type Match = {
  id: string; // e.g. "M74"
  round: Round;
  date?: string;
  time?: string;
  home: TeamInfo;
  away: TeamInfo;
  result?: MatchResult;
  nextMatchId?: string; // which match the winner feeds into
  nextMatchSlot?: "home" | "away";
};

export type Round =
  | "R32"
  | "R16"
  | "QF"
  | "SF"
  | "3RD"
  | "F";

export type Predictions = Record<string, string>; // matchId -> winning teamId
