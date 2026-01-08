"use client";

export default function ActionButtons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mb-8">
      {/* Create Prediction Button */}
      <div className="glass-card p-6 text-center cursor-pointer group">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/30 to-blue-600/20 flex items-center justify-center group-hover:from-primary/50 group-hover:to-blue-600/40 transition-all group-hover:shadow-lg group-hover:shadow-primary/20">
          <span className="text-2xl">➕</span>
        </div>
        <h3 className="text-white font-bold text-lg mb-1.5">Create Prediction</h3>
        <p className="text-gray-400 text-sm">Set up a new prediction event</p>
      </div>

      {/* Join Competition Button */}
      <div className="glass-card p-6 text-center cursor-pointer group">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/20 flex items-center justify-center group-hover:from-amber-500/50 group-hover:to-orange-600/40 transition-all group-hover:shadow-lg group-hover:shadow-amber-500/20">
          <span className="text-2xl">🏆</span>
        </div>
        <h3 className="text-white font-bold text-lg mb-1.5">Join Competition</h3>
        <p className="text-gray-400 text-sm">Compete on leaderboards</p>
      </div>
    </div>
  );
}
