"use client";

export default function Hero() {
  return (
    <section className="px-4 lg:px-12 xl:px-20 py-6 md:py-8 lg:py-10 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0  from-blue-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10  max-w-7xl mx-auto w-full">
        <div className="text-center mb-10 lg:mb-14">
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 lg:mb-8 leading-tight">
            <span className="text-shimmer">Predict. Compete. Mint Your Legacy.</span>
            
              
            
          </h1>

          <p className="text-gray-400 text-base md:text-lg lg:text-xl xl:text-2xl max-w-3xl mx-auto mb-10 lg:mb-12 leading-relaxed px-4">
            The fair, transparent prediction platform for friends, creators, and
            communities.
            <br className="hidden md:block" />
            <span className="text-gray-300">
              Free to play. Creator-funded rewards. NFT badges for winners.
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 lg:gap-6 mb-12 lg:mb-16">
            <button className="w-full sm:w-auto px-10 lg:px-12 py-4 lg:py-5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-bold text-lg lg:text-xl transition-all hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98]">
              Start Predicting Free →
            </button>
            <button className="w-full sm:w-auto px-10 lg:px-12 py-4 lg:py-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold text-lg lg:text-xl transition-all">
              How It Works
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-12 lg:mt-16 animate-bounce-slow flex justify-center">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/40 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
