# Prize Distribution System Documentation

## Overview

The Scoremint contract now includes a flexible prize distribution system that allows event creators to choose how prizes are distributed among winners based on their leaderboard rankings.

## Distribution Types

Event creators can choose from 4 distribution types:

### 1. WINNER_TAKE_ALL

- **Winners:** Top 1
- **Distribution:** 1st place gets 100%

### 2. TOP_3

- **Winners:** Top 3
- **Distribution:**
  - 🥇 1st: 50%
  - 🥈 2nd: 30%
  - 🥉 3rd: 20%

### 3. TOP_5

- **Winners:** Top 5
- **Distribution:**
  - 🥇 1st: 30%
  - 🥈 2nd: 25%
  - 🥉 3rd: 20%
  - 4th: 15%
  - 5th: 10%

### 4. TOP_10

- **Winners:** Top 10
- **Distribution:**
  - 🥇 1st: 19%
  - 🥈 2nd: 17%
  - 🥉 3rd: 15%
  - 4th: 13%
  - 5th: 11%
  - 6th: 9%
  - 7th: 7%
  - 8th: 5%
  - 9th: 3%
  - 10th: 1%

## How It Works

### 1. Event Creation

When creating an event, the creator specifies the distribution type:

```solidity
scoremint.createEvent(
    "Premier League Predictions",
    deadline,
    PredictionMode.OUTCOME,
    matchIds,
    EventType.PAID,
    1000 * 10**6, // 1000 USDC prize pool
    DistributionType.TOP_5 // Top 5 winners share prizes
);
```

### 2. Users Participate

Users submit their predictions before the deadline.

### 3. Event Finalization

After the event deadline passes, the creator or oracle finalizes the event:

```solidity
scoremint.finalizeEvent(eventId);
```

**What happens:**

- Calculates scores for all participants
- Gets the leaderboard (sorted by score)
- Determines winners based on distribution type
- Calculates rewards for each winner using percentage-based distribution
- Stores reward amounts for each winner
- Updates user statistics (eventsWon)
- Marks event as finalized

### 4. Winners Claim Rewards

Winners can claim their rewards:

```solidity
scoremint.claimReward(eventId);
```

**What happens:**

- Verifies the user is a winner
- Checks reward hasn't been claimed
- Transfers the reward amount to the user
- Updates user's totalEarnings
- Marks reward as claimed

## Key Functions

### For Event Creators

#### `createEvent(..., distributionType)`

Create a new event with prize distribution configuration.

**Parameters:**

- All existing parameters
- `distributionType`: WINNER_TAKE_ALL, TOP_3, TOP_5, or TOP_10

#### `finalizeEvent(eventId)`

Finalize the event and calculate winner rewards.

**Requirements:**

- Event deadline must have passed
- Only creator or oracle can call
- Event not already finalized

**Emits:**

```solidity
event EventFinalized(
    uint256 indexed eventId,
    uint256 winnerCount,
    uint256 totalPrizePool
);
```

### For Winners

#### `claimReward(eventId)`

Claim your reward for a finalized event.

**Requirements:**

- Event must be finalized
- User must be a winner
- Reward not already claimed

**Emits:**

```solidity
event RewardClaimed(
    uint256 indexed eventId,
    address indexed user,
    uint256 amount
);
```

### View Functions

#### `getUserReward(eventId, user)`

Get the reward amount for a user in an event.

**Returns:** Reward amount in prize token

#### `hasUserClaimed(eventId, user)`

Check if a user has claimed their reward.

**Returns:** Boolean

#### `getEventWinners(eventId)`

Get all winners for an event.

**Returns:** Array of winner addresses

## Example Flow

### Creating a TOP_5 Event

```solidity
// 1. Creator creates event with 1000 USDC prize pool
createEvent(
    "Weekend Predictions",
    deadline,
    OUTCOME,
    matchIds,
    PAID,
    1000 * 10**6,
    TOP_5 // Top 5 winners
);
```

### Prize Calculation Example

**Prize Pool:** 1000 USDC  
**Distribution Type:** TOP_5  
**Final Leaderboard:**

1. Alice - 15 points → Rank 1 → 30% = 300 USDC
2. Bob - 12 points → Rank 2 → 25% = 250 USDC
3. Charlie - 12 points → Rank 2 (tied) → 25% = 250 USDC
4. David - 10 points → Rank 4 → 15% = 150 USDC
5. Eve - 8 points → Rank 5 → 10% = 100 USDC

