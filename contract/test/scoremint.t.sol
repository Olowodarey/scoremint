// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test, console} from "forge-std/Test.sol";
import {ScoremintLib} from "../src/ScoremintLib.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {ScoremintTestable} from "./ScoremintTestable.sol";

contract ScoremintTest is Test {
    ScoremintTestable public scoremint;
    ERC20Mock public prizeToken;

    address public owner = address(1);
    address public creator1 = address(2);
    address public creator2 = address(3);
    address public user1 = address(4);

    uint256 constant INITIAL_BALANCE = 10000 * 1e6; // 10,000 USDC

    function setUp() public {
        // Deploy prize token (mock USDC)
        prizeToken = new ERC20Mock();

        // Deploy testable Scoremint contract
        scoremint = new ScoremintTestable();
        scoremint.initialize(owner);

        // Mint tokens to creators
        prizeToken.mint(creator1, INITIAL_BALANCE);
        prizeToken.mint(creator2, INITIAL_BALANCE);

        // Approve scoremint to spend tokens
        vm.prank(creator1);
        prizeToken.approve(address(scoremint), type(uint256).max);

        vm.prank(creator2);
        prizeToken.approve(address(scoremint), type(uint256).max);

        // Create some default matches for testing
        createMatches();
    }

    // Helper function to create test matches
    function createMatches() internal {
        // Create 3 test matches
        scoremint.createMatch(
            1001,
            "Manchester United",
            "Chelsea",
            uint64(block.timestamp + 3 days)
        );

        scoremint.createMatch(
            1002,
            "Liverpool",
            "Arsenal",
            uint64(block.timestamp + 4 days)
        );

        scoremint.createMatch(
            1003,
            "Manchester City",
            "Tottenham",
            uint64(block.timestamp + 5 days)
        );
    }

    // =============================================================
    //                   FREE EVENT CREATION TESTS
    // =============================================================

    function test_CreateFreeEvent() public {
        string memory eventName = "Weekend Premier League Predictions";
        uint64 deadline = uint64(block.timestamp + 7 days);
        uint256[] memory matchIds = new uint256[](2);
        matchIds[0] = 0;
        matchIds[1] = 1;

        vm.prank(creator1);
        scoremint.createEvent(
            eventName,
            deadline,
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0 // no prize pool for FREE events
        );

        // Verify event was created
        ScoremintLib.PredictionEvent memory createdEvent = scoremint.getEvent(
            0
        );
        assertEq(createdEvent.eventId, 0);
        assertEq(createdEvent.creator, creator1);
        assertEq(createdEvent.name, eventName);
        assertEq(createdEvent.prizePool, 0);
        assertEq(createdEvent.deadline, deadline);
        assertTrue(createdEvent.mode == ScoremintLib.PredictionMode.OUTCOME);
        assertFalse(createdEvent.finalized);
    }

    function test_CreateMultipleFreeEvents() public {
        uint64 deadline = uint64(block.timestamp + 7 days);
        uint256[] memory matchIds = new uint256[](1);
        matchIds[0] = 0;

        // Creator 1 creates 2 events
        vm.startPrank(creator1);
        scoremint.createEvent(
            "Event 1",
            deadline,
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );

        scoremint.createEvent(
            "Event 2",
            deadline + 1 days,
            ScoremintLib.PredictionMode.EXACT_SCORE,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );
        vm.stopPrank();

        // Creator 2 creates 1 event
        vm.prank(creator2);
        scoremint.createEvent(
            "Event 3",
            deadline,
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );

        // Verify event counter
        assertEq(scoremint.eventCounter(), 3);
    }

    // =============================================================
    //                   GET ALL EVENTS TESTS
    // =============================================================

    function test_GetAllActiveEvents() public {
        uint256[] memory matchIds = new uint256[](1);
        matchIds[0] = 0;

        vm.startPrank(creator1);

        // Create 3 events with different deadlines, all in the future
        scoremint.createEvent(
            "Event 1",
            uint64(block.timestamp + 1 days),
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );

        scoremint.createEvent(
            "Event 2",
            uint64(block.timestamp + 2 days),
            ScoremintLib.PredictionMode.EXACT_SCORE,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );

        scoremint.createEvent(
            "Event 3",
            uint64(block.timestamp + 10 days),
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );

        vm.stopPrank();

        // All events should be active initially
        ScoremintLib.PredictionEvent[] memory activeEvents = scoremint
            .getAllEvents();
        assertEq(activeEvents.length, 3);

        // Warp time forward by 5 days - Event 1 and Event 2 should be expired
        vm.warp(block.timestamp + 5 days);

        // Now only Event 3 should be active
        activeEvents = scoremint.getAllEvents();
        assertEq(activeEvents.length, 1);
        assertEq(activeEvents[0].name, "Event 3");
    }

    function test_GetAllExpiredEvents() public {
        uint256[] memory matchIds = new uint256[](1);
        matchIds[0] = 0;

        vm.startPrank(creator1);

        // Create 3 events with different deadlines
        scoremint.createEvent(
            "Active Event",
            uint64(block.timestamp + 10 days),
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );

        scoremint.createEvent(
            "Will Expire Event 1",
            uint64(block.timestamp + 1 days),
            ScoremintLib.PredictionMode.EXACT_SCORE,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );

        scoremint.createEvent(
            "Will Expire Event 2",
            uint64(block.timestamp + 2 days),
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );

        vm.stopPrank();

        // Initially no expired events
        ScoremintLib.PredictionEvent[] memory expiredEvents = scoremint
            .getAllExpiredEvents();
        assertEq(expiredEvents.length, 0);

        // Warp time forward by 5 days
        vm.warp(block.timestamp + 5 days);

        // Now 2 events should be expired
        expiredEvents = scoremint.getAllExpiredEvents();
        assertEq(expiredEvents.length, 2);
        assertEq(expiredEvents[0].name, "Will Expire Event 1");
        assertEq(expiredEvents[1].name, "Will Expire Event 2");
    }

    // =============================================================
    //                   GET USER EVENTS TESTS
    // =============================================================

    function test_GetUserEventIds() public {
        uint256[] memory matchIds = new uint256[](1);
        matchIds[0] = 0;
        uint64 deadline = uint64(block.timestamp + 7 days);

        // Creator 1 creates 2 events
        vm.startPrank(creator1);
        scoremint.createEvent(
            "Event 1",
            deadline,
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );
        scoremint.createEvent(
            "Event 2",
            deadline,
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );
        vm.stopPrank();

        // Creator 2 creates 1 event
        vm.prank(creator2);
        scoremint.createEvent(
            "Event 3",
            deadline,
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );

        // Get creator1's event IDs
        uint256[] memory creator1Events = scoremint.getUserEventIds(creator1);
        assertEq(creator1Events.length, 2);
        assertEq(creator1Events[0], 0);
        assertEq(creator1Events[1], 1);

        // Get creator2's event IDs
        uint256[] memory creator2Events = scoremint.getUserEventIds(creator2);
        assertEq(creator2Events.length, 1);
        assertEq(creator2Events[0], 2);
    }

    function test_GetUserCreatedEvents() public {
        uint256[] memory matchIds = new uint256[](1);
        matchIds[0] = 0;
        uint64 deadline = uint64(block.timestamp + 7 days);

        // Creator 1 creates 2 events
        vm.startPrank(creator1);
        scoremint.createEvent(
            "Creator1 Event 1",
            deadline,
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );
        scoremint.createEvent(
            "Creator1 Event 2",
            deadline + 1 days,
            ScoremintLib.PredictionMode.EXACT_SCORE,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );
        vm.stopPrank();

        // Get creator1's created events
        ScoremintLib.PredictionEvent[] memory creator1Events = scoremint
            .getUserCreatedEvents(creator1);
        assertEq(creator1Events.length, 2);
        assertEq(creator1Events[0].name, "Creator1 Event 1");
        assertEq(creator1Events[0].creator, creator1);
        assertEq(creator1Events[1].name, "Creator1 Event 2");
        assertEq(creator1Events[1].creator, creator1);
    }

    // =============================================================
    //                   EDGE CASES & VALIDATION
    // =============================================================

    function test_RevertWhen_EmptyEventName() public {
        uint256[] memory matchIds = new uint256[](1);
        matchIds[0] = 0;

        vm.prank(creator1);
        vm.expectRevert("Event name cannot be empty");
        scoremint.createEvent(
            "",
            uint64(block.timestamp + 7 days),
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );
    }

    function test_RevertWhen_DeadlineInPast() public {
        uint256[] memory matchIds = new uint256[](1);
        matchIds[0] = 0;

        vm.prank(creator1);
        vm.expectRevert("Deadline must be in the future");
        scoremint.createEvent(
            "Past Event",
            uint64(block.timestamp - 1),
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );
    }

    function test_RevertWhen_NoMatches() public {
        uint256[] memory matchIds = new uint256[](0);

        vm.prank(creator1);
        vm.expectRevert("Invalid number of matches");
        scoremint.createEvent(
            "No Matches Event",
            uint64(block.timestamp + 7 days),
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );
    }

    function test_RevertWhen_GetNonExistentEvent() public {
        vm.expectRevert("Event does not exist");
        scoremint.getEvent(999);
    }

    function test_GetAllEvents_WhenNoEvents() public {
        ScoremintLib.PredictionEvent[] memory events = scoremint.getAllEvents();
        assertEq(events.length, 0);
    }

    function test_DuplicateEventNames() public {
        uint256[] memory matchIds = new uint256[](1);
        matchIds[0] = 0;
        uint64 deadline = uint64(block.timestamp + 7 days);

        // Create two events with same name
        vm.startPrank(creator1);
        scoremint.createEvent(
            "Duplicate Name",
            deadline,
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );
        scoremint.createEvent(
            "Duplicate Name",
            deadline + 1 days,
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );
        vm.stopPrank();

        // Both events should exist with different IDs
        ScoremintLib.PredictionEvent memory event0 = scoremint.getEvent(0);
        ScoremintLib.PredictionEvent memory event1 = scoremint.getEvent(1);

        assertEq(event0.eventId, 0);
        assertEq(event1.eventId, 1);
        assertEq(event0.name, "Duplicate Name");
        assertEq(event1.name, "Duplicate Name");
        // Different deadlines prove they're distinct events
        assertTrue(event0.deadline != event1.deadline);
    }
}
