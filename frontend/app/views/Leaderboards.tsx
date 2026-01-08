"use client";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isCurrentUser?: boolean;
}

export default function Leaderboards() {
  const leaderboardData: LeaderboardEntry[] = [
    { rank: 1, name: "CryptoKing", score: 2850 },
    { rank: 2, name: "PredictMaster", score: 2720 },
    { rank: 3, name: "ScoreHero", score: 2680 },
    { rank: 4, name: "You", score: 2450, isCurrentUser: true },
    { rank: 5, name: "FootballFan", score: 2380 },
    { rank: 6, name: "ChampPredictor", score: 2210 },
    { rank: 7, name: "GoalGetter", score: 2150 },
    { rank: 8, name: "MatchMaven", score: 2080 },
  ];

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 py-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white mb-2">Leaderboards</h1>
        <p className="text-gray-400 text-sm">Top predictors this season</p>
      </div>

      {/* Leaderboard List */}
      <div className="px-4 py-4">
        {leaderboardData.map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center gap-3 px-4 py-4 mb-2 rounded-lg border transition-all ${
              entry.isCurrentUser
                ? 'bg-primary/10 border-primary/30'
                : 'bg-dark-card/40 border-white/10 hover:bg-white/5'
            }`}
          >
            {/* Rank Badge */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                entry.rank === 1
                  ? 'bg-yellow-500 text-black'
                  : entry.rank === 2
                  ? 'bg-gray-300 text-black'
                  : entry.rank === 3
                  ? 'bg-orange-600 text-white'
                  : entry.isCurrentUser
                  ? 'bg-primary text-white'
                  : 'bg-dark-lighter text-gray-400'
              }`}
            >
              {entry.rank}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="text-white font-semibold">
                {entry.name}
                {entry.isCurrentUser && (
                  <span className="ml-2 text-xs text-primary">(You)</span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {entry.score.toLocaleString()} points
              </div>
            </div>

            {/* Trophy Icon for Top 3 */}
            {entry.rank <= 3 && (
              <div className="text-2xl">
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="px-4 mt-4">
        <div className="glass-card p-4 text-center">
          <p className="text-sm text-gray-400">
            Season ends in <span className="text-white font-semibold">24 days</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Top 10 win rewards from the prize pool
          </p>
        </div>
      </div>
    </div>
  );
}
