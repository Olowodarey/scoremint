import { useReadContract, useAccount } from "wagmi";
import { CONTRACT_ADDRESS, ScoremintABI } from "./useScoremintContract";

export interface MatchResult {
  fixtureId: bigint;
  homeScore: number;
  awayScore: number;
  matchTimestamp: bigint;
}

export interface Prediction {
  fixtureId: bigint;
  outcome: number;
  homeScore: number;
  awayScore: number;
}

export interface UserPrediction {
  user: string;
  eventId: bigint;
  submittedAt: bigint;
  predictions: Prediction[];
  totalScore: bigint;
  claimed: boolean;
}

export interface UserRank {
  rank: bigint;
  score: bigint;
}

/**
 * Hook to fetch event results and user's performance
 */
export function useEventResults(eventId: bigint) {
  const { address } = useAccount();

  // Fetch match results for the event
  const {
    data: matchResults,
    isLoading: isLoadingResults,
    error: resultsError,
    refetch: refetchResults,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "getEventResults",
    args: [eventId],
  });

  // Fetch user's predictions if user is connected
  const {
    data: userPredictions,
    isLoading: isLoadingPredictions,
    error: predictionsError,
    refetch: refetchPredictions,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "getUserPredictions",
    args: address ? [eventId, address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Check if user has submitted predictions
  const { data: hasSubmitted, isLoading: isLoadingSubmission } =
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: ScoremintABI,
      functionName: "hasUserSubmitted",
      args: address ? [eventId, address] : undefined,
      query: {
        enabled: !!address,
      },
    });

  // Fetch user's rank if they participated
  const {
    data: userRank,
    isLoading: isLoadingRank,
    refetch: refetchRank,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "getUserRankInEvent",
    args: address && hasSubmitted ? [eventId, address] : undefined,
    query: {
      enabled: !!address && !!hasSubmitted,
    },
  });

  const isLoading =
    isLoadingResults ||
    isLoadingPredictions ||
    isLoadingSubmission ||
    isLoadingRank;
  const error = resultsError || predictionsError;

  const refetch = () => {
    refetchResults();
    refetchPredictions();
    refetchRank();
  };

  return {
    matchResults: matchResults as MatchResult[] | undefined,
    userPredictions: userPredictions as UserPrediction | undefined,
    userRank: userRank as [bigint, bigint] | undefined, // [rank, score]
    hasSubmitted: !!hasSubmitted,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Helper to get outcome label
 */
export function getOutcomeLabel(outcome: number): string {
  const outcomes = ["Home Win", "Away Win", "Draw"];
  return outcomes[outcome] || "Unknown";
}

/**
 * Helper to compare prediction with result
 */
export function isPredictionCorrect(
  prediction: Prediction,
  result: MatchResult,
  mode: number, // 0 = OUTCOME, 1 = EXACT_SCORE
): boolean {
  if (mode === 0) {
    // OUTCOME mode
    const actualOutcome = getMatchOutcome(result.homeScore, result.awayScore);
    return prediction.outcome === actualOutcome;
  } else {
    // EXACT_SCORE mode
    return (
      prediction.homeScore === result.homeScore &&
      prediction.awayScore === result.awayScore
    );
  }
}

/**
 * Helper to determine match outcome from scores
 */
export function getMatchOutcome(homeScore: number, awayScore: number): number {
  if (homeScore > awayScore) return 0; // HOME_WIN
  if (awayScore > homeScore) return 1; // AWAY_WIN
  return 2; // DRAW
}

/**
 * Calculate points for a single prediction
 */
export function calculatePredictionPoints(
  prediction: Prediction,
  result: MatchResult,
  mode: number,
): number {
  if (mode === 0) {
    // OUTCOME mode: 3 points for correct outcome
    return isPredictionCorrect(prediction, result, mode) ? 3 : 0;
  } else {
    // EXACT_SCORE mode
    let points = 0;

    // Exact score: 5 points
    if (
      prediction.homeScore === result.homeScore &&
      prediction.awayScore === result.awayScore
    ) {
      points = 5;
    }
    // Correct goal difference: 3 points
    else if (
      Math.abs(prediction.homeScore - prediction.awayScore) ===
      Math.abs(result.homeScore - result.awayScore)
    ) {
      points = 3;
    }
    // Correct outcome: 1 point
    else if (
      getMatchOutcome(prediction.homeScore, prediction.awayScore) ===
      getMatchOutcome(result.homeScore, result.awayScore)
    ) {
      points = 1;
    }

    return points;
  }
}
