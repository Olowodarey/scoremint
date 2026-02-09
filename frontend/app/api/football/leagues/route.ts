import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL =
  process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";

// Cache leagues for longer since they change rarely
interface LeagueData {
  id: number;
  name: string;
  type: string;
  logo: string;
  country: string;
  countryCode: string | null;
  countryFlag: string | null;
  currentSeason: number;
  seasons: number[];
}

interface CachedLeaguesData {
  success: boolean;
  count: number;
  leagues: LeagueData[];
  cached?: boolean;
  cacheAge?: number;
}

const cache = new Map<string, { data: CachedLeaguesData; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface LeagueResponse {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    code: string | null;
    flag: string | null;
  };
  seasons: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
  }>;
}

interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, string | number>;
  errors:
    | Record<string, string>
    | Array<{ time?: string; bug?: string; report?: string }>;
  results: number;
  response: T[];
}

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "API_FOOTBALL_KEY is not configured" },
      { status: 500 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const cacheKey =
    Array.from(searchParams.entries())
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&") || "all";

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      ...cached.data,
      cached: true,
      cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
    });
  }

  try {
    const apiUrl = new URL(`${BASE_URL}/leagues`);

    // Forward supported query parameters
    const supportedParams = [
      "id",
      "name",
      "country",
      "code",
      "season",
      "team",
      "type",
      "current",
      "search",
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
        { error: "Failed to fetch leagues from API-Football" },
        { status: response.status },
      );
    }

    const data: ApiFootballResponse<LeagueResponse> = await response.json();

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

    // Transform to simplified format
    const leagues = data.response.map((item) => ({
      id: item.league.id,
      name: item.league.name,
      type: item.league.type,
      logo: item.league.logo,
      country: item.country.name,
      countryCode: item.country.code,
      countryFlag: item.country.flag,
      currentSeason:
        item.seasons.find((s) => s.current)?.year || item.seasons[0]?.year,
      seasons: item.seasons.map((s) => s.year),
    }));

    const result = {
      success: true,
      count: data.results,
      leagues,
      cached: false,
    };

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
