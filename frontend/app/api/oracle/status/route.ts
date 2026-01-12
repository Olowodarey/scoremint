import { NextResponse } from "next/server";
import { OracleService } from "@/lib/contract/oracle";
import { getStats, getAllMatches } from "@/lib/storage/matches";

/**
 * Get oracle status and statistics
 * Use this for monitoring dashboard
 */
export async function GET() {
  try {
    const oracle = new OracleService();

    // Get oracle wallet info
    const [address, balance, isOracle, gasEstimate] = await Promise.all([
      oracle.getAddress(),
      oracle.getBalance(),
      oracle.verifyOracle(),
      oracle.estimateGas(),
    ]);

    // Get match stats
    const stats = getStats();

    // Get recent matches
    const allMatches = getAllMatches();
    const recentMatches = allMatches
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    return NextResponse.json({
      oracle: {
        address,
        balance: `${balance} ETH`,
        isConfiguredOracle: isOracle,
        lowBalance: parseFloat(balance) < 0.01,
      },
      gas: {
        maxFeePerGas: `${gasEstimate.maxFeePerGas} gwei`,
        maxPriorityFeePerGas: `${gasEstimate.maxPriorityFeePerGas} gwei`,
      },
      stats,
      recentMatches: recentMatches.map((m) => ({
        fixtureId: m.apiFixtureId,
        contractMatchId: m.contractMatchId,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        status: m.status,
        score:
          m.homeScore !== undefined ? `${m.homeScore}-${m.awayScore}` : "-",
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error getting oracle status:", error);
    return NextResponse.json(
      {
        error: "Failed to get oracle status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
