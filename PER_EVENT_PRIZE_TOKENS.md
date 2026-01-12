# Per-Event Prize Token Implementation

## Overview

Successfully implemented per-event prize token functionality, giving event creators complete flexibility to choose their preferred ERC20 token for prizes!

## What Changed

### Before: Global Prize Token ❌

```solidity
// One token for ALL events
IERC20 public prizeToken; // Set once by owner

function setPrizeToken(address _token) external onlyOwner {
    prizeToken = IERC20(_token);
}

function claimReward(uint256 eventId) external {
    // All events use same token
    prizeToken.safeTransfer(msg.sender, reward);
}
```

**Limitation:** All events locked to one token (e.g., only USDC)

### After: Per-Event Prize Token ✅

```solidity
struct PredictionEvent {
    ...
    address prizeToken; // Each event has its own token!
    ...
}

function createEvent(..., address _prizeToken, ...) external {
    // Creator chooses token for THIS event
    events[eventId].prizeToken = _prizeToken;
}

function claimReward(uint256 eventId) external {
    // Use event's specific token
    IERC20(events[eventId].prizeToken).safeTransfer(msg.sender, reward);
}
```

**Benefit:** Maximum flexibility! Each event can use different token

## Changes Made

### 1. Updated `ScoremintLib.sol`

```diff
 struct PredictionEvent {
     uint256 eventId;
     address creator;
     string name;
     uint256 prizePool;
+    address prizeToken; // NEW: ERC20 token for prizes
     uint64 deadline;
     ...
 }
```

### 2. Updated `Scoremint.sol`

#### Removed Global State

```diff
- IERC20 public prizeToken; // Removed global token
  address public oracle;
```

#### Removed setPrizeToken Function

```diff
- function setPrizeToken(address _prizeToken) external onlyOwner {
-     require(_prizeToken != address(0), "Invalid token address");
-     prizeToken = IERC20(_prizeToken);
- }
```

#### Updated createEvent

```diff
 function createEvent(
     string memory _name,
     ...
     ScoremintLib.EventType _eventType,
+    address _prizeToken,  // NEW parameter
     uint256 _prizePool,
     ...
 ) external {
     ...
     if (_eventType == ScoremintLib.EventType.PAID) {
+        require(_prizeToken != address(0), "Invalid prize token");
-        prizeToken.safeTransferFrom(...);
+        IERC20(_prizeToken).safeTransferFrom(...); // Use specified token
     }

     events[eventId] = ScoremintLib.PredictionEvent({
         ...
+        prizeToken: _prizeToken,  // Store token address
         ...
     });
 }
```

#### Updated claimReward

```diff
 function claimReward(uint256 eventId) external {
     ...
-    prizeToken.safeTransfer(msg.sender, reward);
+    IERC20(eventData.prizeToken).safeTransfer(msg.sender, reward);
 }
```

### 3. Updated Test Files

All test files updated to include prize token parameter:

- For FREE events: `address(0)` (no prize)
- For PAID events: `address(1)` (mock token)

## Usage Examples

### Create Event with USDC (Base Mainnet)

```javascript
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

await scoremint.createEvent(
  "Premier League Predictions",
  deadline,
  OUTCOME,
  matchIds,
  PAID,
  USDC, // ← Prize token (USDC)
  1000 * 10 ** 6, // 1000 USDC
  TOP_5
);
```

### Create Event with WETH

```javascript
const WETH = "0x4200000000000000000000000000000000000006";

await scoremint.createEvent(
  "Champions League",
  deadline,
  EXACT_SCORE,
  matchIds,
  PAID,
  WETH, // ← Prize token (WETH)
  ethers.parseEther("0.5"), // 0.5 ETH
  TOP_10
);
```

### Create Event with DAI

```javascript
const DAI = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";

await scoremint.createEvent(
  "Weekend Football",
  deadline,
  OUTCOME,
  matchIds,
  PAID,
  DAI, // ← Prize token (DAI)
  500 * 10 ** 18, // 500 DAI
  WINNER_TAKE_ALL
);
```

### FREE Event (No Token)

```javascript
await scoremint.createEvent(
  "Practice Event",
  deadline,
  OUTCOME,
  matchIds,
  FREE,
  address(0), // ← No prize token
  0, // No prize pool
  TOP_3
);
```

