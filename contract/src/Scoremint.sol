// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.5.0
pragma solidity ^0.8.27;

import {
    Initializable
} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {
    OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {
    PausableUpgradeable
} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {
    UUPSUpgradeable
} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ScoremintLib} from "./ScoremintLib.sol";

contract Scoremint is
    Initializable,
    PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // =============================================================
    //                      REENTRANCY GUARD
    // =============================================================

    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() internal {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
    }

    function _nonReentrantAfter() internal {
        _status = _NOT_ENTERED;
    }

    // =============================================================
    //                          STORAGE
    // =============================================================

    IERC20 public prizeToken; // USDC or other ERC20 token for prizes
    address public oracle; // Trusted oracle for match results

    uint256 public eventCounter;
    uint256 public matchCounter;
    uint256 public userCounter;

    // Event storage
    mapping(uint256 => ScoremintLib.PredictionEvent) public events;
    mapping(uint256 => ScoremintLib.Match) public matches;
    mapping(address => uint256[]) public userEvents; // Events created by user

    // Prediction storage
    mapping(uint256 => mapping(address => ScoremintLib.UserPrediction))
        public userPredictions; // eventId => user => predictions
    mapping(uint256 => mapping(address => bool)) public hasSubmitted; // eventId => user => has submitted
    mapping(uint256 => address[]) public eventParticipants; // eventId => list of participant addresses

    // User storage
    mapping(address => ScoremintLib.User) public users; // user address => user data
    mapping(address => uint256[]) public userParticipatedEvents; // user => event IDs participated
    mapping(address => bool) public isRegisteredUser; // track if user is registered

    // Prize claim tracking
    mapping(uint256 => mapping(address => bool)) public hasClaimed; // event ID => user => has claimed
    mapping(uint256 => mapping(address => uint256)) public userRewards; // eventId => user => reward amount

    // =============================================================
    //                      INITIALIZATION
    // =============================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Pausable_init();
        __Ownable_init(initialOwner);
        _status = _NOT_ENTERED; // Initialize reentrancy guard
    }

    // =============================================================
    //                      ADMIN FUNCTIONS
    // =============================================================

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // =============================================================
    //                          EVENTS
    // =============================================================

    event EventCreated(
        uint256 indexed eventId,
        address indexed creator,
        string name,
        uint256 prizePool,
        uint64 deadline,
        ScoremintLib.PredictionMode mode,
        ScoremintLib.EventType eventType
    );

    event PredictionSubmitted(
        uint256 indexed eventId,
        address indexed user,
        uint64 timestamp
    );

    event UserRegistered(address indexed user, uint256 userId, string username);

    // =============================================================
    //                      WRITE FUNCTIONS
    // =============================================================

    /**
     * @notice Register a user with a username
     * @param username The username for the user
     */
    function registerUser(string memory username) external whenNotPaused {
        require(!isRegisteredUser[msg.sender], "User already registered");
        require(bytes(username).length > 0, "Username cannot be empty");
        require(bytes(username).length <= 32, "Username too long");

        uint256 userId = userCounter++;

        users[msg.sender] = ScoremintLib.User({
            id: userId,
            username: username,
            playerAddress: msg.sender,
            totalPoints: 0,
            eventsParticipated: 0,
            eventsCreated: 0,
            eventsWon: 0,
            totalEarnings: 0
        });

        isRegisteredUser[msg.sender] = true;

        emit UserRegistered(msg.sender, userId, username);
    }

    /**
     * @notice Create a new prediction event
     * @param _name Name of the prediction event
     * @param _deadline Deadline for predictions (unix timestamp)
     * @param _mode Prediction mode (OUTCOME or EXACT_SCORE)
     * @param _matchIds Array of match IDs for this event
     * @param _eventType Event type (FREE or PAID)
     * @param _prizePool Prize pool amount (0 for FREE events)
     * @param _distributionType How prizes will be distributed (WINNER_TAKE_ALL, TOP_3, TOP_5, TOP_10)
     */
    function createEvent(
        string memory _name,
        uint64 _deadline,
        ScoremintLib.PredictionMode _mode,
        uint256[] memory _matchIds,
        ScoremintLib.EventType _eventType,
        uint256 _prizePool,
        ScoremintLib.DistributionType _distributionType
    ) external payable whenNotPaused nonReentrant {
        // Validations
        require(bytes(_name).length > 0, "Event name cannot be empty");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(
            _matchIds.length > 0 &&
                _matchIds.length <= ScoremintLib.MAX_MATCHES_PER_EVENT,
            "Invalid number of matches"
        );

        // Validate all matches exist
        for (uint256 i = 0; i < _matchIds.length; i++) {
            require(_matchIds[i] < matchCounter, "Match does not exist");
        }

        uint256 finalPrizePool = 0;

        // Handle prize pool based on event type
        if (_eventType == ScoremintLib.EventType.PAID) {
            require(
                _prizePool > 0,
                "Prize pool must be greater than 0 for PAID events"
            );

            // Transfer prize pool from creator
            prizeToken.safeTransferFrom(msg.sender, address(this), _prizePool);
            finalPrizePool = _prizePool;
        } else {
            // FREE event - no prize pool required
            require(_prizePool == 0, "Prize pool must be 0 for FREE events");
            require(
                msg.value == 0,
                "No native token should be sent for FREE events"
            );
        }

        // Auto-register user if not registered
        if (!isRegisteredUser[msg.sender]) {
            uint256 userId = userCounter++;
            users[msg.sender] = ScoremintLib.User({
                id: userId,
                username: "", // Empty username for auto-registered users
                playerAddress: msg.sender,
                totalPoints: 0,
                eventsParticipated: 0,
                eventsCreated: 0,
                eventsWon: 0,
                totalEarnings: 0
            });
            isRegisteredUser[msg.sender] = true;
        }

        // Create event
        uint256 eventId = eventCounter++;

        events[eventId] = ScoremintLib.PredictionEvent({
            eventId: eventId,
            creator: msg.sender,
            name: _name,
            prizePool: finalPrizePool,
            deadline: _deadline,
            mode: _mode,
            distributionType: _distributionType,
            matchIds: _matchIds,
            finalized: false,
            totalParticipants: 0,
            winners: new address[](0)
        });

        userEvents[msg.sender].push(eventId);

        // Increment user's events created counter
        users[msg.sender].eventsCreated++;

        emit EventCreated(
            eventId,
            msg.sender,
            _name,
            finalPrizePool,
            _deadline,
            _mode,
            _eventType
        );
    }

    /**
     * @notice Submit predictions for all matches in an event
     * @param eventId The ID of the event
     * @param predictions Array of predictions for each match in the event
     */
    function submitPredictions(
        uint256 eventId,
        ScoremintLib.Prediction[] memory predictions
    ) external whenNotPaused nonReentrant {
        // Validate event exists
        require(eventId < eventCounter, "Event does not exist");

        ScoremintLib.PredictionEvent storage eventData = events[eventId];

        // Validate deadline hasn't passed
        require(
            block.timestamp < eventData.deadline,
            "Event deadline has passed"
        );

        // Validate user hasn't already submitted
        require(
            !hasSubmitted[eventId][msg.sender],
            "Already submitted predictions for this event"
        );

        // Validate predictions array length matches event's match count
        require(
            predictions.length == eventData.matchIds.length,
            "Must submit predictions for all matches"
        );

        // Validate all predictions and match IDs
        for (uint256 i = 0; i < predictions.length; i++) {
            // Validate that the match ID exists in the event
            bool matchFound = false;
            for (uint256 j = 0; j < eventData.matchIds.length; j++) {
                if (predictions[i].matchId == eventData.matchIds[j]) {
                    matchFound = true;
                    break;
                }
            }
            require(matchFound, "Match ID not in event");

            // Validate prediction type for OUTCOME mode
            if (eventData.mode == ScoremintLib.PredictionMode.OUTCOME) {
                require(
                    predictions[i].outcome ==
                        ScoremintLib.PredictionType.HOME_WIN ||
                        predictions[i].outcome ==
                        ScoremintLib.PredictionType.AWAY_WIN ||
                        predictions[i].outcome ==
                        ScoremintLib.PredictionType.DRAW,
                    "Invalid prediction outcome"
                );
            }
            // For EXACT_SCORE mode, scores are automatically valid as uint8 (0-255)
        }

        // Auto-register user if not registered
        if (!isRegisteredUser[msg.sender]) {
            uint256 userId = userCounter++;
            users[msg.sender] = ScoremintLib.User({
                id: userId,
                username: "", // Empty username for auto-registered users
                playerAddress: msg.sender,
                totalPoints: 0,
                eventsParticipated: 0,
                eventsCreated: 0,
                eventsWon: 0,
                totalEarnings: 0
            });
            isRegisteredUser[msg.sender] = true;
        }

        // Store user predictions
        userPredictions[eventId][msg.sender] = ScoremintLib.UserPrediction({
            user: msg.sender,
            eventId: eventId,
            submittedAt: uint64(block.timestamp),
            predictions: predictions,
            totalScore: 0,
            claimed: false
        });

        // Mark user as having submitted
        hasSubmitted[eventId][msg.sender] = true;

        // Increment total participants
        events[eventId].totalParticipants++;

        // Add to event participants list for leaderboard
        eventParticipants[eventId].push(msg.sender);

        // Update user participation stats
        users[msg.sender].eventsParticipated++;
        userParticipatedEvents[msg.sender].push(eventId);

        emit PredictionSubmitted(eventId, msg.sender, uint64(block.timestamp));
    }

    // =============================================================
    //                      VIEW FUNCTIONS
    // =============================================================

    /**
     * @notice Get all active prediction events (deadline not yet passed)
     * @return Array of active prediction events
     */
    function getAllEvents()
        external
        view
        returns (ScoremintLib.PredictionEvent[] memory)
    {
        // First, count active events
        uint256 activeCount = 0;
        for (uint256 i = 0; i < eventCounter; i++) {
            if (events[i].deadline > block.timestamp) {
                activeCount++;
            }
        }

        // Create array with exact size
        ScoremintLib.PredictionEvent[]
            memory activeEvents = new ScoremintLib.PredictionEvent[](
                activeCount
            );
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < eventCounter; i++) {
            if (events[i].deadline > block.timestamp) {
                activeEvents[currentIndex] = events[i];
                currentIndex++;
            }
        }

        return activeEvents;
    }

    /**
     * @notice Get all expired prediction events (deadline has passed)
     * @return Array of expired prediction events
     */
    function getAllExpiredEvents()
        external
        view
        returns (ScoremintLib.PredictionEvent[] memory)
    {
        // First, count expired events
        uint256 expiredCount = 0;
        for (uint256 i = 0; i < eventCounter; i++) {
            if (events[i].deadline <= block.timestamp) {
                expiredCount++;
            }
        }

        // Create array with exact size
        ScoremintLib.PredictionEvent[]
            memory expiredEvents = new ScoremintLib.PredictionEvent[](
                expiredCount
            );
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < eventCounter; i++) {
            if (events[i].deadline <= block.timestamp) {
                expiredEvents[currentIndex] = events[i];
                currentIndex++;
            }
        }

        return expiredEvents;
    }

    /**
     * @notice Get all event IDs created by a user
     * @param user Address of the user
     * @return Array of event IDs created by the user
     */
    function getUserEventIds(
        address user
    ) external view returns (uint256[] memory) {
        return userEvents[user];
    }

    /**
     * @notice Get all prediction events created by a user
     * @param user Address of the user
     * @return Array of prediction events created by the user
     */
    function getUserCreatedEvents(
        address user
    ) external view returns (ScoremintLib.PredictionEvent[] memory) {
        uint256[] memory eventIds = userEvents[user];
        ScoremintLib.PredictionEvent[]
            memory userCreatedEvents = new ScoremintLib.PredictionEvent[](
                eventIds.length
            );

        for (uint256 i = 0; i < eventIds.length; i++) {
            userCreatedEvents[i] = events[eventIds[i]];
        }

        return userCreatedEvents;
    }

    /**
     * @notice Get a specific event by its ID
     * @param eventId The ID of the event
     * @return The prediction event
     */
    function getEvent(
        uint256 eventId
    ) external view returns (ScoremintLib.PredictionEvent memory) {
        require(eventId < eventCounter, "Event does not exist");
        return events[eventId];
    }

    /**
     * @notice Get user's predictions for a specific event
     * @param eventId The ID of the event
     * @param user Address of the user
     * @return The user's prediction for the event
     */
    function getUserPredictions(
        uint256 eventId,
        address user
    ) external view returns (ScoremintLib.UserPrediction memory) {
        require(eventId < eventCounter, "Event does not exist");
        require(
            hasSubmitted[eventId][user],
            "User has not submitted predictions"
        );
        return userPredictions[eventId][user];
    }

    /**
     * @notice Check if a user has submitted predictions for an event
     * @param eventId The ID of the event
     * @param user Address of the user
     * @return True if user has submitted predictions, false otherwise
     */
    function hasUserSubmitted(
        uint256 eventId,
        address user
    ) external view returns (bool) {
        return hasSubmitted[eventId][user];
    }

    /**
     * @notice Get user profile and stats
     * @param user Address of the user
     * @return The user's profile data
     */
    function getUserProfile(
        address user
    ) external view returns (ScoremintLib.User memory) {
        require(isRegisteredUser[user], "User not registered");
        return users[user];
    }

    /**
     * @notice Get all event IDs a user has participated in
     * @param user Address of the user
     * @return Array of event IDs the user participated in
     */
    function getUserParticipatedEventIds(
        address user
    ) external view returns (uint256[] memory) {
        return userParticipatedEvents[user];
    }

    /**
     * @notice Get all events a user has participated in
     * @param user Address of the user
     * @return Array of prediction events the user participated in
     */
    function getUserParticipatedEvents(
        address user
    ) external view returns (ScoremintLib.PredictionEvent[] memory) {
        uint256[] memory eventIds = userParticipatedEvents[user];
        ScoremintLib.PredictionEvent[]
            memory participatedEvents = new ScoremintLib.PredictionEvent[](
                eventIds.length
            );

        for (uint256 i = 0; i < eventIds.length; i++) {
            participatedEvents[i] = events[eventIds[i]];
        }

        return participatedEvents;
    }

    /**
     * @notice Get user's total score from all events
     * @param user Address of the user
     * @return Total points accumulated by the user
     */
    function getUserTotalScore(address user) external view returns (uint256) {
        require(isRegisteredUser[user], "User not registered");
        return users[user].totalPoints;
    }

    /**
     * @notice Get user's statistics
     * @param user Address of the user
     * @return eventsParticipated Number of events participated
     * @return eventsCreated Number of events created
     * @return eventsWon Number of events won
     * @return totalPoints Total points accumulated
     * @return totalEarnings Total earnings from prizes
     */
    function getUserStats(
        address user
    )
        external
        view
        returns (
            uint256 eventsParticipated,
            uint256 eventsCreated,
            uint256 eventsWon,
            uint256 totalPoints,
            uint256 totalEarnings
        )
    {
        require(isRegisteredUser[user], "User not registered");
        ScoremintLib.User memory userData = users[user];
        return (
            userData.eventsParticipated,
            userData.eventsCreated,
            userData.eventsWon,
            userData.totalPoints,
            userData.totalEarnings
        );
    }

    /**
     * @notice Check if a user is registered
     * @param user Address of the user
     * @return True if user is registered, false otherwise
     */
    function isUserRegistered(address user) external view returns (bool) {
        return isRegisteredUser[user];
    }

    /**
     * @notice Update user's username (only by the user themselves)
     * @param newUsername The new username
     */
    function updateUsername(string memory newUsername) external whenNotPaused {
        require(isRegisteredUser[msg.sender], "User not registered");
        require(bytes(newUsername).length > 0, "Username cannot be empty");
        require(bytes(newUsername).length <= 32, "Username too long");

        users[msg.sender].username = newUsername;
    }

    // =============================================================
    //                   LEADERBOARD FUNCTIONS
    // =============================================================

    /**
     * @notice Get the leaderboard for a specific event (sorted by score)
     * @param eventId The ID of the event
     * @return leaderboard Array of leaderboard entries sorted by score (highest first)
     */
    function getEventLeaderboard(
        uint256 eventId
    )
        external
        view
        returns (ScoremintLib.LeaderboardEntry[] memory leaderboard)
    {
        require(eventId < eventCounter, "Event does not exist");

        address[] memory participants = eventParticipants[eventId];
        uint256 participantCount = participants.length;

        // Create leaderboard array
        leaderboard = new ScoremintLib.LeaderboardEntry[](participantCount);

        // Populate leaderboard with participant data
        for (uint256 i = 0; i < participantCount; i++) {
            address participant = participants[i];
            uint256 score = userPredictions[eventId][participant].totalScore;
            string memory username = isRegisteredUser[participant]
                ? users[participant].username
                : "";

            leaderboard[i] = ScoremintLib.LeaderboardEntry({
                user: participant,
                username: username,
                score: score,
                rank: 0 // Will be set after sorting
            });
        }

        // Sort leaderboard by score (bubble sort - simple for small arrays)
        for (uint256 i = 0; i < participantCount; i++) {
            for (uint256 j = i + 1; j < participantCount; j++) {
                if (leaderboard[j].score > leaderboard[i].score) {
                    // Swap
                    ScoremintLib.LeaderboardEntry memory temp = leaderboard[i];
                    leaderboard[i] = leaderboard[j];
                    leaderboard[j] = temp;
                }
            }
        }

        // Assign ranks (handle ties by giving same rank)
        uint256 currentRank = 1;
        for (uint256 i = 0; i < participantCount; i++) {
            if (i > 0 && leaderboard[i].score < leaderboard[i - 1].score) {
                currentRank = i + 1;
            }
            leaderboard[i].rank = currentRank;
        }

        return leaderboard;
    }

    /**
     * @notice Get all participant addresses and their scores for an event
     * @param eventId The ID of the event
     * @return participants Array of participant addresses
     * @return scores Array of corresponding scores
     */
    function getEventParticipantScores(
        uint256 eventId
    )
        external
        view
        returns (address[] memory participants, uint256[] memory scores)
    {
        require(eventId < eventCounter, "Event does not exist");

        participants = eventParticipants[eventId];
        scores = new uint256[](participants.length);

        for (uint256 i = 0; i < participants.length; i++) {
            scores[i] = userPredictions[eventId][participants[i]].totalScore;
        }

        return (participants, scores);
    }

    /**
     * @notice Get the number of participants in an event
     * @param eventId The ID of the event
     * @return Number of participants
     */
    function getEventParticipantCount(
        uint256 eventId
    ) external view returns (uint256) {
        require(eventId < eventCounter, "Event does not exist");
        return eventParticipants[eventId].length;
    }

    /**
     * @notice Get a user's rank in an event
     * @param eventId The ID of the event
     * @param user Address of the user
     * @return rank The user's rank (1 = first place)
     * @return score The user's score
     */
    function getUserRankInEvent(
        uint256 eventId,
        address user
    ) external view returns (uint256 rank, uint256 score) {
        require(eventId < eventCounter, "Event does not exist");
        require(hasSubmitted[eventId][user], "User has not participated");

        score = userPredictions[eventId][user].totalScore;
        rank = 1;

        // Count how many participants have a higher score
        address[] memory participants = eventParticipants[eventId];
        for (uint256 i = 0; i < participants.length; i++) {
            uint256 participantScore = userPredictions[eventId][participants[i]]
                .totalScore;
            if (participantScore > score) {
                rank++;
            }
        }

        return (rank, score);
    }

    /**
     * @notice Get all participants in an event
     * @param eventId The ID of the event
     * @return Array of participant addresses
     */
    function getEventParticipants(
        uint256 eventId
    ) external view returns (address[] memory) {
        require(eventId < eventCounter, "Event does not exist");
        return eventParticipants[eventId];
    }

    // =============================================================
    //                   PRIZE DISTRIBUTION FUNCTIONS
    // =============================================================

    /**
     * @notice Finalize an event and calculate winner rewards
     * @param eventId The ID of the event to finalize
     * @dev Can only be called by the event creator or oracle after deadline
     */
    function finalizeEvent(
        uint256 eventId
    ) external whenNotPaused nonReentrant {
        require(eventId < eventCounter, "Event does not exist");

        ScoremintLib.PredictionEvent storage eventData = events[eventId];

        require(!eventData.finalized, "Event already finalized");
        require(
            block.timestamp > eventData.deadline,
            "Event deadline has not passed"
        );
        require(
            msg.sender == eventData.creator || msg.sender == oracle,
            "Only creator or oracle can finalize"
        );

        // STEP 1: Get all matches for this event
        uint256[] memory matchIds = eventData.matchIds;
        ScoremintLib.Match[] memory eventMatches = new ScoremintLib.Match[](
            matchIds.length
        );

        // Load match data and verify all are settled
        for (uint256 i = 0; i < matchIds.length; i++) {
            eventMatches[i] = matches[matchIds[i]];
            require(
                eventMatches[i].status == ScoremintLib.MatchStatus.SETTLED,
                "All matches must be settled before finalizing"
            );
        }

        // STEP 2: Calculate scores for all participants
        address[] memory participants = eventParticipants[eventId];

        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            ScoremintLib.UserPrediction storage userPred = userPredictions[
                eventId
            ][participant];

            // Calculate total score using the library function
            uint256 score = ScoremintLib.calculateTotalPoints(
                userPred.predictions,
                eventMatches,
                eventData.mode
            );

            // Store the calculated score
            userPred.totalScore = score;

            // Update user's global total points
            users[participant].totalPoints += score;
        }

        // STEP 3: Get leaderboard (now with calculated scores)
        ScoremintLib.LeaderboardEntry[] memory leaderboard = this
            .getEventLeaderboard(eventId);

        // Determine number of winners based on distribution type
        uint256 maxWinners = ScoremintLib.getWinnerCount(
            eventData.distributionType
        );

        // Cap at actual number of participants
        uint256 actualWinners = maxWinners < leaderboard.length
            ? maxWinners
            : leaderboard.length;

        // Only count participants with score > 0 as winners
        uint256 winnerCount = 0;
        for (uint256 i = 0; i < actualWinners; i++) {
            if (leaderboard[i].score > 0) {
                winnerCount++;
            } else {
                break; // Leaderboard is sorted, so we can stop here
            }
        }

        require(winnerCount > 0, "No valid winners");

        // Store winners
        delete eventData.winners; // Clear existing winners array
        for (uint256 i = 0; i < winnerCount; i++) {
            eventData.winners.push(leaderboard[i].user);
        }

        // Calculate and store rewards for each winner
        uint256 totalDistributed = 0;

        for (uint256 i = 0; i < winnerCount; i++) {
            address winner = leaderboard[i].user;
            uint256 rank = leaderboard[i].rank;

            // Calculate reward based on rank
            uint256 reward = ScoremintLib.calculateRewardForRank(
                eventData.prizePool,
                eventData.distributionType,
                rank
            );

            userRewards[eventId][winner] = reward;
            totalDistributed += reward;
        }

        // SAFETY CHECK: If ties caused over-distribution, scale down proportionally
        if (totalDistributed > eventData.prizePool) {
            // Recalculate all rewards proportionally to fit within prize pool
            for (uint256 i = 0; i < winnerCount; i++) {
                address winner = leaderboard[i].user;
                uint256 originalReward = userRewards[eventId][winner];

                // Scale down: (originalReward * prizePool) / totalDistributed
                uint256 scaledReward = (originalReward * eventData.prizePool) /
                    totalDistributed;

                userRewards[eventId][winner] = scaledReward;
            }
        }

        // Update user stats for all winners
        for (uint256 i = 0; i < winnerCount; i++) {
            users[leaderboard[i].user].eventsWon++;
        }

        eventData.finalized = true;

        emit EventFinalized(eventId, winnerCount, eventData.prizePool);
    }

    /**
     * @notice Claim reward for a finalized event
     * @param eventId The ID of the event
     */
    function claimReward(uint256 eventId) external whenNotPaused nonReentrant {
        require(eventId < eventCounter, "Event does not exist");

        ScoremintLib.PredictionEvent storage eventData = events[eventId];

        require(eventData.finalized, "Event not finalized");
        require(!hasClaimed[eventId][msg.sender], "Reward already claimed");

        uint256 reward = userRewards[eventId][msg.sender];
        require(reward > 0, "No reward to claim");

        // Mark as claimed
        hasClaimed[eventId][msg.sender] = true;

        // Update user total earnings
        users[msg.sender].totalEarnings += reward;

        // Transfer reward
        prizeToken.safeTransfer(msg.sender, reward);

        emit RewardClaimed(eventId, msg.sender, reward);
    }

    /**
     * @notice Get reward amount for a user in an event
     * @param eventId The ID of the event
     * @param user The user address
     * @return reward The reward amount
     */
    function getUserReward(
        uint256 eventId,
        address user
    ) external view returns (uint256 reward) {
        return userRewards[eventId][user];
    }

    /**
     * @notice Check if a user has claimed their reward
     * @param eventId The ID of the event
     * @param user The user address
     * @return Whether the user has claimed
     */
    function hasUserClaimed(
        uint256 eventId,
        address user
    ) external view returns (bool) {
        return hasClaimed[eventId][user];
    }

    /**
     * @notice Get all winners for an event
     * @param eventId The ID of the event
     * @return Array of winner addresses
     */
    function getEventWinners(
        uint256 eventId
    ) external view returns (address[] memory) {
        require(eventId < eventCounter, "Event does not exist");
        return events[eventId].winners;
    }

    // =============================================================
    //                         EVENTS
    // =============================================================

    event EventFinalized(
        uint256 indexed eventId,
        uint256 winnerCount,
        uint256 totalPrizePool
    );

    event RewardClaimed(
        uint256 indexed eventId,
        address indexed user,
        uint256 amount
    );
}
