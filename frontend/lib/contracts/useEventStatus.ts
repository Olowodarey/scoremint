import { useReadContract, useAccount } from "wagmi";
import { CONTRACT_ADDRESS, ScoremintABI } from "./useScoremintContract";

export type EventStatus =
  | "active" // Before deadline
  | "ended" // After deadline, not finalized
  | "finalized"; // Finalized with results

export type UserEventResult =
  | "not_participated" // User didn't participate
  | "active" // Event is still active
  | "pending" // Event ended, awaiting results
  | "won" // User won
  | "lost"; // User lost

export interface EventStatusInfo {
  status: EventStatus;
  userResult: UserEventResult;
  isExpired: boolean;
  isFinalized: boolean;
  hasResults: boolean;
  userScore?: bigint;
  userRank?: bigint;
}

/**
 * Hook to determine detailed event status
 */
export function useEventStatus(eventId: bigint) {
  const { address } = useAccount();

  // Fetch event details
  const {
    data: event,
    isLoading: isLoadingEvent,
    refetch: refetchEvent,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "getEvent",
    args: [eventId],
  });

  // Check if user has submitted
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

  // Fetch event results to check if they exist
  const { data: eventResults, isLoading: isLoadingResults } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "getEventResults",
    args: [eventId],
  });

  // Fetch user rank if participated
  const { data: userRank, isLoading: isLoadingRank } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "getUserRankInEvent",
    args: address && hasSubmitted ? [eventId, address] : undefined,
    query: {
      enabled: !!address && !!hasSubmitted,
    },
  });

  const isLoading =
    isLoadingEvent || isLoadingSubmission || isLoadingResults || isLoadingRank;

  // Calculate status
  const statusInfo: EventStatusInfo = (() => {
    if (!event) {
      return {
        status: "active" as EventStatus,
        userResult: "not_participated" as UserEventResult,
        isExpired: false,
        isFinalized: false,
        hasResults: false,
      };
    }

    const typedEvent = event as {
      deadline: bigint;
      finalized: boolean;
      winners?: string[];
    };

    const now = Math.floor(Date.now() / 1000);
    const isExpired = Number(typedEvent.deadline) <= now;
    const isFinalized = typedEvent.finalized;
    const hasResults = Array.isArray(eventResults) && eventResults.length > 0;

    // Determine event status
    let status: EventStatus = "active";
    if (isFinalized) {
      status = "finalized";
    } else if (isExpired) {
      status = "ended";
    }

    // Determine user result
    let userResult: UserEventResult = "not_participated";
    let userScore: bigint | undefined;
    let rank: bigint | undefined;

    if (hasSubmitted) {
      if (!isExpired) {
        userResult = "active";
      } else if (!isFinalized) {
        userResult = "pending";
      } else {
        // Event is finalized, check if user won
        const winners = typedEvent.winners || [];
        const isWinner = address
          ? winners.some(
              (w: string) => w.toLowerCase() === address.toLowerCase(),
            )
          : false;

        userResult = isWinner ? "won" : "lost";

        // Get score and rank if available
        if (userRank) {
          const [rankValue, scoreValue] = userRank as [bigint, bigint];
          rank = rankValue;
          userScore = scoreValue;
        }
      }
    }

    return {
      status,
      userResult,
      isExpired,
      isFinalized,
      hasResults,
      userScore,
      userRank: rank,
    };
  })();

  return {
    statusInfo,
    isLoading,
    refetch: refetchEvent,
  };
}

/**
 * Get user-friendly status label
 */
export function getStatusLabel(userResult: UserEventResult): string {
  const labels: Record<UserEventResult, string> = {
    not_participated: "Not Participated",
    active: "Active",
    pending: "Awaiting Results",
    won: "Won",
    lost: "Lost",
  };
  return labels[userResult];
}

/**
 * Get status badge emoji
 */
export function getStatusEmoji(userResult: UserEventResult): string {
  const emojis: Record<UserEventResult, string> = {
    not_participated: "📭",
    active: "⏰",
    pending: "⏳",
    won: "✓",
    lost: "×",
  };
  return emojis[userResult];
}

/**
 * Get status color classes
 */
export function getStatusColor(userResult: UserEventResult): string {
  const colors: Record<UserEventResult, string> = {
    not_participated: "bg-gray-500/20 text-gray-400",
    active: "bg-blue-500/20 text-blue-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    won: "bg-green-500/20 text-green-400",
    lost: "bg-red-500/20 text-red-400",
  };
  return colors[userResult];
}
