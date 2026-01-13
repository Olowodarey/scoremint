// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ScoremintLib} from "../ScoremintLib.sol";

/**
 * @title IScoremintEvents
 * @notice Interface containing all events emitted by the Scoremint contract
 */
interface IScoremintEvents {
    /**
     * @notice Emitted when a new prediction event is created
     * @param eventId Unique identifier for the event
     * @param creator Address of the event creator
     * @param name Name of the event
     * @param prizePool Total prize pool amount
     * @param deadline Deadline for predictions (unix timestamp)
     * @param mode Prediction mode (OUTCOME or EXACT_SCORE)
     * @param eventType Event type (FREE or PAID)
     */
    event EventCreated(
        uint256 indexed eventId,
        address indexed creator,
        string name,
        uint256 prizePool,
        uint64 deadline,
        ScoremintLib.PredictionMode mode,
        ScoremintLib.EventType eventType
    );

    /**
     * @notice Emitted when a user submits predictions for an event
     * @param eventId The event ID
     * @param user Address of the user
     * @param timestamp When the prediction was submitted
     */
    event PredictionSubmitted(
        uint256 indexed eventId,
        address indexed user,
        uint64 timestamp
    );

    /**
     * @notice Emitted when a new user registers
     * @param user Address of the registered user
     * @param userId Unique user ID
     * @param username Chosen username
     */
    event UserRegistered(address indexed user, uint256 userId, string username);

    /**
     * @notice Emitted when the oracle address is updated
     * @param newOracle Address of the new oracle
     */
    event OracleUpdated(address indexed newOracle);

    /**
     * @notice Emitted when the prize token is set
     * @param tokenAddress Address of the ERC20 prize token
     */
    event PrizeTokenSet(address indexed tokenAddress);

    /**
     * @notice Emitted when a new match is created
     * @param matchId Unique match identifier
     * @param fixtureId External API fixture ID
     * @param homeTeam Name of the home team
     * @param awayTeam Name of the away team
     * @param matchTimestamp When the match will be played
     */
    event MatchCreated(
        uint256 indexed matchId,
        uint256 fixtureId,
        string homeTeam,
        string awayTeam,
        uint64 matchTimestamp
    );

    /**
     * @notice Emitted when a match is settled with final scores
     * @param matchId The match identifier
     * @param homeScore Final home team score
     * @param awayScore Final away team score
     */
    event MatchSettled(
        uint256 indexed matchId,
        uint8 homeScore,
        uint8 awayScore
    );

    /**
     * @notice Emitted when an event is finalized and winners are determined
     * @param eventId The event identifier
     * @param winnerCount Number of winners
     * @param totalPrizePool Total prize pool distributed
     */
    event EventFinalized(
        uint256 indexed eventId,
        uint256 winnerCount,
        uint256 totalPrizePool
    );

    /**
     * @notice Emitted when a user claims their reward
     * @param eventId The event identifier
     * @param user Address of the user claiming
     * @param amount Amount of reward claimed
     */
    event RewardClaimed(
        uint256 indexed eventId,
        address indexed user,
        uint256 amount
    );
}
