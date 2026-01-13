import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { base } from "wagmi/chains";
import ScoremintABI from "./ScoremintABI.json";

const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export interface CreateMatchParams {
  fixtureId: bigint;
  homeTeam: string;
  awayTeam: string;
  matchTimestamp: bigint;
}

export function useMatchCreation() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Read match counter to get next match ID
  const { data: matchCounter } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ScoremintABI,
    functionName: "matchCounter",
  });

  const createMatch = async (params: CreateMatchParams) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error("Contract address not configured");
    }

    // Check if we're on the correct network (Base = 8453)
    if (chainId !== base.id) {
      console.log("Switching to Base network...");
      await switchChain({ chainId: base.id });
    }

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: ScoremintABI,
      functionName: "createMatch",
      args: [
        params.fixtureId,
        params.homeTeam,
        params.awayTeam,
        params.matchTimestamp,
      ],
    });
  };

  return {
    createMatch,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    matchCounter: matchCounter as bigint | undefined,
  };
}
