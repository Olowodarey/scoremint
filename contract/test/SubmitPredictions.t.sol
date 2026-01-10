// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test, console} from "forge-std/Test.sol";
import {ScoremintLib} from "../src/ScoremintLib.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {ScoremintTestable} from "./ScoremintTestable.sol";

contract SubmitPredictionsTest is Test {
    ScoremintTestable public scoremint;
    ERC20Mock public prizeToken;

    address public owner = address(1);
    address public creator = address(2);
    address public user1 = address(3);
    address public user2 = address(4);

    uint256 public eventId;
    uint256[] public matchIds;

    function setUp() public {
        // Deploy mock token
        prizeToken = new ERC20Mock();

        // Deploy Scoremint
        scoremint = new ScoremintTestable();
        scoremint.initialize(owner);

        // Set prize token
        vm.prank(owner);
        scoremint.setPrizeToken(address(prizeToken));

        // Mint tokens to users
        prizeToken.mint(creator, 1000 ether);
        prizeToken.mint(user1, 1000 ether);
        prizeToken.mint(user2, 1000 ether);

        // Approve scoremint to spend tokens
        vm.prank(creator);
        prizeToken.approve(address(scoremint), type(uint256).max);

        vm.prank(user1);
        prizeToken.approve(address(scoremint), type(uint256).max);

        vm.prank(user2);
        prizeToken.approve(address(scoremint), type(uint256).max);

        // Create test matches
        createMatches();

        // Create a test event
        eventId = createTestEvent();
    }

    function createMatches() internal {
        scoremint.createMatch(
            1001,
            "Manchester United",
            "Chelsea",
            uint64(block.timestamp + 3 days)
        );

        scoremint.createMatch(
            1002,
            "Arsenal",
            "Liverpool",
            uint64(block.timestamp + 4 days)
        );

        scoremint.createMatch(
            1003,
            "Manchester City",
            "Tottenham",
            uint64(block.timestamp + 5 days)
        );

        matchIds = new uint256[](3);
        matchIds[0] = 0;
        matchIds[1] = 1;
        matchIds[2] = 2;
    }

    function createTestEvent() internal returns (uint256) {
        vm.prank(creator);
        scoremint.createEvent(
            "Premier League Weekend",
            uint64(block.timestamp + 2 days),
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );
        return 0; // First event
    }

    // =============================================================
    //                   SUCCESSFUL SUBMISSIONS
    // =============================================================

    function test_SubmitPredictions_Outcome() public {
        ScoremintLib.Prediction[]
            memory predictions = new ScoremintLib.Prediction[](3);

        predictions[0] = ScoremintLib.Prediction({
            matchId: 0,
            outcome: ScoremintLib.PredictionType.HOME_WIN,
            homeScore: 0,
            awayScore: 0
        });

        predictions[1] = ScoremintLib.Prediction({
            matchId: 1,
            outcome: ScoremintLib.PredictionType.AWAY_WIN,
            homeScore: 0,
            awayScore: 0
        });

        predictions[2] = ScoremintLib.Prediction({
            matchId: 2,
            outcome: ScoremintLib.PredictionType.DRAW,
            homeScore: 0,
            awayScore: 0
        });

        vm.prank(user1);
        scoremint.submitPredictions(eventId, predictions);

        // Verify submission
        assertTrue(scoremint.hasUserSubmitted(eventId, user1));

        // Verify event participant count
        ScoremintLib.PredictionEvent memory eventData = scoremint.getEvent(
            eventId
        );
        assertEq(eventData.totalParticipants, 1);

        // Verify user predictions
        ScoremintLib.UserPrediction memory userPrediction = scoremint
            .getUserPredictions(eventId, user1);
        assertEq(userPrediction.user, user1);
        assertEq(userPrediction.eventId, eventId);
        assertEq(userPrediction.predictions.length, 3);
        assertEq(
            uint256(userPrediction.predictions[0].outcome),
            uint256(ScoremintLib.PredictionType.HOME_WIN)
        );
        assertEq(
            uint256(userPrediction.predictions[1].outcome),
            uint256(ScoremintLib.PredictionType.AWAY_WIN)
        );
        assertEq(
            uint256(userPrediction.predictions[2].outcome),
            uint256(ScoremintLib.PredictionType.DRAW)
        );
    }

    function test_SubmitPredictions_ExactScore() public {
        // Create EXACT_SCORE event
        uint256[] memory eventMatchIds = new uint256[](2);
        eventMatchIds[0] = 0;
        eventMatchIds[1] = 1;

        vm.prank(creator);
        scoremint.createEvent(
            "Exact Score Challenge",
            uint64(block.timestamp + 2 days),
            ScoremintLib.PredictionMode.EXACT_SCORE,
            eventMatchIds,
            ScoremintLib.EventType.FREE,
            0
        );
        uint256 exactScoreEventId = 1;

        ScoremintLib.Prediction[]
            memory predictions = new ScoremintLib.Prediction[](2);

        predictions[0] = ScoremintLib.Prediction({
            matchId: 0,
            outcome: ScoremintLib.PredictionType.HOME_WIN,
            homeScore: 3,
            awayScore: 1
        });

        predictions[1] = ScoremintLib.Prediction({
            matchId: 1,
            outcome: ScoremintLib.PredictionType.AWAY_WIN,
            homeScore: 1,
            awayScore: 2
        });

        vm.prank(user1);
        scoremint.submitPredictions(exactScoreEventId, predictions);

        // Verify submission
        assertTrue(scoremint.hasUserSubmitted(exactScoreEventId, user1));

        // Verify scores
        ScoremintLib.UserPrediction memory userPrediction = scoremint
            .getUserPredictions(exactScoreEventId, user1);
        assertEq(userPrediction.predictions[0].homeScore, 3);
        assertEq(userPrediction.predictions[0].awayScore, 1);
        assertEq(userPrediction.predictions[1].homeScore, 1);
        assertEq(userPrediction.predictions[1].awayScore, 2);
    }

    function test_MultipleUsersSubmit() public {
        ScoremintLib.Prediction[]
            memory predictions1 = new ScoremintLib.Prediction[](3);
        ScoremintLib.Prediction[]
            memory predictions2 = new ScoremintLib.Prediction[](3);

        // User1 predictions
        for (uint256 i = 0; i < 3; i++) {
            predictions1[i] = ScoremintLib.Prediction({
                matchId: i,
                outcome: ScoremintLib.PredictionType.HOME_WIN,
                homeScore: 0,
                awayScore: 0
            });
        }

        // User2 predictions
        for (uint256 i = 0; i < 3; i++) {
            predictions2[i] = ScoremintLib.Prediction({
                matchId: i,
                outcome: ScoremintLib.PredictionType.AWAY_WIN,
                homeScore: 0,
                awayScore: 0
            });
        }

        vm.prank(user1);
        scoremint.submitPredictions(eventId, predictions1);

        vm.prank(user2);
        scoremint.submitPredictions(eventId, predictions2);

        // Verify both submissions
        assertTrue(scoremint.hasUserSubmitted(eventId, user1));
        assertTrue(scoremint.hasUserSubmitted(eventId, user2));

        // Verify participant count
        ScoremintLib.PredictionEvent memory eventData = scoremint.getEvent(
            eventId
        );
        assertEq(eventData.totalParticipants, 2);
    }

    // =============================================================
    //                   VALIDATION TESTS
    // =============================================================

    function test_RevertWhen_EventDoesNotExist() public {
        ScoremintLib.Prediction[]
            memory predictions = new ScoremintLib.Prediction[](1);

        vm.prank(user1);
        vm.expectRevert("Event does not exist");
        scoremint.submitPredictions(999, predictions);
    }

    function test_RevertWhen_DeadlinePassed() public {
        ScoremintLib.Prediction[]
            memory predictions = new ScoremintLib.Prediction[](3);

        // Fast forward past deadline
        vm.warp(block.timestamp + 3 days);

        vm.prank(user1);
        vm.expectRevert("Event deadline has passed");
        scoremint.submitPredictions(eventId, predictions);
    }

    function test_RevertWhen_AlreadySubmitted() public {
        ScoremintLib.Prediction[]
            memory predictions = new ScoremintLib.Prediction[](3);

        for (uint256 i = 0; i < 3; i++) {
            predictions[i] = ScoremintLib.Prediction({
                matchId: i,
                outcome: ScoremintLib.PredictionType.HOME_WIN,
                homeScore: 0,
                awayScore: 0
            });
        }

        vm.startPrank(user1);
        scoremint.submitPredictions(eventId, predictions);

        vm.expectRevert("Already submitted predictions for this event");
        scoremint.submitPredictions(eventId, predictions);
        vm.stopPrank();
    }

    function test_RevertWhen_WrongNumberOfPredictions() public {
        // Event has 3 matches, submitting 2 predictions
        ScoremintLib.Prediction[]
            memory predictions = new ScoremintLib.Prediction[](2);

        predictions[0] = ScoremintLib.Prediction({
            matchId: 0,
            outcome: ScoremintLib.PredictionType.HOME_WIN,
            homeScore: 0,
            awayScore: 0
        });

        predictions[1] = ScoremintLib.Prediction({
            matchId: 1,
            outcome: ScoremintLib.PredictionType.AWAY_WIN,
            homeScore: 0,
            awayScore: 0
        });

        vm.prank(user1);
        vm.expectRevert("Must submit predictions for all matches");
        scoremint.submitPredictions(eventId, predictions);
    }

    function test_RevertWhen_InvalidMatchId() public {
        ScoremintLib.Prediction[]
            memory predictions = new ScoremintLib.Prediction[](3);

        predictions[0] = ScoremintLib.Prediction({
            matchId: 0,
            outcome: ScoremintLib.PredictionType.HOME_WIN,
            homeScore: 0,
            awayScore: 0
        });

        predictions[1] = ScoremintLib.Prediction({
            matchId: 1,
            outcome: ScoremintLib.PredictionType.AWAY_WIN,
            homeScore: 0,
            awayScore: 0
        });

        // Match ID 99 is not in the event
        predictions[2] = ScoremintLib.Prediction({
            matchId: 99,
            outcome: ScoremintLib.PredictionType.DRAW,
            homeScore: 0,
            awayScore: 0
        });

        vm.prank(user1);
        vm.expectRevert("Match ID not in event");
        scoremint.submitPredictions(eventId, predictions);
    }

    // =============================================================
    //                   VIEW FUNCTION TESTS
    // =============================================================

    function test_HasUserSubmitted_ReturnsFalse() public {
        assertFalse(scoremint.hasUserSubmitted(eventId, user1));
    }

    function test_GetUserPredictions_RevertsWhenNotSubmitted() public {
        vm.expectRevert("User has not submitted predictions");
        scoremint.getUserPredictions(eventId, user1);
    }

    function test_GetUserPredictions_RevertsWhenEventDoesNotExist() public {
        vm.expectRevert("Event does not exist");
        scoremint.getUserPredictions(999, user1);
    }
}
