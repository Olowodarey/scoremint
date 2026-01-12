# Oracle Integration Guide - Backend API to Smart Contract

## Overview

Your backend API will act as the **Oracle** to feed live match data and results into the smart contract. This is a standard, secure approach used by most prediction platforms.

## Architecture

```
Live Sports API (API-Football)
         ↓
  Your Backend Server
         ↓ (Oracle Wallet)
   Smart Contract
```

## Setup Steps

### 1. Deploy Contract & Initialize

```javascript
// After deploying Scoremint contract
const scoremint = await Scoremint.deployed();

// Set your backend wallet as the oracle
await scoremint.setOracle(BACKEND_WALLET_ADDRESS);

// Set prize token (e.g., USDC on Base)
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
await scoremint.setPrizeToken(USDC_ADDRESS);
```

### 2. Backend Environment Setup

```bash
# .env file
ORACLE_PRIVATE_KEY=0x... # Your backend wallet private key
CONTRACT_ADDRESS=0x...    # Deployed Scoremint contract
RPC_URL=https://mainnet.base.org
API_FOOTBALL_KEY=your_api_key
```

### 3. Backend Oracle Service

Create a service that:

1. Fetches live matches from API-Football
2. Creates matches in the contract
3. Monitors for finished matches
4. Submits results to the contract

## Implementation Examples

### Node.js/ethers.js Example

```javascript
const { ethers } = require("ethers");

// Setup
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, provider);
const scoremint = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  SCOREMINT_ABI,
  wallet
);

// === PART 1: CREATE MATCHES ===

async function createMatchFromAPI(apiMatch) {
  try {
    const tx = await scoremint.createMatch(
      apiMatch.fixture.id, // External API fixture ID
      apiMatch.teams.home.name, // Home team name
      apiMatch.teams.away.name, // Away team name
      apiMatch.fixture.timestamp // Match timestamp (unix)
    );

    const receipt = await tx.wait();
    const matchId = receipt.logs[0].args.matchId; // Get matchId from event

    console.log(`Created match ${matchId} for fixture ${apiMatch.fixture.id}`);

    // Store mapping: API fixture ID => Contract match ID
    await db.saveMatchMapping(apiMatch.fixture.id, matchId);

    return matchId;
  } catch (error) {
    console.error("Error creating match:", error);
    throw error;
  }
}

// === PART 2: SETTLE SINGLE MATCH ===

async function settleMatchWhenFinished(apiFixtureId) {
  try {
    // 1. Get match result from API-Football
    const apiResult = await fetchMatchResult(apiFixtureId);

    // 2. Get contract match ID from your database
    const matchId = await db.getMatchId(apiFixtureId);

    // 3. Submit result to contract
    const tx = await scoremint.settleMatch(
      matchId,
      apiResult.goals.home, // Home score
      apiResult.goals.away // Away score
    );

    await tx.wait();
    console.log(
      `Settled match ${matchId}: ${apiResult.goals.home}-${apiResult.goals.away}`
    );

    return true;
  } catch (error) {
    console.error("Error settling match:", error);
    throw error;
  }
}

// === PART 3: BATCH SETTLE (GAS EFFICIENT) ===

async function settleMultipleMatches(finishedMatches) {
  try {
    const matchIds = [];
    const homeScores = [];
    const awayScores = [];

    for (const match of finishedMatches) {
      matchIds.push(await db.getMatchId(match.fixture.id));
      homeScores.push(match.goals.home);
      awayScores.push(match.goals.away);
    }

    // Settle all in one transaction (saves gas!)
    const tx = await scoremint.settleMatches(matchIds, homeScores, awayScores);

    await tx.wait();
    console.log(`Batch settled ${matchIds.length} matches`);

    return true;
  } catch (error) {
    console.error("Error batch settling:", error);
    throw error;
  }
}

// === HELPER: Fetch from API-Football ===

async function fetchMatchResult(fixtureId) {
  const response = await fetch(
    `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
    {
      headers: {
        "x-apisports-key": process.env.API_FOOTBALL_KEY,
      },
    }
  );

  const data = await response.json();
  return data.response[0];
}
```

### Automated Oracle Service (Cron Job)

```javascript
// oracle-service.js

const cron = require("node-cron");

