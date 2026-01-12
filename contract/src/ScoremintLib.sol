// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

library ScoremintLib {
    // =============================================================
    //                           Enums
    // =============================================================

    enum PredictionMode {
        OUTCOME, // Users predict Win/Draw
        EXACT_SCORE // Users predict exact scores
    }

    enum PredictionType {
        HOME_WIN,
        AWAY_WIN,
        DRAW
    }

    enum MatchStatus {
        PENDING,
        SETTLED
    }

    enum EventType {
        FREE,
        PAID
    }

    enum EvetStatus {
        ACTIVE,
        EXPIRED
    }

    enum DistributionType {
        WINNER_TAKE_ALL, // 1st place gets 100%
        TOP_3, // Top 3 share prizes
        TOP_5, // Top 5 share prizes
        TOP_10 // Top 10 share prizes
    }

    // =============================================================
    //                         STRUCTS
    // =============================================================

    struct Match {
        uint256 fixtureId;
        string homeTeam;
        string awayTeam;
        uint64 matchTimestamp;
        uint8 homeScore;
        uint8 awayScore;
        MatchStatus status;
    }

    struct PredictionEvent {
        uint256 eventId;
        address creator;
        string name;
        uint256 prizePool;
        address prizeToken; // ERC20 token for prizes (USDC, WETH, DAI, etc.)
        uint64 deadline;
        PredictionMode mode;
        DistributionType distributionType;
        uint256[] matchIds;
        bool finalized;
        uint256 totalParticipants;
        address[] winners;
    }

    struct Prediction {
        uint256 matchId;
        PredictionType outcome;
        uint8 homeScore;
        uint8 awayScore;
    }

    struct UserPrediction {
        address user;
        uint256 eventId;
        uint64 submittedAt;
        Prediction[] predictions;
        uint256 totalScore;
        bool claimed;
    }

    struct User {
        uint256 id;
        string username;
        address playerAddress;
        uint256 totalPoints;
        uint256 eventsParticipated;
        uint256 eventsCreated;
        uint256 eventsWon;
        uint256 totalEarnings;
    }

    struct LeaderboardEntry {
        address user;
        string username;
        uint256 score;
        uint256 rank;
    }

    // =============================================================
    //                         Constants
    // =============================================================

    uint256 public constant MAX_MATCHES_PER_EVENT = 20;
    uint256 public constant MAX_PREDICTIONS_PER_USER = 20;
    uint256 public constant MAX_PREDICTIONS_PER_EVENT = 20;
    uint256 public constant MAX_USERS_PER_EVENT = 50;

    // Points awarded for correct predictions
    uint256 public constant POINTS_PER_CORRECT_PREDICTION = 2; // Fixed points for any correct prediction

    // =============================================================
    //                         point reward logic helper
    // =============================================================

    /**
     * @dev Calculates the points for a single prediction based on correctness
     * @param prediction The user's prediction
     * @param actualMatch The actual match result
     * @param mode The prediction mode (OUTCOME or EXACT_SCORE)
     * @return points The points earned (1 if correct, 0 if incorrect)
     */
    function calculatePointsForPrediction(
        Prediction memory prediction,
        Match memory actualMatch,
        PredictionMode mode
    ) public pure returns (uint256 points) {
        require(actualMatch.status == MatchStatus.SETTLED, "Match not settled");

        if (mode == PredictionMode.OUTCOME) {
            // In OUTCOME mode, check if the predicted outcome matches actual outcome
            PredictionType actualOutcome = getMatchOutcome(actualMatch);
            if (prediction.outcome == actualOutcome) {
                return POINTS_PER_CORRECT_PREDICTION;
            }
        } else {
            // In EXACT_SCORE mode, only exact score match gets points
            bool exactMatch = (prediction.homeScore == actualMatch.homeScore &&
                prediction.awayScore == actualMatch.awayScore);

            if (exactMatch) {
                return POINTS_PER_CORRECT_PREDICTION;
            }
        }

        return 0; // No points for incorrect prediction
    }

    /**
     * @dev Calculates total points for all predictions
     * @param predictions Array of user predictions
     * @param matches Array of actual match results (indexed by match ID)
     * @param mode The prediction mode
     * @return totalPoints The total points earned (number of correct predictions)
     */
    function calculateTotalPoints(
        Prediction[] memory predictions,
        Match[] memory matches,
        PredictionMode mode
    ) public pure returns (uint256 totalPoints) {
        for (uint256 i = 0; i < predictions.length; i++) {
            // Make sure the match exists and is settled
            if (predictions[i].matchId < matches.length) {
                Match memory actualMatch = matches[predictions[i].matchId];
                if (actualMatch.status == MatchStatus.SETTLED) {
                    totalPoints += calculatePointsForPrediction(
                        predictions[i],
                        actualMatch,
                        mode
                    );
                }
            }
        }
        return totalPoints;
    }

    /**
     * @dev Determines the outcome of a match based on scores
     * @param matchData The match data with scores
     * @return The match outcome (HOME_WIN, AWAY_WIN, or DRAW)
     */
    function getMatchOutcome(
        Match memory matchData
    ) public pure returns (PredictionType) {
        if (matchData.homeScore > matchData.awayScore) {
            return PredictionType.HOME_WIN;
        } else if (matchData.awayScore > matchData.homeScore) {
            return PredictionType.AWAY_WIN;
        } else {
            return PredictionType.DRAW;
        }
    }

    /**
     * @dev Get the number of winners based on distribution type
     * @param distributionType The distribution type
     * @return Number of winners
     */
    function getWinnerCount(
        DistributionType distributionType
    ) public pure returns (uint256) {
        if (distributionType == DistributionType.WINNER_TAKE_ALL) return 1;
        if (distributionType == DistributionType.TOP_3) return 3;
        if (distributionType == DistributionType.TOP_5) return 5;
        if (distributionType == DistributionType.TOP_10) return 10;
        return 1;
    }

    /**
     * @dev Get distribution percentage for a specific rank
     * @param distributionType The distribution type
     * @param rank The rank (1-indexed, 1 = first place)
     * @return Percentage (out of 100) for this rank
     */
    function getDistributionPercentage(
        DistributionType distributionType,
        uint256 rank
    ) public pure returns (uint256) {
        if (distributionType == DistributionType.WINNER_TAKE_ALL) {
            return rank == 1 ? 100 : 0;
        }

        if (distributionType == DistributionType.TOP_3) {
            if (rank == 1) return 50;
            if (rank == 2) return 30;
            if (rank == 3) return 20;
            return 0;
        }

        if (distributionType == DistributionType.TOP_5) {
            if (rank == 1) return 30;
            if (rank == 2) return 25;
            if (rank == 3) return 20;
            if (rank == 4) return 15;
            if (rank == 5) return 10;
            return 0;
        }

        if (distributionType == DistributionType.TOP_10) {
            if (rank == 1) return 19;
            if (rank == 2) return 17;
            if (rank == 3) return 15;
            if (rank == 4) return 13;
            if (rank == 5) return 11;
            if (rank == 6) return 9;
            if (rank == 7) return 7;
            if (rank == 8) return 5;
            if (rank == 9) return 3;
            if (rank == 10) return 1;
            return 0;
        }

        return 0;
    }

    /**
     * @dev Calculate reward amount for a specific rank
     * @param prizePool Total prize pool
     * @param distributionType The distribution type
     * @param rank The rank (1-indexed)
     * @return Reward amount for this rank
     */
    function calculateRewardForRank(
        uint256 prizePool,
        DistributionType distributionType,
        uint256 rank
    ) public pure returns (uint256) {
        uint256 percentage = getDistributionPercentage(distributionType, rank);
        return (prizePool * percentage) / 100;
    }
}
