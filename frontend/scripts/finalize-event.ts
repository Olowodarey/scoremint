/**
 * Manual Event Finalization Script
 *
 * This script helps you finalize an event when matches have ended
 * but the oracle hasn't automatically processed them yet.
 *
 * Usage:
 * 1. Update the EVENT_ID below
 * 2. Run: npx tsx scripts/finalize-event.ts
 */

import { ethers } from "ethers";

// Configuration
const EVENT_ID = 0; // ← CHANGE THIS to your event ID
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY!;
const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";

// Contract ABI (only the functions we need)
const ABI = [
  "function getEvent(uint256 eventId) view returns (tuple(uint256 eventId, address creator, string name, uint256 prizePool, address prizeToken, uint64 deadline, uint8 mode, uint8 distributionType, bool finalized, uint256 totalParticipants, uint256[] fixtureIds, address[] winners))",
  "function getEventResults(uint256 eventId) view returns (tuple(uint256 fixtureId, uint8 homeScore, uint8 awayScore, uint64 matchTimestamp)[])",
  "function settleEventWithResults(uint256 eventId, tuple(uint256 fixtureId, uint8 homeScore, uint8 awayScore, uint64 matchTimestamp)[] results)",
  "function finalizeEvent(uint256 eventId)",
];

async function main() {
  console.log("🔧 Event Finalization Script");
  console.log("============================\n");

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  console.log(`Oracle Address: ${wallet.address}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Event ID: ${EVENT_ID}\n`);

  // 1. Get event details
  console.log("📋 Fetching event details...");
  const event = await contract.getEvent(EVENT_ID);
  console.log(`Event Name: ${event.name}`);
  console.log(`Finalized: ${event.finalized}`);
  console.log(`Fixture IDs: ${event.fixtureIds.join(", ")}\n`);

  if (event.finalized) {
    console.log("✅ Event is already finalized!");
    return;
  }

  // 2. Check if results exist
  console.log("🔍 Checking for match results...");
  const results = await contract.getEventResults(EVENT_ID);

  if (results.length === 0) {
    console.log("❌ No match results found!");
    console.log("\n⚠️  You need to settle matches first:");
    console.log("   Option 1: Call the settle-matches API endpoint");
    console.log("   Option 2: Manually call settleEventWithResults()");
    console.log("\nExample match results needed:");
    for (const fixtureId of event.fixtureIds) {
      console.log(`   - Fixture ${fixtureId}: homeScore, awayScore`);
    }
    return;
  }

  console.log(`✅ Found ${results.length} match results`);
  for (const result of results) {
    console.log(
      `   Fixture ${result.fixtureId}: ${result.homeScore}-${result.awayScore}`,
    );
  }

  // 3. Finalize the event
  console.log("\n🚀 Finalizing event...");
  const tx = await contract.finalizeEvent(EVENT_ID);
  console.log(`Transaction sent: ${tx.hash}`);

  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log(`✅ Event finalized! Block: ${receipt.blockNumber}`);

  console.log("\n🎉 Success! Users can now see their results.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