// Check for finished matches every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("Checking for finished matches...");

  // Get all pending matches from your DB
  const pendingMatches = await db.getPendingMatches();

  const finishedMatches = [];

  for (const match of pendingMatches) {
    // Check if match is finished
    const apiMatch = await fetchMatchResult(match.apiFixtureId);

    if (apiMatch.fixture.status.short === "FT") {
      // Match finished!
      finishedMatches.push(apiMatch);
    }
  }

  if (finishedMatches.length > 0) {
    // Batch settle for gas efficiency
    await settleMultipleMatches(finishedMatches);

    // Update database
    for (const match of finishedMatches) {
      await db.markMatchAsSettled(match.fixture.id);
    }
  }
});

// Also create upcoming matches daily
cron.schedule("0 0 * * *", async () => {
  console.log("Fetching upcoming matches...");

  const upcomingMatches = await fetchUpcomingMatches();

  for (const match of upcomingMatches) {
    await createMatchFromAPI(match);
  }
});
```

## Complete Flow Example

### Scenario: Premier League Weekend

```javascript
// === FRIDAY: Create matches for the weekend ===

async function prepareWeekendMatches() {
  // 1. Fetch Saturday & Sunday matches from API-Football
  const response = await fetch(
    "https://v3.football.api-sports.io/fixtures?league=39&date=2026-01-18",
    { headers: { "x-apisports-key": API_KEY } }
  );

  const matches = await response.json();

  // 2. Create each match in the contract
  for (const match of matches.response) {
    await createMatchFromAPI(match);
  }

  console.log(`Created ${matches.response.length} matches`);
}

// === SATURDAY EVENING: Settle finished matches ===

async function settleFinishedMatches() {
  // 1. Get all today's matches
  const todayMatches = await db.getMatchesByDate("2026-01-18");

  // 2. Check which are finished
  const finished = [];

  for (const match of todayMatches) {
    const apiMatch = await fetchMatchResult(match.apiFixtureId);

    if (apiMatch.fixture.status.short === "FT") {
      finished.push(apiMatch);
    }
  }

  // 3. Batch settle all finished matches
  if (finished.length > 0) {
    await settleMultipleMatches(finished);
  }

  console.log(`Settled ${finished.length} matches`);
}
```

## Database Schema (Recommended)

```sql
CREATE TABLE matches (
  contract_match_id INTEGER PRIMARY KEY,
  api_fixture_id INTEGER UNIQUE NOT NULL,
  home_team VARCHAR(100),
  away_team VARCHAR(100),
  match_timestamp BIGINT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'settled'
  home_score INTEGER,
  away_score INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status ON matches(status);
CREATE INDEX idx_api_fixture ON matches(api_fixture_id);
```

## API Endpoints (Your Backend)

### For Frontend to Call

```javascript
// GET /api/matches - Get available matches
app.get("/api/matches", async (req, res) => {
  const matches = await db.getAllMatches();
  res.json(matches);
});

// GET /api/matches/:id - Get match details
app.get("/api/matches/:id", async (req, res) => {
  const match = await db.getMatch(req.params.id);
  res.json(match);
});

// GET /api/matches/:id/result - Get match result (if settled)
app.get("/api/matches/:id/result", async (req, res) => {
  const match = await db.getMatch(req.params.id);

  if (match.status === "settled") {
    res.json({
      homeScore: match.home_score,
      awayScore: match.away_score,
      settled: true,
    });
  } else {
    res.json({ settled: false });
  }
});
```

## Security Best Practices

### 1. Oracle Wallet Security

```javascript
// Use AWS KMS, Google Cloud KMS, or HashiCorp Vault
// Never commit private key to git!

// Example with AWS KMS
const { KMSClient, SignCommand } = require("@aws-sdk/client-kms");

async function signTransaction(tx) {
  const kms = new KMSClient({ region: "us-east-1" });
  // ... sign with KMS
}
```

### 2. Rate Limiting

```javascript
// Prevent spam and save gas
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);
```

### 3. Gas Price Management

```javascript
// Check gas price before transactions
async function settleWithOptimalGas(matchId, homeScore, awayScore) {
  const feeData = await provider.getFeeData();

  // Only settle if gas is reasonable
  if (feeData.maxFeePerGas < ethers.parseUnits("100", "gwei")) {
    return await scoremint.settleMatch(matchId, homeScore, awayScore, {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    });
  } else {
    console.log("Gas too high, waiting...");
    // Queue for later
  }
}
```

### 4. Error Handling & Retry Logic

```javascript
async function settleMatchWithRetry(
  matchId,
  homeScore,
  awayScore,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const tx = await scoremint.settleMatch(matchId, homeScore, awayScore);
      await tx.wait();
      return true;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);

      if (i < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 2 ** i * 1000));
      }
    }
  }

  // Failed after all retries - alert admin
  await sendAlert("Failed to settle match " + matchId);
  return false;
}
```

## Monitoring & Alerts

```javascript
// Set up monitoring
const { Telegram } = require("telegraf");

