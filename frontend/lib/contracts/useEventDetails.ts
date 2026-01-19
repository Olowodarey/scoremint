import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, ScoremintABI } from "./useScoremintContract";
import { footballApi } from "@/app/services/footballApiClient";
import { useState, useEffect } from "react";
import type { SimpleFixture } from "@/app/types/football.types";

export function useEventDetails(eventId: bigint) {
  const [fixtures, setFixtures] = useState<SimpleFixture[]>([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false);

  // Fetch event from contract
  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "getEvent",
    args: [eventId],
  });

  // Fetch fixtures from API when event loads
  useEffect(() => {
    async function fetchFixtures() {
      const typedEvent = event as { fixtureIds?: bigint[] } | undefined;

      if (
        !typedEvent ||
        !typedEvent.fixtureIds ||
        typedEvent.fixtureIds.length === 0
      ) {
        return;
      }

      setIsLoadingFixtures(true);
      try {
        const fixturePromises = typedEvent.fixtureIds.map((id: bigint) =>
          footballApi.getFixtureById(Number(id)),
        );
        const fetchedFixtures = await Promise.all(fixturePromises);
        setFixtures(
          fetchedFixtures.filter(
            (f: SimpleFixture | null) => f !== null,
          ) as SimpleFixture[],
        );
      } catch (err) {
        console.error("Error fetching fixtures:", err);
      } finally {
        setIsLoadingFixtures(false);
      }
    }

    fetchFixtures();
  }, [event]);

  return {
    event: event as
      | {
          eventId: bigint;
          creator: string;
          name: string;
          prizePool: bigint;
          prizeToken: string;
          deadline: bigint;
          mode: number;
          distributionType: number;
          finalized: boolean;
          totalParticipants: bigint;
          fixtureIds: bigint[];
        }
      | undefined,
    fixtures,
    isLoading: isLoading || isLoadingFixtures,
    error,
    refetch,
  };
}

export function getEventMode(mode: number): string {
  return mode === 0 ? "Outcome" : "Exact Score";
}

export function getDistributionType(type: number): string {
  const types = ["Winner Take All", "Top 3", "Top 5", "Top 10"];
  return types[type] || "Unknown";
}

export function getTimeRemaining(deadline: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = Number(deadline) - now;

  if (remaining <= 0) return "Expired";

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
