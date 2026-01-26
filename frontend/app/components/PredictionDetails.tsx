"use client";

import React, { useState } from "react";
import { useEventResults } from "@/lib/contracts/useEventResults";
import {
  useEventStatus,
  getStatusLabel,
  getStatusEmoji,
  getStatusColor,
} from "@/lib/contracts/useEventStatus";
import { useEventDetails } from "@/lib/contracts/useEventDetails";
import { footballApi } from "@/app/services/footballApiClient";
import type { SimpleFixture } from "@/app/types/football.types";
import {
  getOutcomeLabel,
  isPredictionCorrect,
  calculatePredictionPoints,
  type MatchResult,
  type Prediction,
} from "@/lib/contracts/useEventResults";

interface PredictionDetailsProps {
  eventId: bigint;
  onClose: () => void;
}

export default function PredictionDetails({
  eventId,
  onClose,
}: PredictionDetailsProps) {
  const {
    event,
    fixtures,
    isLoading: isLoadingEvent,
  } = useEventDetails(eventId);
  const {
    matchResults,
    userPredictions,
    userRank,
    hasSubmitted,
    isLoading: isLoadingResults,
  } = useEventResults(eventId);
  const { statusInfo, isLoading: isLoadingStatus } = useEventStatus(eventId);

  const isLoading = isLoadingEvent || isLoadingResults || isLoadingStatus;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading prediction details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-2xl w-full">
          <div className="text-center">
            <span className="text-6xl mb-4 block">📭</span>
            <h3 className="text-xl font-bold text-white mb-2">
              No Predictions Found
            </h3>
            <p className="text-gray-400 mb-6">
              You haven't submitted predictions for this event.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mode = event?.mode ?? 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card p-6 max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {event?.name || "Event Details"}
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-3 py-1 rounded-full ${getStatusColor(
                  statusInfo.userResult,
                )}`}
              >
                {getStatusEmoji(statusInfo.userResult)}{" "}
                {getStatusLabel(statusInfo.userResult)}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
                {mode === 0 ? "Outcome" : "Exact Score"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Score Summary */}
        {statusInfo.isFinalized && userRank && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">Your Score</p>
              <p className="text-3xl font-bold text-purple-400">
                {userRank[1].toString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">points</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">Your Rank</p>
              <p className="text-3xl font-bold text-purple-400">
                #{userRank[0].toString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">position</p>
            </div>
          </div>
        )}

        {/* Predictions vs Results */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">
            {statusInfo.hasResults
              ? "Your Predictions vs Results"
              : "Your Predictions"}
          </h3>

          {userPredictions?.predictions.map((prediction, index) => {
            const fixture = fixtures.find(
              (f) => BigInt(f.id) === prediction.fixtureId,
            );
            const result = matchResults?.find(
              (r) => r.fixtureId === prediction.fixtureId,
            );
            const isCorrect = result
              ? isPredictionCorrect(prediction, result, mode)
              : undefined;
            const points = result
              ? calculatePredictionPoints(prediction, result, mode)
              : 0;

            return (
              <div
                key={index}
                className={`glass-card p-4 ${
                  isCorrect === true
                    ? "border border-green-500/30"
                    : isCorrect === false
                      ? "border border-red-500/30"
                      : ""
                }`}
              >
                {/* Match Info */}
                {fixture && (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={fixture.homeTeam.logo}
                        alt={fixture.homeTeam.name}
                        className="w-8 h-8"
                      />
                      <span className="text-white font-medium">
                        {fixture.homeTeam.name}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm mx-2">vs</span>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-white font-medium">
                        {fixture.awayTeam.name}
                      </span>
                      <img
                        src={fixture.awayTeam.logo}
                        alt={fixture.awayTeam.name}
                        className="w-8 h-8"
                      />
                    </div>
                  </div>
                )}

                {/* Prediction */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">
                      Your Prediction
                    </p>
                    <p className="text-white font-semibold">
                      {mode === 0
                        ? getOutcomeLabel(prediction.outcome)
                        : `${prediction.homeScore} - ${prediction.awayScore}`}
                    </p>
                  </div>

                  {result && (
                    <>
                      <div className="flex-1 text-center">
                        <p className="text-xs text-gray-400 mb-1">
                          Actual Result
                        </p>
                        <p className="text-white font-semibold">
                          {mode === 0
                            ? getOutcomeLabel(
                                result.homeScore > result.awayScore
                                  ? 0
                                  : result.awayScore > result.homeScore
                                    ? 1
                                    : 2,
                              )
                            : `${result.homeScore} - ${result.awayScore}`}
                        </p>
                      </div>

                      <div className="flex-1 text-right">
                        <p className="text-xs text-gray-400 mb-1">Points</p>
                        <p
                          className={`text-lg font-bold ${
                            points > 0 ? "text-green-400" : "text-gray-500"
                          }`}
                        >
                          {points > 0 ? "+" : ""}
                          {points}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Status Badge */}
                {isCorrect !== undefined && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        isCorrect
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {isCorrect ? "✓ Correct" : "× Incorrect"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Awaiting Results Message */}
        {!statusInfo.hasResults && statusInfo.isExpired && (
          <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="text-yellow-400 font-semibold">
                  Awaiting Results
                </p>
                <p className="text-sm text-gray-400">
                  The event has ended. Results will be available once the oracle
                  finalizes the event.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-400 hover:via-purple-400 hover:to-emerald-400 text-white font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
