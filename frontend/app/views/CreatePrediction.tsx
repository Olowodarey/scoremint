"use client";

import { useState, useEffect } from "react";
import { footballApi } from "@/app/services/footballApiClient";
import type { SimpleFixture } from "@/app/types/football.types";

// User prediction mode - what type of predictions users will make
type UserPredictionMode = "exact_score" | "outcome";

export default function CreatePrediction() {
  const [eventName, setEventName] = useState("");
  const [prizeAmount, setPrizeAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [userPredictionMode, setUserPredictionMode] =
    useState<UserPredictionMode>("outcome");
  const [selectedMatches, setSelectedMatches] = useState<number[]>([]);

  // Football fixtures state
  const [fixtures, setFixtures] = useState<SimpleFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<
    "today" | "tomorrow" | "week" | "live"
  >("tomorrow");
  const [leagueFilter, setLeagueFilter] = useState<number | null>(null);

  // Top leagues configuration
  const topLeagues = [
    { id: 39, name: "Premier League", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", short: "EPL" },
    { id: 140, name: "La Liga", emoji: "🇪🇸", short: "La Liga" },
    { id: 135, name: "Serie A", emoji: "🇮🇹", short: "Serie A" },
    { id: 78, name: "Bundesliga", emoji: "🇩🇪", short: "Bundesliga" },
    { id: 61, name: "Ligue 1", emoji: "🇫🇷", short: "Ligue 1" },
    { id: 2, name: "Champions League", emoji: "🏆", short: "UCL" },
    { id: 3, name: "Europa League", emoji: "⭐", short: "UEL" },
  ];

  // Fetch fixtures based on date and league filters
  useEffect(() => {
    async function fetchFixtures() {
      try {
        setLoading(true);
        setError(null);

        let fetchedFixtures: SimpleFixture[] = [];
        const today = new Date();

        switch (dateFilter) {
          case "live":
            // Pass league filter if set
            const liveLeagueIds = leagueFilter ? [leagueFilter] : undefined;
            fetchedFixtures = await footballApi.getLiveFixtures(liveLeagueIds);
            break;
          case "today":
            const todayStr = today.toISOString().split("T")[0];
            fetchedFixtures = await footballApi.getFixturesByDate(
              todayStr,
              leagueFilter || undefined
            );
            break;
          case "tomorrow":
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split("T")[0];
            fetchedFixtures = await footballApi.getFixturesByDate(
              tomorrowStr,
              leagueFilter || undefined
            );
            break;
          case "week":
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            const todayStr2 = today.toISOString().split("T")[0];
            const weekEndStr = weekEnd.toISOString().split("T")[0];
            fetchedFixtures = await footballApi.getFixturesByDateRange(
              todayStr2,
              weekEndStr,
              leagueFilter || undefined
            );
            break;
        }

        setFixtures(fetchedFixtures);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch fixtures"
        );
        console.error("Error fetching fixtures:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFixtures();
  }, [dateFilter, leagueFilter]);

  // Toggle match selection
  const toggleMatchSelection = (matchId: number) => {
    setSelectedMatches((prev) =>
      prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!eventName || !prizeAmount || !deadline) {
      alert("Please fill in all event details");
      return;
    }

    if (selectedMatches.length === 0) {
      alert("Please select at least one match");
      return;
    }

    // Build submission data
    const submissionData = {
      eventInfo: {
        name: eventName,
        prizeAmount,
        deadline,
        userPredictionMode,
      },
      matches: selectedMatches.map((matchId) => {
        const match = fixtures.find((m) => m.id === matchId)!;
        return {
          fixtureId: match.id,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          league: match.league.name,
          matchDate: match.date,
          matchTimestamp: match.timestamp,
        };
      }),
    };

    console.log("Creating prediction event:", submissionData);
    // Handle submission logic here
  };

  return (
    <div className="px-4 py-6 pb-24 bg-gradient-to-b from-blue-500/10 via-blue-400/5 to-transparent">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Create Prediction
        </h1>
        <p className="text-gray-400 text-sm">
          Set up a new prediction event with multiple matches
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Information Section */}
        <div className="glass-card p-4 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-3">
            📋 Event Details
          </h2>

          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Name
            </label>
            <input
              type="text"
              placeholder="e.g., AFCON 2025 Predictions"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-4 py-3 bg-dark-card border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Prize Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prize Amount (USDC)
            </label>
            <input
              type="number"
              placeholder="500"
              value={prizeAmount}
              onChange={(e) => setPrizeAmount(e.target.value)}
              className="w-full px-4 py-3 bg-dark-card border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none transition-colors"
              required
              min="0"
              step="0.01"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prediction Deadline
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 bg-dark-card border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none transition-colors"
              required
            />
          </div>

          {/* User Prediction Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              User Prediction Mode
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Choose what type of predictions your users will make
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserPredictionMode("outcome")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  userPredictionMode === "outcome"
                    ? "bg-primary/20 border-primary"
                    : "bg-dark-card border-white/10 hover:border-white/20"
                }`}
              >
                <div className="text-lg mb-1">🏆</div>
                <div className="font-semibold text-white text-sm">Outcome</div>
                <div className="text-xs text-gray-400 mt-1">
                  Users pick Win or Draw
                </div>
              </button>
              <button
                type="button"
                onClick={() => setUserPredictionMode("exact_score")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  userPredictionMode === "exact_score"
                    ? "bg-primary/20 border-primary"
                    : "bg-dark-card border-white/10 hover:border-white/20"
                }`}
              >
                <div className="text-lg mb-1">🎯</div>
                <div className="font-semibold text-white text-sm">
                  Exact Score
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Users predict the score
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Match Selection Section */}
        <div className="glass-card p-4">
          <h2 className="text-lg font-semibold text-white mb-3">
            ⚽ Select Matches
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Choose the matches you want to include in this prediction event
          </p>

          {/* Date Filter Tabs */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {[
              { value: "live", label: "🔴 Live", emoji: "" },
              { value: "today", label: "Today", emoji: "📅" },
              { value: "tomorrow", label: "Tomorrow", emoji: "🌅" },
              { value: "week", label: "This Week", emoji: "📆" },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() =>
                  setDateFilter(
                    filter.value as "today" | "tomorrow" | "week" | "live"
                  )
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  dateFilter === filter.value
                    ? "bg-primary text-white"
                    : "bg-dark-card text-gray-400 hover:text-white border border-white/10"
                }`}
              >
                {filter.emoji} {filter.label}
              </button>
            ))}
          </div>

          {/* League Filter Buttons */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Filter by league:</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {/* All Leagues Button */}
              <button
                type="button"
                onClick={() => setLeagueFilter(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  leagueFilter === null
                    ? "bg-blue-600 text-white"
                    : "bg-dark-card text-gray-400 hover:text-white border border-white/10"
                }`}
              >
                All Leagues
              </button>

              {/* Top League Buttons */}
              {topLeagues.map((league) => (
                <button
                  key={league.id}
                  type="button"
                  onClick={() => setLeagueFilter(league.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    leagueFilter === league.id
                      ? "bg-blue-600 text-white"
                      : "bg-dark-card text-gray-400 hover:text-white border border-white/10"
                  }`}
                >
                  {league.emoji} {league.short}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-gray-400 mt-3 text-sm">Loading fixtures...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
              <p className="text-red-400 text-sm">⚠️ {error}</p>
              <p className="text-red-300 text-xs mt-2">
                Make sure you&apos;ve added your API key to .env.local and
                restarted the server
              </p>
            </div>
          )}

          {/* No Fixtures */}
          {!loading && !error && fixtures.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">
                No fixtures found for this period
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Try selecting a different date range
              </p>
            </div>
          )}

          {/* Fixtures List */}
          {!loading && !error && fixtures.length > 0 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {fixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedMatches.includes(fixture.id)
                      ? "bg-primary/10 border-primary"
                      : "bg-dark-card border-white/10 hover:border-white/20"
                  }`}
                  onClick={() => toggleMatchSelection(fixture.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedMatches.includes(fixture.id)}
                      onChange={() => toggleMatchSelection(fixture.id)}
                      className="mt-1 w-5 h-5 accent-primary"
                    />
                    <div className="flex-1">
                      {/* League & Status */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={fixture.league.logo}
                            alt={fixture.league.name}
                            className="w-4 h-4"
                          />
                          <span className="text-xs text-gray-400">
                            {fixture.league.name}
                          </span>
                        </div>
                        {fixture.isLive && (
                          <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            LIVE {fixture.elapsed}&apos;
                          </span>
                        )}
                        {!fixture.isLive && (
                          <span className="text-xs text-gray-400">
                            {new Date(fixture.date).toLocaleDateString()} •{" "}
                            {new Date(fixture.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      {/* Teams */}
                      <div className="space-y-2">
                        {/* Home Team */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={fixture.homeTeam.logo}
                              alt={fixture.homeTeam.name}
                              className="w-6 h-6"
                            />
                            <span className="text-white font-medium text-sm">
                              {fixture.homeTeam.name}
                            </span>
                          </div>
                          {fixture.homeScore !== null && (
                            <span className="text-white font-bold text-lg">
                              {fixture.homeScore}
                            </span>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={fixture.awayTeam.logo}
                              alt={fixture.awayTeam.name}
                              className="w-6 h-6"
                            />
                            <span className="text-white font-medium text-sm">
                              {fixture.awayTeam.name}
                            </span>
                          </div>
                          {fixture.awayScore !== null && (
                            <span className="text-white font-bold text-lg">
                              {fixture.awayScore}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      {!fixture.isLive && fixture.status !== "NS" && (
                        <div className="text-xs text-gray-500 mt-2">
                          {fixture.statusLong}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Matches Summary */}
        {selectedMatches.length > 0 && (
          <div className="glass-card p-4">
            <h2 className="text-lg font-semibold text-white mb-3">
              ✅ Selected Matches ({selectedMatches.length})
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Users will predict{" "}
              {userPredictionMode === "outcome"
                ? "outcomes (Win/Draw)"
                : "exact scores"}{" "}
              for these matches
            </p>

            <div className="space-y-2">
              {selectedMatches.map((matchId) => {
                const match = fixtures.find((m) => m.id === matchId);
                if (!match) return null;
                return (
                  <div
                    key={matchId}
                    className="flex items-center justify-between p-3 bg-dark-card rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={match.homeTeam.logo}
                        alt={match.homeTeam.name}
                        className="w-5 h-5"
                      />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {match.homeTeam.name} vs {match.awayTeam.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {match.league.name} •{" "}
                          {new Date(match.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-primary font-medium px-2 py-1 bg-primary/10 rounded">
                      {userPredictionMode === "outcome" ? "Win/Draw" : "Score"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="glass-card p-4 border-l-4 border-primary">
          <p className="text-sm text-gray-300">
            💡 <span className="font-semibold">Scoring System:</span>
          </p>
          <ul className="text-sm text-gray-400 mt-2 space-y-1 ml-4">
            <li>• Exact Score: 10 points</li>
            <li>• Winner: 5 points</li>
            <li>• Draw: 5 points</li>
          </ul>
          <p className="text-sm text-gray-300 mt-3">
            🔒 Prize pool will be locked in the smart contract when you create
            this event.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
        >
          Create Event & Lock {prizeAmount || "0"} USDC
        </button>
      </form>
    </div>
  );
}
