import { NextResponse } from "next/server";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x70dB6488fA0a6869a8b599bD2be044A0BA1f5d50";
const ORACLE_PRIVATE_KEY =
  process.env.ORACLE_PRIVATE_KEY ||
  "9238a857a5b64b9b2b95e8c3cdd70dd242c8bab59666552389b888ef5034e57d";
const RPC_URL = "https://mainnet.base.org";
const API_KEY =
  process.env.API_FOOTBALL_KEY || "e25ccd2f8868107af61fb020bfb98e43";
const API_BASE = "https://v3.football.api-sports.io";

const ABI = [
  "function getAllEvents() view returns (tuple(uint256 eventId, address creator, string name, uint256 prizePool, address prizeToken, uint64 deadline, uint8 mode, uint8 distributionType, bool finalized, uint256 totalParticipants, uint256[] fixtureIds, address[] winners)[])",
  "function getEventResults(uint256 eventId) view returns (tuple(uint256 fixtureId, uint64 matchTimestamp, uint8 homeScore, uint8 awayScore)[])",
  "function settleEventWithResults(uint256 eventId, tuple(uint256 fixtureId, uint64 matchTimestamp, uint8 homeScore, uint8 awayScore)[] results)",
  "function finalizeEvent(uint256 eventId)",
];

async function fetchFixtureResult(fixtureId: number) {
  const response = await fetch(`${API_BASE}/fixtures?id=${fixtureId}`, {
    headers: { "x-apisports-key": API_KEY },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch fixture ${fixtureId}`);
  }

  const data = await response.json();
  if (!data.response || data.response.length === 0) {
    return null;
  }

  const fixture = data.response[0];
  return {
    fixtureId,
    homeScore: fixture.goals.home ?? 0,
    awayScore: fixture.goals.away ?? 0,
    status: fixture.fixture.status.short,
    timestamp: fixture.fixture.timestamp,
  };
}

/**
 * Auto-settle and finalize events
 * This endpoint should be called by a cron job every 10 minutes
 */
export async function POST() {
  try {
    console.log("🤖 Auto-finalization started...");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    // Get all events
    const allEvents = await contract.getAllEvents();
    const now = Math.floor(Date.now() / 1000);

    const settled: string[] = [];
    const finalized: string[] = [];
    const errors: string[] = [];

    for (const event of allEvents) {
      try {
        const eventId = event.eventId.toString();
        const deadline = Number(event.deadline);
        const isExpired = deadline <= now;
        const isFinalized = event.finalized;

        // Skip if not expired or already finalized
        if (!isExpired || isFinalized) {
          continue;
        }

        console.log(`Processing event ${eventId}: ${event.name}`);

        // Check if results already exist
        const existingResults = await contract.getEventResults(event.eventId);

        if (existingResults.length === 0) {
          // Fetch and settle results
          console.log(
            `  Fetching results for ${event.fixtureIds.length} fixtures...`,
          );

          const results = [];
          for (const fixtureId of event.fixtureIds) {
            const result = await fetchFixtureResult(Number(fixtureId));
            if (result && result.status === "FT") {
              results.push({
                fixtureId: result.fixtureId,
                matchTimestamp: result.timestamp,
                homeScore: result.homeScore,
                awayScore: result.awayScore,
              });
            }
          }

          if (results.length === event.fixtureIds.length) {
            // All matches finished, settle them
            console.log(`  Settling ${results.length} matches...`);
            const settleTx = await contract.settleEventWithResults(
              event.eventId,
              results,
            );
            await settleTx.wait();
            settled.push(eventId);
            console.log(`  ✅ Settled event ${eventId}`);
          } else {
            console.log(
              `  ⏳ Waiting for all matches to finish (${results.length}/${event.fixtureIds.length})`,
            );
            continue;
          }
        }

        // Finalize the event
        console.log(`  Finalizing event ${eventId}...`);
        const finalizeTx = await contract.finalizeEvent(event.eventId);
        await finalizeTx.wait();
        finalized.push(eventId);
        console.log(`  ✅ Finalized event ${eventId}`);
      } catch (error) {
        const errorMsg = `Event ${event.eventId}: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(`  ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      settled: settled.length,
      finalized: finalized.length,
      errors: errors.length,
      details: {
        settledEvents: settled,
        finalizedEvents: finalized,
        errors,
      },
    });
  } catch (error) {
    console.error("Auto-finalization error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
