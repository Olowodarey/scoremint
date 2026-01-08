"use client";

const steps = [
  {
    number: "1",
    icon: "🎯",
    title: "Create or Join",
    description: "Set up a prediction event or join existing ones for free",
  },
  {
    number: "2",
    icon: "📊",
    title: "Submit Predictions",
    description: "Make your predictions before the deadline",
  },
  {
    number: "3",
    icon: "🏆",
    title: "Climb Leaderboards",
    description: "Earn points for correct predictions and rank up",
  },
  {
    number: "4",
    icon: "🎁",
    title: "Win Rewards",
    description: "Get NFT badges and creator-funded prizes",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-4 py-12 relative">
      {/* Section Header */}
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          How It <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Works</span>
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
          From prediction to rewards in four simple steps
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className="glass-card p-6 text-center relative group"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Step Number */}
            <div className="step-number mx-auto mb-4 group-hover:scale-110 transition-transform">
              {step.number}
            </div>

            {/* Icon */}
            <div className="text-3xl mb-3 group-hover:animate-float">
              {step.icon}
            </div>

            {/* Content */}
            <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {step.description}
            </p>

            {/* Connector Line (hidden on last item and mobile) */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
