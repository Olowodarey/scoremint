import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, ScoremintABI } from "./useScoremintContract";

/**
 * Hook to check if the contract is paused
 */
export function useContractStatus() {
  // Check if contract is paused
  const { data: isPaused, isLoading: isPausedLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "paused",
  });

  // Get oracle address
  const { data: oracle, isLoading: isOracleLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "oracle",
  });

  // Get owner address
  const { data: owner, isLoading: isOwnerLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "owner",
  });

  // Get event counter
  const { data: eventCounter, isLoading: isEventCounterLoading } =
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: ScoremintABI,
      functionName: "eventCounter",
    });

  return {
    isPaused: !!isPaused,
    oracle: oracle as string | undefined,
    owner: owner as string | undefined,
    eventCounter: eventCounter ? Number(eventCounter) : 0,
    isLoading:
      isPausedLoading ||
      isOracleLoading ||
      isOwnerLoading ||
      isEventCounterLoading,
  };
}
