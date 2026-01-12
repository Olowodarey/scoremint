# Oracle Integration - Setup & Usage Guide

## ✅ Files Created

Your backend now has complete oracle functionality:

```
frontend/
├── lib/
│   ├── contract/
│   │   └── oracle.ts              # Contract interaction service
│   └── storage/
│       └── matches.ts              # JSON file storage utilities
├── app/api/oracle/
│   ├── sync-matches/route.ts       # Sync matches from API-Football
│   ├── settle-matches/route.ts     # Settle finished matches
│   └── status/route.ts             # Oracle monitoring
└── data/
    └── match-mappings.json         # Match storage (auto-updated)
```

## 🚀 Quick Setup (5 Steps)

### 1. Install Dependencies

```bash
cd frontend
npm install ethers@6
```

### 2. Configure Environment

Create `.env.local` with your oracle configuration:

```bash
# Copy and fill in your values
cp .env.local.example .env.local
```

**Required values:**

```bash
ORACLE_PRIVATE_KEY=0x...           # Your oracle wallet private key
CONTRACT_ADDRESS=0x...              # Deployed Scoremint address
BASE_RPC_URL=https://mainnet.base.org
```

> ⚠️ **IMPORTANT**: Never commit `.env.local`! It contains your private key.

### 3. Fund Oracle Wallet

Transfer **~0.05 ETH** to your oracle wallet address for gas fees.

```bash
# Check balance
curl http://localhost:3000/api/oracle/status
```

### 4. Deploy Contract & Set Oracle

After deploying your Scoremint contract:

```solidity
// In contract deployment script
await scoremint.setOracle(ORACLE_WALLET_ADDRESS);
```

### 5. Test the Integration

```bash
# Start dev server
npm run dev

# Test sync (creates matches from API-Football)
curl -X POST "http://localhost:3000/api/oracle/sync-matches?date=2026-01-15"

# Test status
curl http://localhost:3000/api/oracle/status
```

## 📖 API Endpoints

### 1. Sync Matches

**Endpoint:** `POST /api/oracle/sync-matches`

Creates matches in the smart contract from API-Football fixtures.

**Query Parameters:**

- `date` (optional): YYYY-MM-DD format (default: today)
- `league` (optional): League ID (default: 39 = Premier League)

**Example:**

```bash
# Sync today's Premier League matches
curl -X POST "http://localhost:3000/api/oracle/sync-matches"

# Sync specific date and league
curl -X POST "http://localhost:3000/api/oracle/sync-matches?date=2026-01-20&league=2"
```

**Response:**

```json
{
  "success": true,
  "total": 10,
  "created": 8,
  "skipped": 2,
  "matches": [
    {
      "fixtureId": 12345,
      "contractMatchId": 0,
      "homeTeam": "Arsenal",
      "awayTeam": "Chelsea"
    }
  ]
}
```

### 2. Settle Matches

**Endpoint:** `POST /api/oracle/settle-matches`

Checks for finished matches and settles them in the contract.

**Example:**

```bash
curl -X POST "http://localhost:3000/api/oracle/settle-matches"
```

**Response:**

```json
{
  "success": true,
  "settled": 3,
  "pending": 5,
  "matches": [
    {
      "fixtureId": 12345,
      "matchId": 0,
      "result": "Arsenal 2-1 Chelsea"
    }
  ]
}
```

### 3. Oracle Status

**Endpoint:** `GET /api/oracle/status`

Get oracle wallet status and statistics.

**Example:**

```bash
curl "http://localhost:3000/api/oracle/status"
```

**Response:**

```json
{
  "oracle": {
    "address": "0x...",
    "balance": "0.045 ETH",
    "isConfiguredOracle": true,
    "lowBalance": false
  },
  "gas": {
    "maxFeePerGas": "0.5 gwei",
    "maxPriorityFeePerGas": "0.1 gwei"
  },
  "stats": {
    "totalMatches": 50,
    "pendingMatches": 8,
    "settledMatches": 42
  },
  "recentMatches": [...]
}
```

## 🤖 Automation Setup

