"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  useEventDetails,
  getEventMode,
  getDistributionType,
  getTimeRemaining,
} from "@/lib/contracts/useEventDetails";
import { useSubmitPredictions } from "@/lib/contracts/useSubmitPredictions";
import { formatUnits } from "viem";
import type { SimpleFixture } from "@/app/types/football.types";

interface Prediction {
  fixtureId: bigint;
  outcome: number; // 0 = HOME_WIN, 1 = AWAY_WIN, 2 = DRAW
  homeScore: number;
  awayScore: number;
}

export default function EventDetails() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const eventId = params?.id ? BigInt(params.id as string) : BigInt(0);

  const { event, fixtures, isLoading, error } = useEventDetails(eventId);
  const { submitPredictions, isPending, isConfirming, isConfirmed, hash } =
    useSubmitPredictions();

  const [predictions, setPredictions] = useState<Map<string, Prediction>>(
    new Map(),
  );
  const [txStatus, setTxStatus] = useState("");

  // Initialize predictions when fixtures load
  useEffect(() => {
    if (fixtures && fixtures.length > 0) {
      const initialPredictions = new Map<string, Prediction>();
      fixtures.forEach((fixture: SimpleFixture) => {
        initialPredictions.set(fixture.id.toString(), {
          fixtureId: BigInt(fixture.id),
          outcome: 0, // Default to HOME_WIN
          homeScore: 0,
          awayScore: 0,
        });
      });
      setPredictions(initialPredictions);
    }
  }, [fixtures]);

  const updatePrediction = (
    fixtureId: string,
    field: keyof Prediction,
    value: number | bigint,
  ) => {
    setPredictions((prev) => {
      const newPredictions = new Map(prev);
      const current = newPredictions.get(fixtureId);
      if (current) {
        newPredictions.set(fixtureId, {
          ...current,
          [field]: value,
        });
      }
      return newPredictions;
    });
  };

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!event) {
      alert("Event not found");
      return;
    }

    // Convert predictions map to array
    const predictionsArray = Array.from(predictions.values());

    // Validate all predictions are set
    if (predictionsArray.length !== fixtures.length) {
      alert("Please make predictions for all matches");
      return;
    }

    try {
      setTxStatus("Submitting predictions...");

      await submitPredictions(eventId, predictionsArray);

      setTxStatus("Predictions submitted successfully!");

      // Redirect to events page after success
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      console.error("Error submitting predictions:", err);
      setTxStatus("");
      alert(
        `Failed to submit predictions: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading event</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-all"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const isPaid = Number(event.prizePool) > 0;
  const isOutcomeMode = event.mode === 0;
  const timeRemaining = getTimeRemaining(event.deadline);
  const isExpired = Number(event.deadline) < Math.floor(Date.now() / 1000);

  return (
    <div className="pb-20 px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
        >
          ← Back to Events
        </button>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {event.name}
        </h1>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isPaid
                ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30"
                : "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30"
            }`}
          >
            {isPaid ? "💰 Paid" : "🎮 Free"}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {getEventMode(event.mode)}
          </span>
          {isExpired && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
              ⏰ Expired
            </span>
          )}
        </div>
      </div>

      {/* Event Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {isPaid && (
          <div className="gradient-border p-4">
            <p className="text-sm text-gray-400 mb-1">Prize Pool</p>
            <p className="text-2xl font-bold text-yellow-400">
              {formatUnits(event.prizePool, 6)} USDC
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {getDistributionType(event.distributionType)}
            </p>
          </div>
        )}

        <div className="gradient-border p-4">
          <p className="text-sm text-gray-400 mb-1">Participants</p>
          <p className="text-2xl font-bold text-white">
            👥 {event.totalParticipants.toString()}
          </p>
        </div>

        <div className="gradient-border p-4">
          <p className="text-sm text-gray-400 mb-1">Time Remaining</p>
          <p
            className={`text-2xl font-bold ${isExpired ? "text-red-400" : "text-purple-400"}`}
          >
            {isExpired ? "⚠️" : "⏰"} {timeRemaining}
          </p>
        </div>
      </div>

      {/* Expired Warning */}
      {isExpired && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
          <p className="text-red-400 font-semibold">⚠️ Event Expired</p>
          <p className="text-red-300 text-sm">
            The deadline for this event has passed. You can no longer submit
            predictions.
          </p>
        </div>
      )}

      {/* Predictions Form */}
      {!isExpired && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Make Your Predictions
            </h2>
            <p className="text-gray-400 text-sm">
              {isOutcomeMode
                ? "Predict the outcome (Win/Draw) for each match"
                : "Predict the exact score for each match"}
            </p>
          </div>

          {/* Fixtures List */}
          <div className="space-y-4 mb-8">
            {fixtures.map((fixture: SimpleFixture) => {
              const prediction = predictions.get(fixture.id.toString());

              return (
                <div key={fixture.id} className="gradient-border p-4">
                  {/* Match Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={fixture.league.logo}
                        alt={fixture.league.name}
                        className="w-5 h-5"
                      />
                      <span className="text-xs text-gray-400">
                        {fixture.league.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(fixture.date).toLocaleDateString()} •{" "}
                      {new Date(fixture.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Teams */}
                  <div className="grid grid-cols-3 gap-4 items-center mb-4">
                    {/* Home Team */}
                    <div className="text-center">
                      <img
                        src={fixture.homeTeam.logo}
                        alt={fixture.homeTeam.name}
                        className="w-12 h-12 mx-auto mb-2"
                      />
                      <p className="text-white font-medium text-sm">
                        {fixture.homeTeam.name}
                      </p>
                    </div>

                    {/* VS */}
                    <div className="text-center">
                      <p className="text-gray-500 font-bold">VS</p>
                    </div>

                    {/* Away Team */}
                    <div className="text-center">
                      <img
                        src={fixture.awayTeam.logo}
                        alt={fixture.awayTeam.name}
                        className="w-12 h-12 mx-auto mb-2"
                      />
                      <p className="text-white font-medium text-sm">
                        {fixture.awayTeam.name}
                      </p>
                    </div>
                  </div>

                  {/* Prediction Input */}
                  {isOutcomeMode ? (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updatePrediction(fixture.id.toString(), "outcome", 0)
                        }
                        className={`p-3 rounded-lg border-2 transition-all ${
                          prediction?.outcome === 0
                            ? "bg-green-500/20 border-green-500"
                            : "bg-dark-card border-white/10 hover:border-white/20"
                        }`}
                      >
                        <p className="text-white font-semibold text-sm">
                          Home Win
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updatePrediction(fixture.id.toString(), "outcome", 2)
                        }
                        className={`p-3 rounded-lg border-2 transition-all ${
                          prediction?.outcome === 2
                            ? "bg-yellow-500/20 border-yellow-500"
                            : "bg-dark-card border-white/10 hover:border-white/20"
                        }`}
                      >
                        <p className="text-white font-semibold text-sm">Draw</p>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updatePrediction(fixture.id.toString(), "outcome", 1)
                        }
                        className={`p-3 rounded-lg border-2 transition-all ${
                          prediction?.outcome === 1
                            ? "bg-blue-500/20 border-blue-500"
                            : "bg-dark-card border-white/10 hover:border-white/20"
                        }`}
                      >
                        <p className="text-white font-semibold text-sm">
                          Away Win
                        </p>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={prediction?.homeScore || 0}
                        onChange={(e) =>
                          updatePrediction(
                            fixture.id.toString(),
                            "homeScore",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-full px-4 py-3 bg-dark-card border border-white/10 rounded-lg text-white text-center text-xl font-bold focus:border-primary focus:outline-none"
                      />
                      <p className="text-center text-gray-500 font-bold">-</p>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={prediction?.awayScore || 0}
                        onChange={(e) =>
                          updatePrediction(
                            fixture.id.toString(),
                            "awayScore",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-full px-4 py-3 bg-dark-card border border-white/10 rounded-lg text-white text-center text-xl font-bold focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isPending || isConfirming || !isConnected || isExpired}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-400 hover:via-purple-400 hover:to-emerald-400 text-white font-bold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isConnected
              ? "Connect Wallet to Submit"
              : isPending || isConfirming
                ? "Submitting Predictions..."
                : "Submit Predictions"}
          </button>

          {/* Transaction Status */}
          {(txStatus || isConfirmed) && (
            <div
              className={`mt-4 p-4 rounded-lg border-l-4 ${
                isConfirmed
                  ? "border-green-500 bg-green-500/10"
                  : "border-blue-500 bg-blue-500/10"
              }`}
            >
              {isConfirmed ? (
                <div>
                  <p className="text-green-400 font-semibold mb-2">
                    ✅ Predictions Submitted Successfully!
                  </p>
                  <p className="text-sm text-gray-300">
                    Transaction:{" "}
                    <a
                      href={`https://basescan.org/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {hash?.slice(0, 10)}...{hash?.slice(-8)}
                    </a>
                  </p>
                </div>
              ) : (
                <p className="text-blue-400 font-semibold">⏳ {txStatus}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
