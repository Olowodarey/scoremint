// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Scoremint} from "../src/Scoremint.sol";
import {ScoremintLib} from "../src/ScoremintLib.sol";
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

/**
 * @notice Test version of Scoremint that removes the constructor initialization blocker
 * This allows the contract to be initialized in test environments without a proxy
 */
contract ScoremintTestable is
    Initializable,
    PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // Copy all storage variables from Scoremint
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    IERC20 public prizeToken;
    address public oracle;
    uint256 public eventCounter;
    uint256 public matchCounter;

    mapping(uint256 => ScoremintLib.PredictionEvent) public events;
    mapping(uint256 => ScoremintLib.Match) public matches;
    mapping(address => uint256[]) public userEvents;

    // Prediction storage
    mapping(uint256 => mapping(address => ScoremintLib.UserPrediction))
        public userPredictions;
    mapping(uint256 => mapping(address => bool)) public hasSubmitted;

    // Remove the constructor that calls _disableInitializers()
    constructor() {
        // Empty constructor for testing
    }

    function initialize(address initialOwner) public initializer {
        __Pausable_init();
        __Ownable_init(initialOwner);
        _status = _NOT_ENTERED;
    }

    // Copy all modifiers and functions from Scoremint
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

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    function createEvent(
        string memory _name,
        uint64 _deadline,
        ScoremintLib.PredictionMode _mode,
        uint256[] memory _matchIds,
        ScoremintLib.EventType _eventType,
        uint256 _prizePool
    ) external payable whenNotPaused nonReentrant {
        require(bytes(_name).length > 0, "Event name cannot be empty");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(
            _matchIds.length > 0 &&
                _matchIds.length <= ScoremintLib.MAX_MATCHES_PER_EVENT,
            "Invalid number of matches"
        );

        for (uint256 i = 0; i < _matchIds.length; i++) {
            require(_matchIds[i] < matchCounter, "Match does not exist");
        }

        uint256 finalPrizePool = 0;

        if (_eventType == ScoremintLib.EventType.PAID) {
            require(
                _prizePool > 0,
                "Prize pool must be greater than 0 for PAID events"
            );
            prizeToken.safeTransferFrom(msg.sender, address(this), _prizePool);
            finalPrizePool = _prizePool;
        } else {
            require(_prizePool == 0, "Prize pool must be 0 for FREE events");
            require(
                msg.value == 0,
                "No native token should be sent for FREE events"
            );
        }

        uint256 eventId = eventCounter++;

        events[eventId] = ScoremintLib.PredictionEvent({
            eventId: eventId,
            creator: msg.sender,
            name: _name,
            prizePool: finalPrizePool,
            deadline: _deadline,
            mode: _mode,
            matchIds: _matchIds,
            finalized: false,
            totalParticipants: 0,
            winners: new address[](0)
        });

        userEvents[msg.sender].push(eventId);

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

    function getAllEvents()
        external
        view
        returns (ScoremintLib.PredictionEvent[] memory)
    {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < eventCounter; i++) {
            if (events[i].deadline > block.timestamp) {
                activeCount++;
            }
        }

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

    function getAllExpiredEvents()
        external
        view
        returns (ScoremintLib.PredictionEvent[] memory)
    {
        uint256 expiredCount = 0;
        for (uint256 i = 0; i < eventCounter; i++) {
            if (events[i].deadline <= block.timestamp) {
                expiredCount++;
            }
        }

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

    function getUserEventIds(
        address user
    ) external view returns (uint256[] memory) {
        return userEvents[user];
    }

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

    function getEvent(
        uint256 eventId
    ) external view returns (ScoremintLib.PredictionEvent memory) {
        require(eventId < eventCounter, "Event does not exist");
        return events[eventId];
    }

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

    // Submit predictions for an event
    function submitPredictions(
        uint256 eventId,
        ScoremintLib.Prediction[] memory predictions
    ) external whenNotPaused nonReentrant {
        require(eventId < eventCounter, "Event does not exist");

        ScoremintLib.PredictionEvent storage eventData = events[eventId];

        require(
            block.timestamp < eventData.deadline,
            "Event deadline has passed"
        );

        require(
            !hasSubmitted[eventId][msg.sender],
            "Already submitted predictions for this event"
        );

        require(
            predictions.length == eventData.matchIds.length,
            "Must submit predictions for all matches"
        );

        for (uint256 i = 0; i < predictions.length; i++) {
            bool matchFound = false;
            for (uint256 j = 0; j < eventData.matchIds.length; j++) {
                if (predictions[i].matchId == eventData.matchIds[j]) {
                    matchFound = true;
                    break;
                }
            }
            require(matchFound, "Match ID not in event");

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
        }

        userPredictions[eventId][msg.sender] = ScoremintLib.UserPrediction({
            user: msg.sender,
            eventId: eventId,
            submittedAt: uint64(block.timestamp),
            predictions: predictions,
            totalScore: 0,
            claimed: false
        });

        hasSubmitted[eventId][msg.sender] = true;
        events[eventId].totalParticipants++;

        emit PredictionSubmitted(eventId, msg.sender, uint64(block.timestamp));
    }

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

    function hasUserSubmitted(
        uint256 eventId,
        address user
    ) external view returns (bool) {
        return hasSubmitted[eventId][user];
    }

    // Helper function for testing - set prize token
    function setPrizeToken(address _prizeToken) external onlyOwner {
        prizeToken = IERC20(_prizeToken);
    }

    // Helper function for testing - create a match
    function createMatch(
        uint256 _fixtureId,
        string memory _homeTeam,
        string memory _awayTeam,
        uint64 _matchTimestamp
    ) external returns (uint256) {
        uint256 matchId = matchCounter++;
        matches[matchId] = ScoremintLib.Match({
            fixtureId: _fixtureId,
            homeTeam: _homeTeam,
            awayTeam: _awayTeam,
            matchTimestamp: _matchTimestamp,
            homeScore: 0,
            awayScore: 0,
            status: ScoremintLib.MatchStatus.PENDING
        });
        return matchId;
    }
}
