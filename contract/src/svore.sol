// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Scoremint
 * @notice A prediction platform for football matches with automatic scoring and reward distribution
 * @dev Supports both outcome-based and exact score predictions
 */
contract Scoremint is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // =============================================================
    //                           TYPES
    // =============================================================

    enum PredictionMode {
        OUTCOME,      // Users predict Win/Draw
        EXACT_SCORE   // Users predict exact scores
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
    //                         STRUCTURES
    // =============================================================

    struct Match {
        uint256 fixtureId;        // API-Football fixture ID
        string homeTeam;
        string awayTeam;
        uint64 matchTimestamp;    // Actual match time
        uint8 homeScore;          // Final home score (set by oracle)
        uint8 awayScore;          // Final away score (set by oracle)
        MatchStatus status;
    }

    struct PredictionEvent {
        uint256 eventId;
        address creator;
        string name;
        uint256 prizePool;        // In prize token (e.g., USDC)
        uint64 deadline;          // Predictions close timestamp
        PredictionMode mode;
        uint256[] matchIds;
        bool finalized;
        uint256 totalParticipants;
        address[] winners;
    }

    struct Prediction {
        uint256 matchId;
        PredictionType outcome;   // For outcome mode
        uint8 homeScore;          // For exact score mode
        uint8 awayScore;          // For exact score mode
    }

    struct UserPrediction {
        address user;
        uint256 eventId;
        uint64 submittedAt;
        Prediction[] predictions;
        uint256 totalScore;
        bool claimed;
    }

    struct UserStats {
        uint256 totalPoints;
        uint256 eventsParticipated;
        uint256 eventsWon;
        uint256 totalEarnings;
    }

    // =============================================================
    //                          STORAGE
    // =============================================================

    IERC20 public prizeToken;    // USDC or other ERC20 token for prizes
    address public oracle;        // Trusted oracle for match results

    uint256 public eventCounter;
    uint256 public matchCounter;

    // Mappings
    mapping(uint256 => PredictionEvent) public events;
    mapping(uint256 => Match) public matches;
    mapping(uint256 => mapping(address => UserPrediction)) public userPredictions;
    mapping(uint256 => mapping(address => bool)) public hasSubmitted;
    mapping(uint256 => mapping(address => uint256)) public eventScores;
    mapping(address => UserStats) public userStats;

    // For leaderboard queries
    mapping(uint256 => address[]) public eventParticipants;

    // =============================================================
    //                          EVENTS
    // =============================================================

    event EventCreated(
        uint256 indexed eventId,
        address indexed creator,
        string name,
        uint256 prizePool,
        uint64 deadline,
        PredictionMode mode
    );

    event PredictionSubmitted(
        uint256 indexed eventId,
        address indexed user,
        uint64 timestamp
    );

    event MatchResultSubmitted(
        uint256 indexed matchId,
        uint8 homeScore,
        uint8 awayScore
    );

    event EventFinalized(
        uint256 indexed eventId,
        address[] winners,
        uint256 rewardPerWinner
    );

    event RewardClaimed(
        uint256 indexed eventId,
        address indexed user,
        uint256 amount
    );

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    // =============================================================
    //                         MODIFIERS
    // =============================================================

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle can call this");
        _;
    }

    modifier eventExists(uint256 _eventId) {
        require(_eventId < eventCounter, "Event does not exist");
        _;
    }

    modifier matchExists(uint256 _matchId) {
        require(_matchId < matchCounter, "Match does not exist");
        _;
    }

    // =============================================================
    //                       CONSTRUCTOR
    // =============================================================

    constructor(address _prizeToken, address _oracle) Ownable(msg.sender) {
        require(_prizeToken != address(0), "Invalid prize token");
        require(_oracle != address(0), "Invalid oracle address");
        
        prizeToken = IERC20(_prizeToken);
        oracle = _oracle;
    }

    // =============================================================
    //                    EVENT CREATION
    // =============================================================

    /**
     * @notice Creates a new prediction event
     * @param _name Event name
     * @param _prizePool Amount of prize tokens to lock
     * @param _deadline Timestamp when predictions close
     * @param _mode Prediction mode (OUTCOME or EXACT_SCORE)
     * @param _fixtureIds Array of API-Football fixture IDs
     * @param _homeTeams Array of home team names
     * @param _awayTeams Array of away team names
     * @param _matchTimestamps Array of match start timestamps
     */
    function createEvent(
        string memory _name,
        uint256 _prizePool,
        uint64 _deadline,
        PredictionMode _mode,
        uint256[] memory _fixtureIds,
        string[] memory _homeTeams,
        string[] memory _awayTeams,
        uint64[] memory _matchTimestamps
    ) external whenNotPaused returns (uint256) {
        require(bytes(_name).length > 0, "Event name required");
        require(_deadline > block.timestamp, "Deadline must be in future");
        require(_fixtureIds.length > 0, "At least one match required");
        require(
            _fixtureIds.length == _homeTeams.length &&
            _fixtureIds.length == _awayTeams.length &&
            _fixtureIds.length == _matchTimestamps.length,
            "Array lengths mismatch"
        );

        // Transfer prize pool if provided
        if (_prizePool > 0) {
            prizeToken.safeTransferFrom(msg.sender, address(this), _prizePool);
        }

        uint256 eventId = eventCounter++;

        // Create matches
        uint256[] memory matchIds = new uint256[](_fixtureIds.length);
        for (uint256 i = 0; i < _fixtureIds.length; i++) {
            uint256 matchId = matchCounter++;
            matches[matchId] = Match({
                fixtureId: _fixtureIds[i],
                homeTeam: _homeTeams[i],
                awayTeam: _awayTeams[i],
                matchTimestamp: _matchTimestamps[i],
                homeScore: 0,
                awayScore: 0,
                status: MatchStatus.PENDING
            });
            matchIds[i] = matchId;
        }

        // Create event
        PredictionEvent storage newEvent = events[eventId];
        newEvent.eventId = eventId;
        newEvent.creator = msg.sender;
        newEvent.name = _name;
        newEvent.prizePool = _prizePool;
        newEvent.deadline = _deadline;
        newEvent.mode = _mode;
        newEvent.matchIds = matchIds;
        newEvent.finalized = false;
        newEvent.totalParticipants = 0;

        emit EventCreated(eventId, msg.sender, _name, _prizePool, _deadline, _mode);

        return eventId;
    }

    // =============================================================
    //                  PREDICTION SUBMISSION
    // =============================================================

    /**
     * @notice Submit predictions for an event
     * @param _eventId The event ID
     * @param _predictions Array of predictions matching event matches
     */
    function submitPrediction(
        uint256 _eventId,
        Prediction[] memory _predictions
    ) external whenNotPaused eventExists(_eventId) {
        PredictionEvent storage predEvent = events[_eventId];
        
        require(!predEvent.finalized, "Event already finalized");
        require(block.timestamp < predEvent.deadline, "Deadline passed");
        require(!hasSubmitted[_eventId][msg.sender], "Already submitted");
        require(
            _predictions.length == predEvent.matchIds.length,
            "Must predict all matches"
        );

        // Validate predictions
        for (uint256 i = 0; i < _predictions.length; i++) {
            require(
                _predictions[i].matchId == predEvent.matchIds[i],
                "Invalid match ID order"
            );
            
            // Validate based on mode
            if (predEvent.mode == PredictionMode.OUTCOME) {
                require(
                    _predictions[i].outcome == PredictionType.HOME_WIN ||
                    _predictions[i].outcome == PredictionType.AWAY_WIN ||
                    _predictions[i].outcome == PredictionType.DRAW,
                    "Invalid outcome prediction"
                );
            } else {
                // For exact score, validate reasonable scores
                require(
                    _predictions[i].homeScore <= 20 && _predictions[i].awayScore <= 20,
                    "Unrealistic score"
                );
            }
        }

        // Store prediction
        UserPrediction storage userPred = userPredictions[_eventId][msg.sender];
        userPred.user = msg.sender;
        userPred.eventId = _eventId;
        userPred.submittedAt = uint64(block.timestamp);
        userPred.claimed = false;

        // Copy predictions
        for (uint256 i = 0; i < _predictions.length; i++) {
            userPred.predictions.push(_predictions[i]);
        }

        hasSubmitted[_eventId][msg.sender] = true;
        eventParticipants[_eventId].push(msg.sender);
        predEvent.totalParticipants++;

        // Update user stats
        if (userStats[msg.sender].eventsParticipated == 0) {
            userStats[msg.sender] = UserStats({
                totalPoints: 0,
                eventsParticipated: 1,
                eventsWon: 0,
                totalEarnings: 0
            });
        } else {
            userStats[msg.sender].eventsParticipated++;
        }

        emit PredictionSubmitted(_eventId, msg.sender, uint64(block.timestamp));
    }

    // =============================================================
    //                    ORACLE FUNCTIONS
    // =============================================================

    /**
     * @notice Submit results for a match (oracle only)
     * @param _matchId Match ID
     * @param _homeScore Final home team score
     * @param _awayScore Final away team score
     */
    function submitMatchResult(
        uint256 _matchId,
        uint8 _homeScore,
        uint8 _awayScore
    ) external onlyOracle matchExists(_matchId) {
        Match storage matchData = matches[_matchId];
        require(matchData.status == MatchStatus.PENDING, "Match already settled");

        matchData.homeScore = _homeScore;
        matchData.awayScore = _awayScore;
        matchData.status = MatchStatus.SETTLED;

        emit MatchResultSubmitted(_matchId, _homeScore, _awayScore);
    }

    /**
     * @notice Finalize event, calculate scores, and identify winners
     * @param _eventId Event ID to finalize
     */
    function finalizeEvent(uint256 _eventId) external eventExists(_eventId) {
        PredictionEvent storage predEvent = events[_eventId];
        
        require(!predEvent.finalized, "Already finalized");
        require(block.timestamp > predEvent.deadline, "Deadline not passed");
        
        // Check all matches are settled
        for (uint256 i = 0; i < predEvent.matchIds.length; i++) {
            require(
                matches[predEvent.matchIds[i]].status == MatchStatus.SETTLED,
                "Not all matches settled"
            );
        }

        // Calculate scores for all participants
        address[] memory participants = eventParticipants[_eventId];
        uint256 highestScore = 0;
        uint64 earliestTimestamp = type(uint64).max;

        for (uint256 i = 0; i < participants.length; i++) {
            address user = participants[i];
            uint256 score = _calculateScore(_eventId, user);
            eventScores[_eventId][user] = score;
            userPredictions[_eventId][user].totalScore = score;

            // Update global stats
            userStats[user].totalPoints += score;

            // Track highest score and earliest submission for tiebreaking
            if (score > highestScore) {
                highestScore = score;
                earliestTimestamp = userPredictions[_eventId][user].submittedAt;
                delete predEvent.winners;
                predEvent.winners.push(user);
            } else if (score == highestScore) {
                uint64 userTimestamp = userPredictions[_eventId][user].submittedAt;
                if (userTimestamp < earliestTimestamp) {
                    earliestTimestamp = userTimestamp;
                    delete predEvent.winners;
                    predEvent.winners.push(user);
                } else if (userTimestamp == earliestTimestamp) {
                    predEvent.winners.push(user);
                }
            }
        }

        predEvent.finalized = true;

        // Distribute rewards if there's a prize pool
        uint256 rewardPerWinner = 0;
        if (predEvent.prizePool > 0 && predEvent.winners.length > 0) {
            rewardPerWinner = predEvent.prizePool / predEvent.winners.length;
            
            for (uint256 i = 0; i < predEvent.winners.length; i++) {
                address winner = predEvent.winners[i];
                userStats[winner].eventsWon++;
                userStats[winner].totalEarnings += rewardPerWinner;
            }
        }

        emit EventFinalized(_eventId, predEvent.winners, rewardPerWinner);
    }

    /**
     * @notice Calculate score for a user's predictions
     * @param _eventId Event ID
     * @param _user User address
     * @return Total score
     */
    function _calculateScore(uint256 _eventId, address _user) internal view returns (uint256) {
        PredictionEvent storage predEvent = events[_eventId];
        UserPrediction storage userPred = userPredictions[_eventId][_user];
        
        uint256 totalScore = 0;

        for (uint256 i = 0; i < userPred.predictions.length; i++) {
            Prediction memory pred = userPred.predictions[i];
            Match storage matchData = matches[pred.matchId];

            if (predEvent.mode == PredictionMode.EXACT_SCORE) {
                // Exact score: 10 points for perfect prediction
                if (pred.homeScore == matchData.homeScore && pred.awayScore == matchData.awayScore) {
                    totalScore += 10;
                }
                // Winner correct: 5 points
                else if (_getMatchOutcome(matchData.homeScore, matchData.awayScore) == 
                         _getMatchOutcome(pred.homeScore, pred.awayScore)) {
                    totalScore += 5;
                }
            } else {
                // Outcome mode: 5 points for correct outcome
                PredictionType actualOutcome = _getMatchOutcome(matchData.homeScore, matchData.awayScore);
                if (pred.outcome == actualOutcome) {
                    totalScore += 5;
                }
            }
        }

        return totalScore;
    }

    /**
     * @notice Determine match outcome from scores
     */
    function _getMatchOutcome(uint8 _homeScore, uint8 _awayScore) internal pure returns (PredictionType) {
        if (_homeScore > _awayScore) return PredictionType.HOME_WIN;
        if (_awayScore > _homeScore) return PredictionType.AWAY_WIN;
        return PredictionType.DRAW;
    }

    // =============================================================
    //                   REWARD CLAIMING
    // =============================================================

    /**
     * @notice Claim reward for a won event
     * @param _eventId Event ID
     */
    function claimReward(uint256 _eventId) external nonReentrant eventExists(_eventId) {
        PredictionEvent storage predEvent = events[_eventId];
        require(predEvent.finalized, "Event not finalized");
        require(predEvent.prizePool > 0, "No prize pool");
        
        UserPrediction storage userPred = userPredictions[_eventId][msg.sender];
        require(!userPred.claimed, "Already claimed");

        // Check if user is a winner
        bool isWinner = false;
        for (uint256 i = 0; i < predEvent.winners.length; i++) {
            if (predEvent.winners[i] == msg.sender) {
                isWinner = true;
                break;
            }
        }
        require(isWinner, "Not a winner");

        userPred.claimed = true;
        uint256 reward = predEvent.prizePool / predEvent.winners.length;

        prizeToken.safeTransfer(msg.sender, reward);

        emit RewardClaimed(_eventId, msg.sender, reward);
    }

    // =============================================================
    //                      VIEW FUNCTIONS
    // =============================================================

    /**
     * @notice Get event details
     */
    function getEventDetails(uint256 _eventId) external view eventExists(_eventId) returns (
        address creator,
        string memory name,
        uint256 prizePool,
        uint64 deadline,
        PredictionMode mode,
        uint256[] memory matchIds,
        bool finalized,
        uint256 totalParticipants,
        address[] memory winners
    ) {
        PredictionEvent storage predEvent = events[_eventId];
        return (
            predEvent.creator,
            predEvent.name,
            predEvent.prizePool,
            predEvent.deadline,
            predEvent.mode,
            predEvent.matchIds,
            predEvent.finalized,
            predEvent.totalParticipants,
            predEvent.winners
        );
    }

    /**
     * @notice Get match details
     */
    function getMatchDetails(uint256 _matchId) external view matchExists(_matchId) returns (
        uint256 fixtureId,
        string memory homeTeam,
        string memory awayTeam,
        uint64 matchTimestamp,
        uint8 homeScore,
        uint8 awayScore,
        MatchStatus status
    ) {
        Match storage matchData = matches[_matchId];
        return (
            matchData.fixtureId,
            matchData.homeTeam,
            matchData.awayTeam,
            matchData.matchTimestamp,
            matchData.homeScore,
            matchData.awayScore,
            matchData.status
        );
    }

    /**
     * @notice Get user's prediction for an event
     */
    function getUserPrediction(uint256 _eventId, address _user) external view returns (
        uint64 submittedAt,
        Prediction[] memory predictions,
        uint256 totalScore,
        bool claimed
    ) {
        UserPrediction storage userPred = userPredictions[_eventId][_user];
        return (
            userPred.submittedAt,
            userPred.predictions,
            userPred.totalScore,
            userPred.claimed
        );
    }

    /**
     * @notice Get user statistics
     */
    function getUserStats(address _user) external view returns (UserStats memory) {
        return userStats[_user];
    }

    /**
     * @notice Get event leaderboard (sorted client-side)
     */
    function getEventLeaderboard(uint256 _eventId) external view eventExists(_eventId) returns (
        address[] memory participants,
        uint256[] memory scores
    ) {
        address[] memory allParticipants = eventParticipants[_eventId];
        uint256[] memory allScores = new uint256[](allParticipants.length);

        for (uint256 i = 0; i < allParticipants.length; i++) {
            allScores[i] = eventScores[_eventId][allParticipants[i]];
        }

        return (allParticipants, allScores);
    }

    /**
     * @notice Check if user has submitted for an event
     */
    function hasUserSubmitted(uint256 _eventId, address _user) external view returns (bool) {
        return hasSubmitted[_eventId][_user];
    }

    // =============================================================
    //                     ADMIN FUNCTIONS
    // =============================================================

    /**
     * @notice Update oracle address
     */
    function updateOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid oracle address");
        address oldOracle = oracle;
        oracle = _newOracle;
        emit OracleUpdated(oldOracle, _newOracle);
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw (only for unclaimed funds after reasonable time)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}