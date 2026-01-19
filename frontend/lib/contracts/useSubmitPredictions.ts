import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { base } from "wagmi/chains";
import { CONTRACT_ADDRESS, ScoremintABI } from "./useScoremintContract";

interface Prediction {
  fixtureId: bigint;
  outcome: number;
  homeScore: number;
  awayScore: number;
}

export function useSubmitPredictions() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const submitPredictions = async (
    eventId: bigint,
    predictions: Prediction[],
  ) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error("Contract address not configured");
    }

    // Check if we're on the correct network (Base = 8453)
    if (chainId !== base.id) {
      console.log("Switching to Base network...");
      await switchChain({ chainId: base.id });
    }

    console.log("=== Submitting Predictions ===");
    console.log("Event ID:", eventId.toString());
    console.log("Predictions:", predictions);

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: ScoremintABI,
      functionName: "submitPredictions",
      args: [eventId, predictions],
    });
  };

  return {
    submitPredictions,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}
