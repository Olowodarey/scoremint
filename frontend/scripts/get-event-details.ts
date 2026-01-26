/**
 * Get Event Details
 * Fetches event information to see fixture IDs
 */

import { ethers } from "ethers";

const EVENT_ID = 0;
const CONTRACT_ADDRESS = "0x70dB6488fA0a6869a8b599bD2be044A0BA1f5d50"; // From your .env
const RPC_URL = "https://mainnet.base.org";

const ABI = [
  "function getEvent(uint256 eventId) view returns (tuple(uint256 eventId, address creator, string name, uint256 prizePool, address prizeToken, uint64 deadline, uint8 mode, uint8 distributionType, bool finalized, uint256 totalParticipants, uint256[] fixtureIds, address[] winners))",
];

async function main() {
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`RPC: ${RPC_URL}\n`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  console.log("Fetching event details...\n");
  const event = await contract.getEvent(EVENT_ID);

  console.log("Event Details:");
  console.log("=============");
  console.log(`ID: ${event.eventId}`);
  console.log(`Name: ${event.name}`);
  console.log(`Finalized: ${event.finalized}`);
  console.log(`Participants: ${event.totalParticipants}`);
  console.log(`Fixture IDs: ${event.fixtureIds.join(", ")}`);
  console.log(`\nFixture IDs for script:`);
  console.log(`const FIXTURE_IDS = [${event.fixtureIds.join(", ")}];`);
}

main().catch(console.error);
