"use client";

import Hero from "../components/home/Hero";
import TrustBanner from "../components/home/TrustBanner";
import HowItWorks from "../components/home/HowItWorks";

export default function Home() {
  return (
    <div className="pb-20 overflow-hidden">
      {/* Hero Section */}
      <Hero />

      {/* Trust Banner */}
      <TrustBanner />

      {/* How It Works */}
      <HowItWorks />

      {/* Play Modes */}
      {/* <PlayModes /> */}

      {/* Action Buttons */}
      {/* <div className="py-8">
        <ActionButtons />
      </div> */}

      {/* Why ScoreMint */}
      {/* <WhyScoreMint /> */}

      {/* Active Predictions Section */}
      <section className="px-4 py-12">
        {/* <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Active Predictions
            </h2>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-gray-300 hover:text-white transition-all">
            View All
            <span>→</span>
          </button>
        </div> */}

        {/* Prediction Cards Grid */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PredictionCard
            event="AFCON 2025 Qualifier"
            team1="Nigeria"
            team2="Ghana"
            prizePool="500 USDC"
            participants={234}
            timeRemaining="1d 23:59:56"
            isLive={true}
          />

          <PredictionCard
            event="Premier League Matchday 20"
            team1="Arsenal"
            team2="Man City"
            prizePool="1,000 USDC"
            participants={587}
            timeRemaining="4d 23:59:46"
          />
        </div> */}
      </section>

      {/* Footer CTA */}
      {/* <section className="px-4 py-12 relative">
        <div className="orb orb-blue w-64 h-64 top-0 left-1/4" />
        <div className="gradient-border p-8 md:p-12 text-center relative max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Test Your Prediction Skills?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Join thousands of football fans competing on ScoreMint. Free to play, transparent scoring, and real rewards.
          </p>
          <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-400 hover:via-purple-400 hover:to-emerald-400 text-white font-bold text-lg transition-all hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98]">
            Get Started for Free →
          </button>
        </div>
      </section> */}
    </div>
  );
}
