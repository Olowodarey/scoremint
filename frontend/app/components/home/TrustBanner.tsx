"use client";

export default function TrustBanner() {
  return (
    <div className="px-4 mb-8">
      <div className="trust-banner px-6 py-4 flex items-center justify-center gap-3">
        <span className="text-2xl">🛡️</span>
        <p className="text-gray-300 text-sm md:text-base font-medium">
          <span className="text-emerald-400 font-bold">ScoreMint is NOT gambling.</span>
          {" "}No staking. No betting. No financial risk.
        </p>
      </div>
    </div>
  );
}
