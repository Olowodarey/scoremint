import { NextResponse } from "next/server";
import { OracleService } from "@/lib/contract/oracle";
import { getPendingMatches, markMatchAsSettled } from "@/lib/storage/matches";

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL =
  process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";

/**
 * Check for finished fixtures and settle them in the contract
 * Run this via cron job every 5-10 minutes
 *
 * This will:
 * 1. Get all pending matches from JSON storage
 * 2. Check each fixture status from API-Football
 * 3. Settle finished matches in the contract
 * 4. Update JSON storage with results
 */
export async function POST() {
  try {
    console.log("Checking for finished matches...");

    // 1. Get all pending matches
    const pendingMatches = getPendingMatches();

    if (pendingMatches.length === 0) {
      return NextResponse.json({
        success: true,
        settled: 0,
        message: "No pending matches to check",
      });
    }

    console.log(`Found ${pendingMatches.length} pending matches`);

    // 2. Check each fixture for final result
    const toSettle = [];

    for (const match of pendingMatches) {
      try {
        const fixture = await fetchFixtureResult(match.apiFixtureId);

        // Check if finished (FT = Full Time)
        if (fixture.fixture.status.short === "FT") {
          toSettle.push({
            apiFixtureId: match.apiFixtureId,
            matchId: match.contractMatchId,
            homeScore: fixture.goals.home ?? 0,
            awayScore: fixture.goals.away ?? 0,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
          });
        }
      } catch (error) {
        console.error(`Error fetching fixture ${match.apiFixtureId}:`, error);
        // Continue with other matches
      }
    }

    if (toSettle.length === 0) {
      return NextResponse.json({
        success: true,
        settled: 0,
        pending: pendingMatches.length,
        message: "No finished matches to settle",
      });
    }

    console.log(`Settling ${toSettle.length} finished matches...`);

    // 3. Batch settle in contract (gas efficient)
    const oracle = new OracleService();

    await oracle.settleMatches(
      toSettle.map((m) => ({
        matchId: m.matchId,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
      })),
    );

    // 4. Update JSON storage
    for (const match of toSettle) {
      markMatchAsSettled(match.apiFixtureId, match.homeScore, match.awayScore);
      console.log(
        `✓ Settled match ${match.matchId}: ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`,
      );
    }

    return NextResponse.json({
      success: true,
      settled: toSettle.length,
      pending: pendingMatches.length - toSettle.length,
      matches: toSettle.map((m) => ({
        fixtureId: m.apiFixtureId,
        matchId: m.matchId,
        result: `${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}`,
      })),
    });
  } catch (error) {
    console.error("Error settling matches:", error);
    return NextResponse.json(
      {
        error: "Failed to settle matches",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function fetchFixtureResult(fixtureId: number) {
  const response = await fetch(`${BASE_URL}/fixtures?id=${fixtureId}`, {
    headers: {
      "x-apisports-key": API_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch fixture ${fixtureId}: ${response.status}`);
  }

  const data = await response.json();

  // Check for API errors
  const hasErrors =
    data.errors &&
    (Array.isArray(data.errors)
      ? data.errors.length > 0
      : Object.keys(data.errors).length > 0);

  if (hasErrors) {
    throw new Error(`API-Football error: ${JSON.stringify(data.errors)}`);
  }

  if (!data.response || data.response.length === 0) {
    throw new Error(`Fixture ${fixtureId} not found`);
  }

  return data.response[0];
}
