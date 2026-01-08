/**
 * Example: Live Fixtures Component
 *
 * This is a simple example showing how to use the footballApiClient
 * to fetch and display live football matches in your ScoreMint app.
 *
 * You can use this as a reference when integrating into CreatePrediction
 * or other components.
 */

"use client";

import { useState, useEffect } from "react";
import { footballApi } from "@/app/services/footballApiClient";
import type { SimpleFixture } from "@/app/types/football.types";

export default function LiveFixturesExample() {
  const [fixtures, setFixtures] = useState<SimpleFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLiveFixtures() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all live fixtures
        const liveFixtures = await footballApi.getLiveFixtures();
        setFixtures(liveFixtures);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch fixtures"
        );
        console.error("Error fetching live fixtures:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveFixtures();

    // Refresh every minute for live updates
    const interval = setInterval(fetchLiveFixtures, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading live fixtures...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (fixtures.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No live matches at the moment
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">
        Live Matches ({fixtures.length})
      </h2>

      <div className="grid gap-4">
        {fixtures.map((fixture) => (
          <div
            key={fixture.id}
            className="bg-dark-lighter border border-blue-500/20 rounded-lg p-4 hover:border-blue-500/40 transition-all"
          >
            {/* League Info */}
            <div className="flex items-center gap-2 mb-3">
              <img
                src={fixture.league.logo}
                alt={fixture.league.name}
                className="w-5 h-5"
              />
              <span className="text-xs text-gray-400">
                {fixture.league.name} - {fixture.league.round}
              </span>
            </div>

            {/* Match Info */}
            <div className="flex items-center justify-between">
              {/* Home Team */}
              <div className="flex items-center gap-3 flex-1">
                <img
                  src={fixture.homeTeam.logo}
                  alt={fixture.homeTeam.name}
                  className="w-8 h-8"
                />
                <span className="text-white font-medium">
                  {fixture.homeTeam.name}
                </span>
              </div>

              {/* Score */}
              <div className="px-6 text-center">
                <div className="text-2xl font-bold text-white">
                  {fixture.homeScore ?? "-"} : {fixture.awayScore ?? "-"}
                </div>
                {fixture.isLive && (
                  <div className="text-xs text-green-400 mt-1">
                    {fixture.statusLong}{" "}
                    {fixture.elapsed ? `${fixture.elapsed}'` : ""}
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex items-center gap-3 flex-1 justify-end">
                <span className="text-white font-medium">
                  {fixture.awayTeam.name}
                </span>
                <img
                  src={fixture.awayTeam.logo}
                  alt={fixture.awayTeam.name}
                  className="w-8 h-8"
                />
              </div>
            </div>

            {/* Venue */}
            {fixture.venue && (
              <div className="text-xs text-gray-500 mt-2 text-center">
                {fixture.venue}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example: Fixtures by Date Component
 *
 * Shows how to fetch fixtures for a specific date
 */
export function FixturesByDateExample() {
  const [date, setDate] = useState("2026-01-07"); // Tomorrow
  const [fixtures, setFixtures] = useState<SimpleFixture[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFixtures = async () => {
    setLoading(true);
    try {
      const data = await footballApi.getFixturesByDate(date);
      setFixtures(data);
    } catch (error) {
      console.error("Error fetching fixtures:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures();
  }, [date]);

  return (
    <div>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4 px-4 py-2 bg-dark-lighter border border-blue-500/20 rounded-lg text-white"
      />

      {loading ? (
        <div className="text-white">Loading...</div>
      ) : (
        <div className="text-white">
          {fixtures.length} matches on {date}
        </div>
      )}
    </div>
  );
}
