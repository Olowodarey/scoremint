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

    enum  EventType {
      FREE,
      PAID
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
        uint64 deadline;
        PredictionMode mode;
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
        uint256 eventsWon;
        uint256 totalEarnings;
    }

    // =============================================================
    //                         Constants
    // =============================================================

    uint256 public constant MAX_MATCHES_PER_EVENT = 10;
    uint256 public constant MAX_PREDICTIONS_PER_USER = 10;
    uint256 public constant MAX_PREDICTIONS_PER_EVENT = 10;
    uint256 public constant MAX_USERS_PER_EVENT = 50;
    uint256 public constant POINTS_PER_PREDICTION = 2;

    // =============================================================
    //                         point reward logic helper
    // =============================================================

    /**
     * @dev Calculates the points for a user based on the number of predictions.
     */
    function calculatePoints(uint256 _predictions) public pure returns (uint256) {
        return _predictions * POINTS_PER_PREDICTION;
    }

    function calculateReward(uint256 _totalParticipants, uint256 _prizePool) public pure returns (uint256) {
        return _prizePool / _totalParticipants;
    }
}
