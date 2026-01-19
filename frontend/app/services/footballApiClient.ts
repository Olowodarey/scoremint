/**
 * Football API Client
 * Frontend service for calling our Next.js API routes (which proxy to API-Football)
 */

import type { SimpleFixture, LeagueInfo } from "@/app/types/football.types";

interface FixturesResponse {
  success: boolean;
  count: number;
  fixtures: SimpleFixture[];
  cached?: boolean;
  cacheAge?: number;
  error?: string;
}

interface LeaguesResponse {
  success: boolean;
  count: number;
  leagues: LeagueInfo[];
  cached?: boolean;
  cacheAge?: number;
  error?: string;
}

class FootballApiClient {
  private baseUrl = "/api/football";

  /**
   * Fetch live fixtures
   * @param leagueIds - Optional array of league IDs to filter (e.g., [39, 140] for Premier League & La Liga)
   */
  async getLiveFixtures(leagueIds?: number[]): Promise<SimpleFixture[]> {
    try {
      const params = new URLSearchParams();

      if (leagueIds && leagueIds.length > 0) {
        params.set("live", leagueIds.join("-"));
      } else {
        params.set("live", "all");
      }

      const response = await fetch(
        `${this.baseUrl}/fixtures?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FixturesResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch live fixtures");
      }

      return data.fixtures;
    } catch (error) {
      console.error("Error fetching live fixtures:", error);
      throw error;
    }
  }

  /**
   * Fetch fixtures by date
   * @param date - Date string in YYYY-MM-DD format (e.g., "2026-01-07")
   * @param leagueId - Optional league ID to filter
   */
  async getFixturesByDate(
    date: string,
    leagueId?: number
  ): Promise<SimpleFixture[]> {
    try {
      const params = new URLSearchParams({ date });

      if (leagueId) {
        params.set("league", leagueId.toString());
      }

      const response = await fetch(
        `${this.baseUrl}/fixtures?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FixturesResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch fixtures");
      }

      return data.fixtures;
    } catch (error) {
      console.error("Error fetching fixtures by date:", error);
      throw error;
    }
  }

  /**
   * Fetch a single fixture by ID
   * @param fixtureId - Fixture ID
   */
  async getFixtureById(fixtureId: number): Promise<SimpleFixture | null> {
    try {
      const params = new URLSearchParams({
        id: fixtureId.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/fixtures?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FixturesResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch fixture");
      }

      return data.fixtures[0] || null;
    } catch (error) {
      console.error("Error fetching fixture by ID:", error);
      return null;
    }
  }

  /**
   * Fetch fixtures for a specific league and season
   * @param leagueId - League ID (e.g., 39 for Premier League)
   * @param season - Season year (e.g., 2025)
   */
  async getLeagueFixtures(
    leagueId: number,
    season: number
  ): Promise<SimpleFixture[]> {
    try {
      const params = new URLSearchParams({
        league: leagueId.toString(),
        season: season.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/fixtures?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FixturesResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch league fixtures");
      }

      return data.fixtures;
    } catch (error) {
      console.error("Error fetching league fixtures:", error);
      throw error;
    }
  }

  /**
   * Fetch fixtures within a date range
   * @param from - Start date in YYYY-MM-DD format
   * @param to - End date in YYYY-MM-DD format
   * @param leagueId - Optional league ID to filter
   */
  async getFixturesByDateRange(
    from: string,
    to: string,
    leagueId?: number
  ): Promise<SimpleFixture[]> {
    try {
      const params = new URLSearchParams({ from, to });

      if (leagueId) {
        params.set("league", leagueId.toString());
      }

      const response = await fetch(
        `${this.baseUrl}/fixtures?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FixturesResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch fixtures");
      }

      return data.fixtures;
    } catch (error) {
      console.error("Error fetching fixtures by date range:", error);
      throw error;
    }
  }

  /**
   * Fetch available leagues
   * @param options - Optional filters (country, season, etc.)
   */
  async getLeagues(options?: {
    country?: string;
    season?: number;
    type?: string;
    current?: boolean;
  }): Promise<LeagueInfo[]> {
    try {
      const params = new URLSearchParams();

      if (options?.country) params.set("country", options.country);
      if (options?.season) params.set("season", options.season.toString());
      if (options?.type) params.set("type", options.type);
      if (options?.current !== undefined)
        params.set("current", options.current.toString());

      const response = await fetch(
        `${this.baseUrl}/leagues?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LeaguesResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch leagues");
      }

      return data.leagues;
    } catch (error) {
      console.error("Error fetching leagues:", error);
      throw error;
    }
  }

  /**
   * Get popular/major leagues (hardcoded list of major league IDs)
   */
  async getPopularLeagues(): Promise<SimpleFixture[]> {
    const popularLeagueIds = [
      39, // Premier League
      140, // La Liga
      135, // Serie A
      78, // Bundesliga
      61, // Ligue 1
      2, // UEFA Champions League
    ];

    try {
      const params = new URLSearchParams();
      params.set("ids", popularLeagueIds.join("-"));

      const response = await fetch(
        `${this.baseUrl}/fixtures?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FixturesResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch popular leagues");
      }

      return data.fixtures;
    } catch (error) {
      console.error("Error fetching popular leagues:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const footballApi = new FootballApiClient();

// Export the class for testing
export default FootballApiClient;
