/**
 * TypeScript type definitions for API-Football data structures
 * Based on API-Football v3 response format
 */

export type FixtureStatus =
  | "TBD" // Time To Be Defined
  | "NS" // Not Started
  | "1H" // First Half, Kick Off
  | "HT" // Halftime
  | "2H" // Second Half, 2nd Half Started
  | "ET" // Extra Time
  | "BT" // Break Time (in Extra Time)
  | "P" // Penalty In Progress
  | "SUSP" // Match Suspended
  | "INT" // Match Interrupted
  | "FT" // Match Finished
  | "AET" // Match Finished After Extra Time
  | "PEN" // Match Finished After Penalty
  | "PST" // Match Postponed
  | "CANC" // Match Cancelled
  | "ABD" // Match Abandoned
  | "AWD" // Technical Loss
  | "WO" // WalkOver
  | "LIVE"; // In Progress

export interface FixtureStatusDetails {
  long: string;
  short: FixtureStatus;
  elapsed: number | null;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

export interface Teams {
  home: Team;
  away: Team;
}

export interface Goals {
  home: number | null;
  away: number | null;
}

export interface Score {
  halftime: Goals;
  fulltime: Goals;
  extratime: Goals;
  penalty: Goals;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string | null;
}

export interface Venue {
  id: number | null;
  name: string | null;
  city: string | null;
}

export interface FixtureDetails {
  id: number;
  referee: string | null;
  timezone: string;
  date: string; // ISO 8601 date string
  timestamp: number;
  venue: Venue;
  status: FixtureStatusDetails;
}

export interface Fixture {
  fixture: FixtureDetails;
  league: League;
  teams: Teams;
  goals: Goals;
  score: Score;
}

export interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, string | number>;
  errors: Array<{
    time?: string;
    bug?: string;
    report?: string;
  }>;
  results: number;
  paging?: {
    current: number;
    total: number;
  };
  response: T[];
}

// Simplified types for frontend use
export interface SimpleFixture {
  id: number;
  date: string;
  timestamp: number;
  status: FixtureStatus;
  statusLong: string;
  elapsed: number | null;
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    round: string | null;
  };
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  isLive: boolean;
}

export interface LeagueInfo {
  id: number;
  name: string;
  type: string;
  logo: string;
  country: string;
  countryFlag: string | null;
}