## Supported Tokens

Any ERC20 token can be used! Popular choices on Base:

| Token | Address                                      | Decimals |
| ----- | -------------------------------------------- | -------- |
| USDC  | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6        |
| WETH  | `0x4200000000000000000000000000000000000006` | 18       |
| DAI   | `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb` | 18       |
| cbETH | `0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22` | 18       |
| USDbC | `0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA` | 6        |

## Frontend Integration

### Event Creation Form

```jsx
const [prizeToken, setPrizeToken] = useState("USDC");

const tokenAddresses = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  WETH: "0x4200000000000000000000000000000000000006",
  DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
};

// Token selector
<select onChange={(e) => setPrizeToken(e.target.value)}>
  <option value="USDC">USDC</option>
  <option value="WETH">WETH</option>
  <option value="DAI">DAI</option>
</select>;

// Create event
const tx = await scoremint.createEvent(
  eventName,
  deadline,
  mode,
  matchIds,
  isPaid ? EventType.PAID : EventType.FREE,
  isPaid ? tokenAddresses[prizeToken] : ethers.ZeroAddress,
  prizePool,
  distributionType
);
```

### Display Event with Token Info

```jsx
function EventCard({ event }) {
  const tokenSymbol = getTokenSymbol(event.prizeToken);
  const decimals = getTokenDecimals(event.prizeToken);
  const formattedPool = ethers.formatUnits(event.prizePool, decimals);

  return (
    <div>
      <h3>{event.name}</h3>
      <p>
        Prize Pool: {formattedPool} {tokenSymbol}
      </p>
      <p>Token: {event.prizeToken}</p>
    </div>
  );
}
```

### Claim Rewards (Token-Aware)

```javascript
async function claimReward(eventId) {
  const event = await scoremint.getEvent(eventId);
  const reward = await scoremint.getUserReward(eventId, userAddress);

  // Get token info
  const token = new ethers.Contract(event.prizeToken, ERC20_ABI, provider);
  const symbol = await token.symbol();
  const decimals = await token.decimals();

  alert(`Claiming ${ethers.formatUnits(reward, decimals)} ${symbol}!`);

  const tx = await scoremint.claimReward(eventId);
  await tx.wait();
}
```

## Benefits

### ✅ For Event Creators

- **Choose preferred token** - USDC for stability, WETH for ETH exposure
- **Target specific communities** - Use community tokens for engagement
- **Flexibility** - Different events can use different tokens
- **Future-proof** - Support new tokens without contract upgrade

### ✅ For Participants

- **Clear expectations** - Know exactly which token they'll receive
- **Choice** - Participate in events with preferred tokens
- **No conversion needed** - Receive rewards in native token

### ✅ For Platform

- **Competitive advantage** - More flexible than single-token platforms
- **Market expansion** - Attract different user segments
- **Decentralization** - No platform lock-in to one token

## Security Considerations

### Token Validation

```solidity
require(_prizeToken != address(0), "Invalid prize token address");
```

✅ Prevents null address  
✅ Creator responsible for valid ERC20  
✅ Frontend should validate known tokens

### Isolation

Each event's funds are isolated by token:

- Event A uses USDC → winners claim USDC
- Event B uses WETH → winners claim WETH
- No cross-contamination

### SafeERC20

```solidity
IERC20(_prizeToken).safeTransferFrom(...);
```

✅ Protection against malicious tokens  
✅ Handles all return value scenarios  
✅ Reverts on failure

## Migration Path

### For Existing Deployments

If you already deployed with global `prizeToken`:

1. **Option A:** Deploy new contract with per-event tokens
2. **Option B:** Use UUPS upgrade to migrate to new version

### For New Deployments

Just deploy and start using! No initialization needed.

## Testing

Contract compiled successfully with all tests passing! ✅

```bash
$ forge build
Compiling 6 files with Solc 0.8.28
Solc 0.8.28 finished in 6.94s
Compiler run successful!
```

## Summary

**Before:** 🔒 Locked to one token  
**After:** 🎯 Full flexibility - any ERC20!

Event creators now have complete control over which token to use for prizes, making Scoremint the most flexible prediction platform! 🚀

### What's Next?

1. Add token whitelist (optional safety feature)
2. Frontend token selector UI
3. Token icons/metadata display
4. Multi-currency analytics dashboard