### Option A: Vercel Cron (Recommended)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/oracle/settle-matches",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

This will automatically check for finished matches every 10 minutes.

To sync matches, call the sync endpoint manually when needed or before creating events.

### Option B: External Cron (Self-Hosted)

Add to your crontab:

```bash
# Settle matches every 10 minutes
*/10 * * * * curl -X POST https://yourapp.com/api/oracle/settle-matches

# Sync matches daily at midnight
0 0 * * * curl -X POST https://yourapp.com/api/oracle/sync-matches
```

## 💡 Usage Workflow

### Creating a New Event

```typescript
// 1. First, sync matches for your event dates
const syncResponse = await fetch("/api/oracle/sync-matches?date=2026-01-25", {
  method: "POST",
});
const { matches } = await syncResponse.json();

// 2. Get contract match IDs
const matchIds = matches.map((m) => m.contractMatchId);

// 3. Create event with these match IDs
await scoremint.createEvent(
  "Weekend Predictions",
  deadline,
  OUTCOME,
  matchIds, // ← Use contract match IDs
  PAID,
  USDC_ADDRESS,
  1000e6,
  TOP_10
);
```

### Post-Match Settlement

The cron job automatically handles settlement, but you can also trigger manually:

```bash
# Manually settle finished matches
curl -X POST http://localhost:3000/api/oracle/settle-matches
```

## 📊 Monitoring

### Check Oracle Status

```bash
# View stats
curl http://localhost:3000/api/oracle/status | jq

# Check balance
curl http://localhost:3000/api/oracle/status | jq '.oracle.balance'
```

### View Match Mappings

```bash
# View the JSON file directly
cat frontend/data/match-mappings.json | jq
```

### Low Balance Alert

Set up monitoring to alert when balance drops below 0.01 ETH:

```typescript
const status = await fetch("/api/oracle/status").then((r) => r.json());
if (status.oracle.lowBalance) {
  alert("Oracle wallet balance low! Please fund.");
}
```

## 🔒 Security Best Practices

1. **Never commit private keys**

   ```bash
   # Add to .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Use environment variables**

   - Local: `.env.local`
   - Production: Vercel Environment Variables

3. **Separate oracle wallet**

   - Don't use your main wallet
   - Only fund with necessary amount

4. **Monitor transactions**
   - Check Basescan regularly
   - Set up balance alerts

## 🐛 Troubleshooting

### "Failed to sync matches"

**Check:**

- API_FOOTBALL_KEY is correct
- Date format is YYYY-MM-DD
- League ID exists

### "Only oracle can settle matches"

**Fix:**

```solidity
// In contract, set oracle address
await scoremint.setOracle(process.env.ORACLE_WALLET_ADDRESS);
```

### "Insufficient funds"

**Fund oracle wallet:**

```bash
# Send ETH to oracle address
# Check address: curl http://localhost:3000/api/oracle/status | jq '.oracle.address'
```

### "Match already exists"

**Normal behavior** - the oracle skips matches that are already created.

## 📈 Gas Costs

Estimated gas costs on Base mainnet:

| Operation                 | Gas      | Cost @ 0.1 gwei | Frequency      |
| ------------------------- | -------- | --------------- | -------------- |
| Create Match              | ~80,000  | $0.008          | As needed      |
| Settle Match (single)     | ~60,000  | $0.006          | Per match      |
| Settle Matches (batch 10) | ~400,000 | $0.040          | Per 10 matches |

**Monthly estimate** (100 matches):

- Create: $0.80
- Settle: $0.40 (batch)
- **Total: ~$1.20/month**

## 🎯 Summary

**What you have:**

- ✅ Oracle service to interact with contract
- ✅ API routes to sync and settle matches
- ✅ JSON storage for match tracking
- ✅ Automatic settlement via cron

**Next steps:**

1. Install `ethers@6`: `npm install ethers@6`
2. Configure `.env.local` with oracle key
3. Fund oracle wallet with 0.05 ETH
4. Deploy contract and set oracle
5. Test sync and settle endpoints

**Your backend is now a fully functional oracle!** 🚀
