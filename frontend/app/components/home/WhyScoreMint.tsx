"use client";

const features = [
  {
    icon: "🔗",
    title: "On-Chain Timestamps",
    description: "Immutable proof of when predictions were made",
  },
  {
    icon: "⚡",
    title: "Automatic Scoring",
    description: "Smart contracts handle all calculations",
  },
  {
    icon: "🎨",
    title: "NFT Badges",
    description: "Mint proof of your prediction skills",
  },
  {
    icon: "🆓",
    title: "Free to Participate",
    description: "No staking, betting, or financial risk",
  },
  {
    icon: "🛡️",
    title: "Dispute-Proof",
    description: "Transparent, verifiable outcomes",
  },
  {
    icon: "💸",
    title: "Instant Payouts",
    description: "Creator-funded rewards sent automatically",
  },
];

export default function WhyScoreMint() {
  return (
    <section className="px-4 py-12 relative">
   
      
      {/* Section Header */}
      <div className="text-center mb-10 relative">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Why <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">ScoreMint</span>?
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
          Built on Base for fair, transparent, and trustless prediction challenges
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto relative">
        {features.map((feature, index) => (
          <div
            key={index}
            className="glass-card p-5 text-center group hover:scale-[1.02] transition-transform"
          >
            {/* Icon */}
            <div className="feature-icon mx-auto mb-4">
              {feature.icon}
            </div>

            {/* Content */}
            <h3 className="text-white font-semibold text-sm md:text-base mb-1.5">
              {feature.title}
            </h3>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
