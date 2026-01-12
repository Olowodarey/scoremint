# Oracle Integration - Quick Reference

## 🔑 Environment Setup

```bash
# .env.local
ORACLE_PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...
BASE_RPC_URL=https://mainnet.base.org
API_FOOTBALL_KEY=your_api_key
```

## 📡 API Endpoints

### Sync Matches

```bash
POST /api/oracle/sync-matches?date=2026-01-15&league=39
```

### Settle Matches

```bash
POST /api/oracle/settle-matches
```

### Oracle Status

```bash
GET /api/oracle/status
```

## 🔄 Workflow

### 1. Create Event

```typescript
// Step 1: Sync matches
const { matches } = await fetch("/api/oracle/sync-matches?date=2026-01-25", {
  method: "POST",
}).then((r) => r.json());

// Step 2: Get match IDs
const matchIds = matches.map((m) => m.contractMatchId);

// Step 3: Create event
await scoremint.createEvent(
  name,
  deadline,
  mode,
  matchIds,
  PAID,
  USDC,
  1000e6,
  TOP_10
);
```

### 2. Settlement (Automated)

Cron job runs every 10 minutes → settles finished matches automatically

## ⚙️ Vercel Cron

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

## 🔍 Monitoring

```bash
# Check status
curl http://localhost:3000/api/oracle/status | jq

# View mappings
cat data/match-mappings.json | jq
```

## 💰 Gas Costs

- Create match: ~$0.008
- Settle batch (10): ~$0.040
- Monthly (100 matches): ~$1.20

## ✅ Checklist

- [ ] Install ethers: `npm install ethers@6`
- [ ] Configure `.env.local`
- [ ] Fund oracle wallet (0.05 ETH)
- [ ] Deploy contract
- [ ] Set oracle: `scoremint.setOracle(address)`
- [ ] Test sync endpoint
- [ ] Setup Vercel cron

## 🆘 Troubleshooting

| Issue                    | Fix                                  |
| ------------------------ | ------------------------------------ |
| "Only oracle can settle" | Run `setOracle(address)` on contract |
| "Insufficient funds"     | Fund oracle wallet with ETH          |
| "Match already exists"   | Normal - oracle skips duplicates     |
| Low balance warning      | Refill oracle wallet                 |

---

**Your backend = Oracle! 🚀**
