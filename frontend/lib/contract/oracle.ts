import { ethers } from "ethers";

// Contract ABI - only the functions we need
const SCOREMINT_ABI = [
  "function createMatch(uint256 _fixtureId, string memory _homeTeam, string memory _awayTeam, uint64 _matchTimestamp) external returns (uint256)",
  "function settleMatch(uint256 matchId, uint8 homeScore, uint8 awayScore) external",
  "function settleMatches(uint256[] calldata matchIds, uint8[] calldata homeScores, uint8[] calldata awayScores) external",
  "function getMatch(uint256 matchId) external view returns (tuple(uint256 fixtureId, string homeTeam, string awayTeam, uint64 matchTimestamp, uint8 homeScore, uint8 awayScore, uint8 status))",
  "function oracle() external view returns (address)",
  "event MatchCreated(uint256 indexed matchId, uint256 fixtureId, string homeTeam, string awayTeam, uint64 matchTimestamp)",
  "event MatchSettled(uint256 indexed matchId, uint8 homeScore, uint8 awayScore)",
];

export interface MatchData {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  timestamp: number;
}

export interface SettleData {
  matchId: number;
  homeScore: number;
  awayScore: number;
}

export class OracleService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.BASE_RPC_URL;
    const privateKey = process.env.ORACLE_PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error(
        "Missing required environment variables for Oracle service"
      );
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(
      contractAddress,
      SCOREMINT_ABI,
      this.wallet
    );
  }

  /**
   * Get oracle wallet address
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get oracle wallet balance
   */
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Verify this wallet is the contract's oracle
   */
  async verifyOracle(): Promise<boolean> {
    const contractOracle = await this.contract.oracle();
    return contractOracle.toLowerCase() === this.wallet.address.toLowerCase();
  }

  /**
   * Create a match in the contract
   */
  async createMatch(data: MatchData): Promise<number> {
    try {
      console.log("Creating match:", data);

      const tx = await this.contract.createMatch(
        data.fixtureId,
        data.homeTeam,
        data.awayTeam,
        data.timestamp
      );

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);

      // Parse MatchCreated event
      const event = receipt.logs
        .map((log: any) => {
          try {
            return this.contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e?.name === "MatchCreated");

      if (!event) {
        throw new Error("MatchCreated event not found in transaction");
      }

      const matchId = Number(event.args.matchId);
      console.log("Match created with ID:", matchId);

      return matchId;
    } catch (error) {
      console.error("Error creating match:", error);
      throw error;
    }
  }

  /**
   * Settle a single match
   */
  async settleMatch(data: SettleData): Promise<void> {
    try {
      console.log("Settling match:", data);

      const tx = await this.contract.settleMatch(
        data.matchId,
        data.homeScore,
        data.awayScore
      );

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.hash);
    } catch (error) {
      console.error("Error settling match:", error);
      throw error;
    }
  }

  /**
   * Batch settle multiple matches (gas optimized)
   */
  async settleMatches(matches: SettleData[]): Promise<void> {
    try {
      console.log(`Batch settling ${matches.length} matches`);

      const matchIds = matches.map((m) => m.matchId);
      const homeScores = matches.map((m) => m.homeScore);
      const awayScores = matches.map((m) => m.awayScore);

      const tx = await this.contract.settleMatches(
        matchIds,
        homeScores,
        awayScores
      );

      console.log("Batch transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Batch transaction confirmed:", receipt.hash);
    } catch (error) {
      console.error("Error batch settling matches:", error);
      throw error;
    }
  }

  /**
   * Get match from contract
   */
  async getMatch(matchId: number) {
    return await this.contract.getMatch(matchId);
  }

  /**
   * Estimate gas for operations
   */
  async estimateGas() {
    const feeData = await this.provider.getFeeData();
    return {
      maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas || 0, "gwei"),
      maxPriorityFeePerGas: ethers.formatUnits(
        feeData.maxPriorityFeePerGas || 0,
        "gwei"
      ),
    };
  }
}
