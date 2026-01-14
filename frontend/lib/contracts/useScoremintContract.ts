import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { parseUnits } from "viem";
import { base } from "wagmi/chains";
import ScoremintABI from "./ScoremintABI.json";

export const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export { ScoremintABI };

export interface CreateEventParams {
  name: string;
  deadline: number; // Unix timestamp
  mode: 0 | 1; // 0 = OUTCOME, 1 = EXACT_SCORE
  matchIds: bigint[];
  eventType: 0 | 1; // 0 = FREE, 1 = PAID
  prizeToken: `0x${string}`;
  prizePool: bigint;
  distributionType: 0 | 1 | 2 | 3; // 0 = WINNER_TAKE_ALL, 1 = TOP_3, 2 = TOP_5, 3 = TOP_10
}

export function useScoremintContract() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const createEvent = async (params: CreateEventParams) => {
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
      functionName: "createEvent",
      args: [
        params.name,
        params.deadline,
        params.mode,
        params.matchIds,
        params.eventType,
        params.prizeToken,
        params.prizePool,
        params.distributionType,
      ],
    });
  };

  return {
    createEvent,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    chainId,
  };
}

// Helper function to convert prize amount to wei
export function parsePrizeAmount(amount: string, decimals: number = 6): bigint {
  if (!amount || amount === "0") return BigInt(0);
  return parseUnits(amount, decimals);
}

// USDC address on Base Mainnet
export const USDC_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;
