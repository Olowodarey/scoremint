"use client";

interface PredictionCardProps {
  event: string;
  team1: string;
  team2: string;
  prizePool: string;
  participants: number;
  timeRemaining: string;
  isLive?: boolean;
}

export default function PredictionCard({
  event,
  team1,
  team2,
  prizePool,
  participants,
  timeRemaining,
  isLive = false,
}: PredictionCardProps) {
  return (
    <div className="glass-card p-5 mb-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{event}</span>
        {isLive && (
          <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
            Live
          </span>
        )}
      </div>

      {/* Teams/Match */}
      <h3 className="text-white font-bold text-xl mb-5">
        {team1} <span className="text-gray-500 font-normal">vs</span> {team2}
      </h3>

      {/* Prediction Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <button className="bg-gradient-to-br from-slate-800 to-slate-900 hover:from-primary hover:to-primary-dark text-white px-3 py-3.5 rounded-xl transition-all font-semibold text-sm border border-white/10 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20">
          {team1}
        </button>
        <button className="bg-gradient-to-br from-slate-800 to-slate-900 hover:from-primary hover:to-primary-dark text-white px-3 py-3.5 rounded-xl transition-all font-semibold text-sm border border-white/10 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20">
          Draw
        </button>
        <button className="bg-gradient-to-br from-slate-800 to-slate-900 hover:from-primary hover:to-primary-dark text-white px-3 py-3.5 rounded-xl transition-all font-semibold text-sm border border-white/10 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20">
          {team2}
        </button>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-white/10">
        <div className="flex items-center gap-5 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            🏆 <span className="text-white font-semibold">{prizePool}</span>
          </span>
          <span className="flex items-center gap-1.5">
            👥 <span>{participants}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2.5 py-1.5 rounded-lg">
          ⏰ <span>{timeRemaining}</span>
        </div>
      </div>

      {/* CTA Button */}
      <button className="w-full mt-5 bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]">
        Predict Now →
      </button>
    </div>
  );
}
