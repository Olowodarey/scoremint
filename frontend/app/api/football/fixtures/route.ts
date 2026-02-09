import { NextRequest, NextResponse } from "next/server";
import type {
  ApiFootballResponse,
  Fixture,
  SimpleFixture,
} from "@/app/types/football.types";

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL =
  process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";

// Cache to reduce API calls (1 minute for live, longer for other data)
interface CachedData {
  success: boolean;
  count: number;
  fixtures: SimpleFixture[];
  cached?: boolean;
  cacheAge?: number;
}

const cache = new Map<string, { data: CachedData; timestamp: number }>();
const LIVE_CACHE_DURATION = 60 * 1000; // 1 minute
const STATIC_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(params: URLSearchParams): string {
  return Array.from(params.entries())
    .sort()
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

function transformFixture(fixture: Fixture): SimpleFixture {
  const isLive = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(
    fixture.fixture.status.short,
  );

  return {
    id: fixture.fixture.id,
    date: fixture.fixture.date,
    timestamp: fixture.fixture.timestamp,
    status: fixture.fixture.status.short,
    statusLong: fixture.fixture.status.long,
    elapsed: fixture.fixture.status.elapsed,
    league: {
      id: fixture.league.id,
      name: fixture.league.name,
      country: fixture.league.country,
      logo: fixture.league.logo,
      round: fixture.league.round,
    },
    homeTeam: {
      id: fixture.teams.home.id,
      name: fixture.teams.home.name,
      logo: fixture.teams.home.logo,
    },
    awayTeam: {
      id: fixture.teams.away.id,
      name: fixture.teams.away.name,
      logo: fixture.teams.away.logo,
    },
    homeScore: fixture.goals.home,
    awayScore: fixture.goals.away,
    venue: fixture.fixture.venue.name,
    isLive,
  };
}

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "API_FOOTBALL_KEY is not configured" },
      { status: 500 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const cacheKey = getCacheKey(searchParams);

  // Check cache
  const cached = cache.get(cacheKey);
  const isLiveRequest = searchParams.has("live");
  const cacheDuration = isLiveRequest
    ? LIVE_CACHE_DURATION
    : STATIC_CACHE_DURATION;

  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    return NextResponse.json({
      ...cached.data,
      cached: true,
      cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
    });
  }

  try {
    // Build API-Football URL
    const apiUrl = new URL(`${BASE_URL}/fixtures`);

    // Forward supported query parameters
    const supportedParams = [
      "live",
      "id",
      "ids",
      "date",
      "league",
      "season",
      "team",
      "from",
      "to",
      "timezone",
    ];
    supportedParams.forEach((param) => {
      const value = searchParams.get(param);
      if (value) {
        apiUrl.searchParams.set(param, value);
      }
    });

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "x-apisports-key": API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API-Football error:", response.status, errorText);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch fixtures from API-Football" },
        { status: response.status },
      );
    }

    const data: ApiFootballResponse<Fixture> = await response.json();

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

    // Transform fixtures to simplified format
    const transformedFixtures = data.response.map(transformFixture);

    const result = {
      success: true,
      count: data.results,
      fixtures: transformedFixtures,
      cached: false,
    };

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching fixtures:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
