/**
 * Fetch Match Results and Settle Event
 *
 * This script fetches match results from API-Football and settles them in the contract
 *
 * Usage:
 * 1. Update EVENT_ID and FIXTURE_IDS below
 * 2. Run: npx tsx scripts/settle-and-finalize.ts
 */

import { ethers } from "ethers";

// Configuration - UPDATE THESE
const EVENT_ID = 0; // ← Your event ID
const FIXTURE_IDS = [1370269, 1370270]; // ← Your fixture IDs from API-Football

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY!;
const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const API_KEY = process.env.API_FOOTBALL_KEY!;
const API_BASE = "https://v3.football.api-sports.io";

const ABI = [
  "function settleEventWithResults(uint256 eventId, tuple(uint256 fixtureId, uint8 homeScore, uint8 awayScore, uint64 matchTimestamp)[] results)",
  "function finalizeEvent(uint256 eventId)",
  "function getEvent(uint256 eventId) view returns (tuple(uint256 eventId, address creator, string name, uint256 prizePool, address prizeToken, uint64 deadline, uint8 mode, uint8 distributionType, bool finalized, uint256 totalParticipants, uint256[] fixtureIds, address[] winners))",
];

async function fetchFixtureResult(fixtureId: number) {
  console.log(`  Fetching fixture ${fixtureId}...`);
  const response = await fetch(`${API_BASE}/fixtures?id=${fixtureId}`, {
    headers: { "x-apisports-key": API_KEY },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data.response || data.response.length === 0) {
    throw new Error(`Fixture ${fixtureId} not found`);
  }

  const fixture = data.response[0];
  return {
    fixtureId,
    homeTeam: fixture.teams.home.name,
    awayTeam: fixture.teams.away.name,
    homeScore: fixture.goals.home ?? 0,
    awayScore: fixture.goals.away ?? 0,
    status: fixture.fixture.status.short,
    timestamp: fixture.fixture.timestamp,
  };
}

async function main() {
  console.log("🏆 Settle and Finalize Event");
  console.log("============================\n");

  // Setup
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  console.log(`Oracle: ${wallet.address}`);
  console.log(`Event ID: ${EVENT_ID}\n`);

  // Get event details
  const event = await contract.getEvent(EVENT_ID);
  console.log(`Event: ${event.name}`);
  console.log(`Finalized: ${event.finalized}\n`);

  if (event.finalized) {
    console.log("✅ Event already finalized!");
    return;
  }

  // Fetch match results from API-Football
  console.log("📡 Fetching match results from API-Football...");
  const matchResults = [];

  for (const fixtureId of FIXTURE_IDS) {
    try {
      const result = await fetchFixtureResult(fixtureId);
      console.log(
        `  ✓ ${result.homeTeam} ${result.homeScore}-${result.awayScore} ${result.awayTeam} [${result.status}]`,
      );

      if (result.status !== "FT") {
        console.log(
          `    ⚠️  Warning: Match not finished (status: ${result.status})`,
        );
      }

      matchResults.push({
        fixtureId: result.fixtureId,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        matchTimestamp: result.timestamp,
      });
    } catch (error) {
      console.error(`  ✗ Error fetching fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  // Settle matches in contract
  console.log("\n🔧 Settling matches in contract...");
  const settleTx = await contract.settleEventWithResults(
    EVENT_ID,
    matchResults,
  );
  console.log(`  Transaction: ${settleTx.hash}`);
  await settleTx.wait();
  console.log("  ✅ Matches settled!");

  // Finalize event
  console.log("\n🎯 Finalizing event...");
  const finalizeTx = await contract.finalizeEvent(EVENT_ID);
  console.log(`  Transaction: ${finalizeTx.hash}`);
  await finalizeTx.wait();
  console.log("  ✅ Event finalized!");

  console.log("\n🎉 Done! Users can now see their results.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
