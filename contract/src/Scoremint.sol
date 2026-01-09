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

    // Event storage
    mapping(uint256 => ScoremintLib.PredictionEvent) public events;
    mapping(uint256 => ScoremintLib.Match) public matches;
    mapping(address => uint256[]) public userEvents; // Events created by user

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

    // =============================================================
    //                      WRITE FUNCTIONS
    // =============================================================

    /**
     * @notice Create a new prediction event
     * @param _name Name of the prediction event
     * @param _deadline Deadline for predictions (unix timestamp)
     * @param _mode Prediction mode (OUTCOME or EXACT_SCORE)
     * @param _matchIds Array of match IDs for this event
     * @param _eventType Event type (FREE or PAID)
     * @param _prizePool Prize pool amount (0 for FREE events)
     */
    function createEvent(
        string memory _name,
        uint64 _deadline,
        ScoremintLib.PredictionMode _mode,
        uint256[] memory _matchIds,
        ScoremintLib.EventType _eventType,
        uint256 _prizePool
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

        // Create event
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
}
