# User Functions Summary

## Overview

Added comprehensive user management and tracking functionality to the Scoremint contract. Users can now register, track their scores, events participated, events created, events won, and total earnings.

## User Data Structure

The `User` struct in `ScoremintLib.sol` contains:

```solidity
struct User {
    uint256 id;                    // Unique user ID
    string username;                // User's chosen username
    address playerAddress;          // User's wallet address
    uint256 totalPoints;            // Total points accumulated
    uint256 eventsParticipated;     // Number of events participated in
    uint256 eventsCreated;          // Number of events created
    uint256 eventsWon;              // Number of events won
    uint256 totalEarnings;          // Total earnings from prizes
}
```

## Storage Mappings

- `mapping(address => User) public users` - User profiles indexed by address
- `mapping(address => uint256[]) public userParticipatedEvents` - Events a user has participated in
- `mapping(address => bool) public isRegisteredUser` - Track registered users
- `mapping(address => uint256[]) public userEvents` - Events created by a user (already existed)

## Write Functions

### 1. `registerUser(string memory username)`

- Allows users to register with a custom username
- Validates username (non-empty, max 32 characters)
- Initializes user profile with zero stats
- Emits `UserRegistered` event

### 2. `updateUsername(string memory newUsername)`

- Allows registered users to update their username
- Must be called by the user themselves
- Same validation as registration

### Auto-Registration

Users are automatically registered when they:

- Create an event (`createEvent`)
- Submit predictions (`submitPredictions`)

Auto-registered users have empty usernames which they can update later.

## View Functions

### 1. `getUserProfile(address user)`

Returns the complete user profile with all stats.

### 2. `getUserStats(address user)`

Returns user statistics as separate values:

- `eventsParticipated` - Number of events participated
- `eventsCreated` - Number of events created
- `eventsWon` - Number of events won
- `totalPoints` - Total points accumulated
- `totalEarnings` - Total earnings from prizes

### 3. `getUserParticipatedEventIds(address user)`

Returns an array of event IDs the user has participated in.

### 4. `getUserParticipatedEvents(address user)`

Returns full event details for all events the user has participated in.

### 5. `getUserTotalScore(address user)`

Returns the user's total points.

### 6. `isUserRegistered(address user)`

Checks if a user is registered in the system.

### 7. `getUserEventIds(address user)` (already existed)

Returns event IDs created by the user.

### 8. `getUserCreatedEvents(address user)` (already existed)

Returns full event details for events created by the user.

## Automatic Tracking

The contract automatically tracks:

1. **Events Participated**: Incremented when users submit predictions
2. **Events Created**: Incremented when users create prediction events
3. **Events Won**: To be implemented in event finalization logic
4. **Total Points**: To be updated when scoring predictions
5. **Total Earnings**: To be updated when users claim prizes

## Events

- `UserRegistered(address indexed user, uint256 userId, string username)` - Emitted when a user registers

## Usage Examples

### Register a user

```solidity
scoremint.registerUser("Alice");
```

### Get user stats

```solidity
(uint256 participated, uint256 created, uint256 won, uint256 points, uint256 earnings)
    = scoremint.getUserStats(userAddress);
```

### Get user profile

```solidity
ScoremintLib.User memory user = scoremint.getUserProfile(userAddress);
```

### Check if registered

```solidity
bool registered = scoremint.isUserRegistered(userAddress);
```

### Get events participated

```solidity
ScoremintLib.PredictionEvent[] memory events = scoremint.getUserParticipatedEvents(userAddress);
```

## Next Steps

To complete the user functionality, you'll need to:

1. **Implement event finalization** - Update `eventsWon` when determining winners
2. **Implement scoring logic** - Update `totalPoints` based on prediction accuracy
3. **Implement prize claiming** - Update `totalEarnings` when users claim prizes
4. **Add leaderboard functions** - Get top users by points, wins, etc.
