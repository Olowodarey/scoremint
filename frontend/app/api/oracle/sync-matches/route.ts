import { NextResponse } from "next/server";
import { OracleService } from "@/lib/contract/oracle";
import { getMatchMapping, saveMatchMapping } from "@/lib/storage/matches";

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL =
  process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";

interface Fixture {
  fixture: {
    id: number;
    timestamp: number;
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
}

/**
 * Sync upcoming fixtures from API-Football to smart contract
 * Call this daily or when you need to add matches for a new event
 *
 * Query params:
 * - date: YYYY-MM-DD (default: today)
 * - league: league ID (default: 39 = Premier League)
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getToday();
    const league = searchParams.get("league") || "39"; // Premier League default

    console.log(`Syncing matches for ${date}, league ${league}`);

    // 1. Fetch fixtures from API-Football
    const apiUrl = `${BASE_URL}/fixtures?date=${date}&league=${league}&season=2025`;
    const response = await fetch(apiUrl, {
      headers: {
        "x-apisports-key": API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`API-Football error: ${response.status}`);
    }

    const data = await response.json();

    // Check for API errors
    const hasErrors =
      data.errors &&
      (Array.isArray(data.errors)
        ? data.errors.length > 0
        : Object.keys(data.errors).length > 0);

    if (hasErrors) {
      console.error("API-Football returned errors:", data.errors);
      return NextResponse.json(
        { error: "API-Football returned an error", details: data.errors },
        { status: 500 },
      );
    }

    const fixtures: Fixture[] = data.response || [];

    if (fixtures.length === 0) {
      return NextResponse.json({
        success: true,
        created: 0,
        message: "No fixtures found for this date",
      });
    }

    // 2. Create matches in contract
    const oracle = new OracleService();
    const created = [];
    const skipped = [];

    for (const fixture of fixtures) {
      // Check if already created
      const existing = getMatchMapping(fixture.fixture.id);
      if (existing) {
        skipped.push({
          fixtureId: fixture.fixture.id,
          reason: "Already exists",
        });
        continue;
      }

      try {
        const contractMatchId = await oracle.createMatch({
          fixtureId: fixture.fixture.id,
          homeTeam: fixture.teams.home.name,
          awayTeam: fixture.teams.away.name,
          timestamp: fixture.fixture.timestamp,
        });

        // Save mapping
        saveMatchMapping(
          fixture.fixture.id,
          contractMatchId,
          fixture.teams.home.name,
          fixture.teams.away.name,
          fixture.fixture.timestamp,
        );

        created.push({
          fixtureId: fixture.fixture.id,
          contractMatchId,
          homeTeam: fixture.teams.home.name,
          awayTeam: fixture.teams.away.name,
        });

        console.log(
          `✓ Created match ${contractMatchId} for fixture ${fixture.fixture.id}`,
        );
      } catch (error) {
        console.error(
          `Error creating match for fixture ${fixture.fixture.id}:`,
          error,
        );
        skipped.push({
          fixtureId: fixture.fixture.id,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: fixtures.length,
      created: created.length,
      skipped: skipped.length,
      matches: created,
      skippedDetails: skipped,
    });
  } catch (error) {
    console.error("Error syncing matches:", error);
    return NextResponse.json(
      {
        error: "Failed to sync matches",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}
