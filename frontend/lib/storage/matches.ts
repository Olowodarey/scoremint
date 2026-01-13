import fs from "fs";
import path from "path";

interface MatchMapping {
  contractMatchId: number;
  apiFixtureId: number;
  homeTeam: string;
  awayTeam: string;
  fixtureTimestamp: number;
  status: "pending" | "settled";
  homeScore?: number;
  awayScore?: number;
  settledAt?: string;
  createdAt: string;
}

interface MatchMappingsData {
  mappings: Record<string, MatchMapping>; // key is apiFixtureId as string
  lastSync: string | null;
  stats: {
    totalMatches: number;
    pendingMatches: number;
    settledMatches: number;
  };
}

const DATA_PATH = path.join(process.cwd(), "data", "match-mappings.json");

/**
 * Read match mappings from JSON file
 */
export function readMatchMappings(): MatchMappingsData {
  try {
    const data = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    // Return empty structure if file doesn't exist
    return {
      mappings: {},
      lastSync: null,
      stats: {
        totalMatches: 0,
        pendingMatches: 0,
        settledMatches: 0,
      },
    };
  }
}

/**
 * Write match mappings to JSON file
 */
export function writeMatchMappings(data: MatchMappingsData): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Get a specific match mapping by API fixture ID
 */
export function getMatchMapping(apiFixtureId: number): MatchMapping | null {
  const data = readMatchMappings();
  return data.mappings[apiFixtureId.toString()] || null;
}

/**
 * Save a new match mapping
 */
export function saveMatchMapping(
  apiFixtureId: number,
  contractMatchId: number,
  homeTeam: string,
  awayTeam: string,
  fixtureTimestamp: number
): void {
  const data = readMatchMappings();

  data.mappings[apiFixtureId.toString()] = {
    contractMatchId,
    apiFixtureId,
    homeTeam,
    awayTeam,
    fixtureTimestamp,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // Update stats
  data.stats.totalMatches++;
  data.stats.pendingMatches++;
  data.lastSync = new Date().toISOString();

  writeMatchMappings(data);
}

/**
 * Get all pending matches (not yet settled)
 */
export function getPendingMatches(): MatchMapping[] {
  const data = readMatchMappings();
  return Object.values(data.mappings).filter((m) => m.status === "pending");
}

/**
 * Mark a match as settled
 */
export function markMatchAsSettled(
  apiFixtureId: number,
  homeScore: number,
  awayScore: number
): void {
  const data = readMatchMappings();
  const mapping = data.mappings[apiFixtureId.toString()];

  if (!mapping) {
    throw new Error(`Match mapping not found for fixture ${apiFixtureId}`);
  }

  mapping.status = "settled";
  mapping.homeScore = homeScore;
  mapping.awayScore = awayScore;
  mapping.settledAt = new Date().toISOString();

  // Update stats
  data.stats.pendingMatches--;
  data.stats.settledMatches++;

  writeMatchMappings(data);
}

/**
 * Get statistics
 */
export function getStats() {
  const data = readMatchMappings();
  return data.stats;
}

/**
 * Get all matches (for admin dashboard)
 */
export function getAllMatches(): MatchMapping[] {
  const data = readMatchMappings();
  return Object.values(data.mappings);
}
