import React from "react";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, ScoremintABI } from "./useScoremintContract";

export interface UserStats {
  eventsWon: number;
  totalPredictions: number;
  points: number;
  winRate: number;
  currentStreak: number;
  rank: number;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  result: "won" | "lost" | "pending";
  prediction: string;
  points: number;
}

export function useUserProfile(address: `0x${string}` | undefined) {
  // Fetch user stats from contract
  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "getUserStats",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Fetch user participated events
  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    error: eventsError,
    refetch: refetchEvents,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "getUserParticipatedEvents",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Check if user is registered
  const { data: isRegistered, isLoading: isLoadingRegistration } =
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: ScoremintABI,
      functionName: "isUserRegistered",
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
      },
    });

  // Process stats data
  const userStats: UserStats = React.useMemo(() => {
    if (!statsData) {
      return {
        eventsWon: 0,
        totalPredictions: 0,
        points: 0,
        winRate: 0,
        currentStreak: 0,
        rank: 0,
      };
    }

    // statsData is a tuple: [eventsParticipated, eventsCreated, eventsWon, totalPoints, totalEarnings]
    const [eventsParticipated, , eventsWon, totalPoints] = statsData as [
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
    ];

    const participated = Number(eventsParticipated);
    const won = Number(eventsWon);
    const winRate = participated > 0 ? (won / participated) * 100 : 0;

    return {
      eventsWon: won,
      totalPredictions: participated,
      points: Number(totalPoints),
      winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
      currentStreak: 0, // TODO: Calculate from event history
      rank: 0, // TODO: Implement global ranking
    };
  }, [statsData]);

  // Process events data
  const recentEvents: Event[] = React.useMemo(() => {
    if (!eventsData || !Array.isArray(eventsData)) {
      return [];
    }

    // Convert contract events to UI format
    // Take the last 5 events for recent history
    return eventsData
      .slice(-5)
      .reverse()
      .map(
        (
          event: {
            eventId?: bigint;
            deadline?: bigint;
            finalized?: boolean;
            winners?: string[];
            name?: string;
          },
          index: number,
        ) => {
          const eventId = event.eventId?.toString() || index.toString();
          const deadline = Number(event.deadline || 0);
          const isFinalized = event.finalized || false;
          const winners = event.winners || [];
          const now = Math.floor(Date.now() / 1000);
          const isExpired = deadline <= now;

          // Determine result with better state handling
          let result: "won" | "lost" | "pending" = "pending";
          const points = 0;

          if (isFinalized && address) {
            // Event is finalized, check if user won
            const isWinner = winners.some(
              (w: string) => w.toLowerCase() === address.toLowerCase(),
            );
            result = isWinner ? "won" : "lost";

            // TODO: Fetch actual points from userPredictions
            // For now, we'll leave it as 0 until we fetch from contract
          } else if (isExpired && !isFinalized) {
            // Event ended but not finalized - still pending results
            result = "pending";
          }

          return {
            id: eventId,
            name: event.name || `Event #${eventId}`,
            date:
              deadline > 0
                ? new Date(deadline * 1000).toISOString().split("T")[0]
                : "",
            result,
            prediction: "View Details", // TODO: Fetch actual predictions
            points,
          };
        },
      );
  }, [eventsData, address]);

  const isLoading = isLoadingStats || isLoadingEvents || isLoadingRegistration;
  const error = statsError || eventsError;

  const refetch = () => {
    refetchStats();
    refetchEvents();
  };

  return {
    userStats,
    recentEvents,
    isLoading,
    error,
    isRegistered: !!isRegistered,
    refetch,
  };
}
