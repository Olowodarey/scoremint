import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, ScoremintABI } from "./useScoremintContract";

export interface PredictionEvent {
  eventId: bigint;
  creator: string;
  name: string;
  prizePool: bigint;
  prizeToken: string;
  deadline: bigint;
  mode: number; // 0 = OUTCOME, 1 = EXACT_SCORE
  distributionType: number; // 0 = WINNER_TAKE_ALL, 1 = TOP_3, 2 = TOP_5, 3 = TOP_10
  finalized: boolean;
  totalParticipants: bigint;
  fixtureIds: bigint[];
}

export function useAllEvents() {
  const {
    data: eventsData,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "getAllEvents",
  });

  // Process events data
  const events: PredictionEvent[] = (eventsData as PredictionEvent[]) || [];

  return {
    events,
    isLoading,
    error,
    refetch,
  };
}

// Helper function to format event mode
export function getEventMode(mode: number): string {
  return mode === 0 ? "Outcome" : "Exact Score";
}

// Helper function to format distribution type
export function getDistributionType(type: number): string {
  const types = ["Winner Take All", "Top 3", "Top 5", "Top 10"];
  return types[type] || "Unknown";
}

// Helper function to check if event is active
export function isEventActive(deadline: bigint): boolean {
  const now = Math.floor(Date.now() / 1000);
  return Number(deadline) > now;
}

// Helper function to format time remaining
export function getTimeRemaining(deadline: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(deadline) - now;

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
