# Leaderboard Functions Summary

## Overview

Added comprehensive leaderboard functionality to track and display participant rankings and scores for each prediction event.

## New Data Structures

### LeaderboardEntry Struct

```solidity
struct LeaderboardEntry {
    address user;        // User's wallet address
    string username;     // User's display name
    uint256 score;       // User's score for the event
    uint256 rank;        // User's rank (1 = first place)
}
```

## Storage Additions

- `mapping(uint256 => address[]) public eventParticipants` - Tracks all participants in each event

## Leaderboard Functions

### 1. `getEventLeaderboard(uint256 eventId)`

**Main leaderboard function** - Returns sorted rankings for an event.

**Returns:**

- Array of `LeaderboardEntry` sorted by score (highest first)
- Automatically assigns ranks (handles ties)
- Includes username if user is registered

**Example:**

```solidity
LeaderboardEntry[] memory leaderboard = scoremint.getEventLeaderboard(eventId);
// leaderboard[0] = 1st place
// leaderboard[1] = 2nd place
// etc.
```

### 2. `getEventParticipantScores(uint256 eventId)`

Returns participants and their scores in parallel arrays.

**Returns:**

- `participants` - Array of participant addresses
- `scores` - Array of corresponding scores

**Example:**

```solidity
(address[] memory participants, uint256[] memory scores) =
    scoremint.getEventParticipantScores(eventId);
```

### 3. `getUserRankInEvent(uint256 eventId, address user)`

Get a specific user's rank and score for an event.

**Returns:**

- `rank` - User's rank (1 = first place)
- `score` - User's score

**Example:**

```solidity
(uint256 rank, uint256 score) = scoremint.getUserRankInEvent(eventId, userAddress);
// rank = 3 means the user is in 3rd place
```

### 4. `getEventParticipantCount(uint256 eventId)`

Returns the total number of participants in an event.

**Example:**

```solidity
uint256 participantCount = scoremint.getEventParticipantCount(eventId);
```

### 5. `getEventParticipants(uint256 eventId)`

Returns array of all participant addresses.

**Example:**

```solidity
address[] memory participants = scoremint.getEventParticipants(eventId);
```

## How Ranking Works

### Scoring

- Users earn points based on correct predictions (see scoring logic in ScoremintLib)
- Points are stored in `UserPrediction.totalScore`

### Ranking Algorithm

1. Collects all participants and their scores
2. Sorts by score (highest to lowest) using bubble sort
3. Assigns ranks starting from 1
4. **Handles ties**: Users with the same score get the same rank

### Example Ranking:

```
Rank 1: Alice - 10 points
Rank 2: Bob - 8 points
Rank 2: Charlie - 8 points  (tied with Bob)
Rank 4: David - 7 points    (rank skips to 4 after tie)
```

## Usage in Frontend

### Display Full Leaderboard

```javascript
const leaderboard = await contract.getEventLeaderboard(eventId);

leaderboard.forEach((entry) => {
  console.log(
    `#${entry.rank} ${entry.username || entry.user} - ${entry.score} points`
  );
});
```

### Display User's Rank

```javascript
const [rank, score] = await contract.getUserRankInEvent(eventId, userAddress);
console.log(
  `You are in ${rank}${getRankSuffix(rank)} place with ${score} points`
);
```

### Display Total Participants

```javascript
const count = await contract.getEventParticipantCount(eventId);
console.log(`${count} participants`);
```

## Key Features

✅ **Sorted Rankings** - Leaderboard automatically sorted by score  
✅ **Tie Handling** - Users with same score get same rank  
✅ **Username Display** - Shows username if registered, otherwise shows address  
✅ **Multiple Views** - Different functions for different use cases  
✅ **Gas Efficient** - Uses simple bubble sort (suitable for limited participants)

## Important Notes

1. **Participant Limit**: Set to 50 users per event (`MAX_USERS_PER_EVENT`)
2. **Sorting**: Uses bubble sort which is O(n²) but simple and gas-efficient for small arrays
3. **Username**: Empty string if user auto-registered without setting username
4. **Scores**: Initially 0 until event is finalized and scores are calculated

## Next Steps

To complete the leaderboard functionality:

1. **Implement score calculation** - After event ends, calculate scores based on actual match results
2. **Finalize event** - Function to close event and calculate all participant scores
3. **Determine winners** - Identify top scorers for prize distribution
4. **Update user stats** - Update `eventsWon`, `totalPoints`, and `totalEarnings` for winners

## Example Integration

```solidity
// After matches are settled
function finalizeEvent(uint256 eventId) external {
    // 1. Get all participants
    address[] memory participants = eventParticipants[eventId];

    // 2. Calculate scores for each participant
    for (uint256 i = 0; i < participants.length; i++) {
        uint256 score = calculateUserScore(eventId, participants[i]);
        userPredictions[eventId][participants[i]].totalScore = score;
        users[participants[i]].totalPoints += score;
    }

    // 3. Get leaderboard to find winners
    LeaderboardEntry[] memory leaderboard = this.getEventLeaderboard(eventId);

    // 4. Distribute prizes to top scorers
    // ... prize distribution logic
}
```