const bot = new Telegram(process.env.TELEGRAM_BOT_TOKEN);

async function sendAlert(message) {
  await bot.sendMessage(
    process.env.ADMIN_CHAT_ID,
    `🚨 ORACLE ALERT: ${message}`
  );
}

// Monitor oracle wallet balance
async function checkOracleBalance() {
  const balance = await provider.getBalance(wallet.address);
  const ethBalance = ethers.formatEther(balance);

  if (parseFloat(ethBalance) < 0.1) {
    await sendAlert(`Oracle wallet low! Balance: ${ethBalance} ETH`);
  }
}

// Run every hour
setInterval(checkOracleBalance, 60 * 60 * 1000);
```

## Gas Cost Estimates

| Operation                 | Estimated Gas | Cost @ 0.1 gwei |
| ------------------------- | ------------- | --------------- |
| Create Match              | ~80,000       | $0.008          |
| Settle Match (single)     | ~60,000       | $0.006          |
| Settle Matches (batch 10) | ~400,000      | $0.040          |
| Finalize Event            | ~200,000+     | $0.020+         |

**Tip:** Use batch settlement to save gas! Batch of 10 matches:

- Individual: 10 × $0.006 = $0.060
- Batch: 1 × $0.040 = $0.040
- **Savings: 33%**

## Testing Your Oracle

```javascript
// test-oracle.js

async function testOracle() {
  console.log("Testing Oracle Integration...\n");

  // 1. Test connection
  console.log("1. Testing connection...");
  const oracleAddress = await scoremint.oracle();
  console.log(`✅ Oracle address: ${oracleAddress}`);
  console.log(`✅ Wallet address: ${wallet.address}`);
  console.log(`✅ Match: ${oracleAddress === wallet.address}\n`);

  // 2. Test create match
  console.log("2. Testing match creation...");
  const tx1 = await scoremint.createMatch(
    12345,
    "Test Home Team",
    "Test Away Team",
    Math.floor(Date.now() / 1000) + 86400
  );
  await tx1.wait();
  console.log("✅ Match created\n");

  // 3. Test settle match
  console.log("3. Testing match settlement...");
  const matchId = 0; // Assuming first match
  const tx2 = await scoremint.settleMatch(matchId, 2, 1);
  await tx2.wait();
  console.log("✅ Match settled: 2-1\n");

  // 4. Verify
  console.log("4. Verifying...");
  const match = await scoremint.getMatch(matchId);
  console.log(`✅ Home Score: ${match.homeScore}`);
  console.log(`✅ Away Score: ${match.awayScore}`);
  console.log(`✅ Status: ${match.status === 1 ? "SETTLED" : "PENDING"}\n`);

  console.log("🎉 All tests passed!");
}

testOracle();
```

## Deployment Checklist

- [ ] Deploy Scoremint contract
- [ ] Call `setOracle(backendWalletAddress)`
- [ ] Call `setPrizeToken(usdcAddress)`
- [ ] Set up backend service with cron jobs
- [ ] Configure database with match mappings
- [ ] Set up monitoring & alerts
- [ ] Test on testnet first!
- [ ] Fund oracle wallet with ETH for gas
- [ ] Set up automatic balance monitoring

## Summary

**Your Backend = Oracle**

- Fetches data from API-Football
- Creates matches in contract
- Settles matches with results
- Fully controlled by you
- Secure & reliable

**No third-party oracle needed!** Your backend is perfect for this role. 🚀
