"use client";

const funFeatures = [
  "No rewards required",
  "Compete with friends",
  "Track scores & rankings",
  "Earn milestone badges",
];

const rewardFeatures = [
  "Creator-funded prizes",
  "Instant payouts",
  "NFT badges for winners",
  "Transparent & fair",
];

export default function PlayModes() {
  return (
    <section className="px-4 py-12">
      {/* Section Header */}
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Choose Your <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">Play Mode</span>
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
          Play casually with friends or compete for creator-funded rewards
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Play for Fun */}
        <div className="glass-card-green p-6 md:p-8 relative overflow-hidden group cursor-pointer">
          {/* Glow effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all" />
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Free Mode</span>
          </div>

          {/* Icon & Title */}
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">🎮</div>
            <h3 className="text-2xl font-bold text-white">Play for Fun</h3>
          </div>

          {/* Description */}
          <p className="text-gray-400 mb-6">
            Test your football knowledge against friends. No stakes, just bragging rights.
          </p>

          {/* Features */}
          <ul className="space-y-3">
            {funFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400 text-xs">✓</span>
                </span>
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button className="w-full mt-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]">
            Start Playing Free →
          </button>
        </div>

        {/* Play for Rewards */}
        <div className="glass-card-purple p-6 md:p-8 relative overflow-hidden group cursor-pointer">
          {/* Glow effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all" />
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">Rewards Mode</span>
          </div>

          {/* Icon & Title */}
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">🏆</div>
            <h3 className="text-2xl font-bold text-white">Play for Rewards</h3>
          </div>

          {/* Description */}
          <p className="text-gray-400 mb-6">
            Compete in creator-funded challenges. Winner takes all — you never stake anything.
          </p>

          {/* Features */}
          <ul className="space-y-3">
            {rewardFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 text-xs">✓</span>
                </span>
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button className="w-full mt-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98]">
            Join a Challenge →
          </button>
        </div>
      </div>
    </section>
  );
}