**Total Distributed:** 1050 USDC (105% due to ties)

> **Note:** When there are ties, users with the same score get the same rank and same percentage. This may result in distributing slightly more than 100% of the prize pool.

### Finalization & Claiming

```solidity
// After deadline, creator finalizes
finalizeEvent(eventId);

// Winners check their rewards
uint256 reward = getUserReward(eventId, address(this));
// Alice sees: 300 USDC

// Winners claim their rewards
claimReward(eventId);
// Alice receives 300 USDC
```

## Library Functions

### `getWinnerCount(distributionType)`

Get the number of winners for a distribution type.

**Returns:**

- WINNER_TAKE_ALL → 1
- TOP_3 → 3
- TOP_5 → 5
- TOP_10 → 10

### `getDistributionPercentage(distributionType, rank)`

Get the percentage for a specific rank.

**Parameters:**

- `distributionType`: The distribution type
- `rank`: 1-indexed rank (1 = first place)

**Returns:** Percentage (0-100)

### `calculateRewardForRank(prizePool, distributionType, rank)`

Calculate reward amount for a specific rank.

**Returns:** Reward amount based on percentage

## Important Notes

### Only Winners with Score > 0

- Participants must have a score greater than 0 to be considered winners
- If fewer users have scores > 0 than the distribution type allows, only those users are winners
- Example: TOP_5 event but only 3 users scored > 0 → Only 3 winners

### Tie Handling

- Users with the same score get the same rank
- They receive the same percentage of the prize pool
- This may result in distributing more than 100% of the prize pool
- Event creators should account for this when setting prize pools

### Claiming

- Winners must manually claim their rewards
- Rewards are automatically calculated during finalization
- Once claimed, totalEarnings is updated
- Cannot claim twice

### Security

- Finalization can only be called after deadline
- Only creator or oracle can finalize
- ReentrancyGuard protects all state-changing functions
- SafeERC20 used for token transfers

## Frontend Integration

### Create Event with Distribution

```javascript
const tx = await contract.create Event(
  "My Event",
  deadline,
  0, // OUTCOME mode
  matchIds,
  1, // PAID
  ethers.utils.parseUnits("1000", 6), // 1000 USDC
  2  // TOP_5 distribution
);
```

### Check if User is a Winner

```javascript
const winners = await contract.getEventWinners(eventId);
const isWinner = winners.includes(userAddress);

if (isWinner) {
  const reward = await contract.getUserReward(eventId, userAddress);
  const hasClaimed = await contract.hasUserClaimed(eventId, userAddress);

  console.log(`You won ${ethers.utils.formatUnits(reward, 6)} USDC!`);
  console.log(`Claimed: ${hasClaimed}`);
}
```

### Claim Reward

```javascript
if (isWinner && !hasClaimed) {
  const tx = await contract.claimReward(eventId);
  await tx.wait();
  console.log("Reward claimed!");
}
```

### Listen to Events

```javascript
contract.on("EventFinalized", (eventId, winnerCount, prizePool) => {
  console.log(`Event ${eventId} finalized with ${winnerCount} winners`);
  console.log(
    `Total prize pool: ${ethers.utils.formatUnits(prizePool, 6)} USDC`
  );
});

contract.on("RewardClaimed", (eventId, user, amount) => {
  console.log(`${user} claimed ${ethers.utils.formatUnits(amount, 6)} USDC`);
});
```

## Gas Optimization Tips

1. **Finalization** - More winners = higher gas cost
2. **Claiming** - Simple transfer, relatively cheap
3. **Distribution Type** - Choose based on expected participants:
   - Small events (< 10 participants): WINNER_TAKE_ALL or TOP_3
   - Medium events (10-30 participants): TOP_5
   - Large events (30+ participants): TOP_10

## Summary

The prize distribution system provides:

- ✅ Flexible distribution options for creators
- ✅ Percentage-based rewards with decreasing amounts by rank
- ✅ Automatic calculation and storage of rewards
- ✅ Simple claim process for winners
- ✅ Tie handling
- ✅ Security through access controls and reentrancy protection

This system allows creators to build engaging prediction competitions with fair and transparent prize distribution! 🎉
