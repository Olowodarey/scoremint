// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test, console} from "forge-std/Test.sol";
import {ScoremintLib} from "../src/ScoremintLib.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {ScoremintTestable} from "./ScoremintTestable.sol";

contract LeaderboardTest is Test {
    ScoremintTestable public scoremint;
    ERC20Mock public prizeToken;

    address public owner = address(1);
    address public creator = address(2);

    // 10 test users
    address public user1 = address(100);
    address public user2 = address(101);
    address public user3 = address(102);
    address public user4 = address(103);
    address public user5 = address(104);
    address public user6 = address(105);
    address public user7 = address(106);
    address public user8 = address(107);
    address public user9 = address(108);
    address public user10 = address(109);

    uint256 public eventId;
    uint256[] public matchIds;

    function setUp() public {
        // Deploy contracts
        prizeToken = new ERC20Mock();
        scoremint = new ScoremintTestable();
        scoremint.initialize(owner);

        // Set prize token
        vm.prank(owner);
        scoremint.setPrizeToken(address(prizeToken));

        // Create test matches
        createMatches();

        // Create a test event
        eventId = createTestEvent();

        // Register users with usernames
        registerUsers();
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

    function registerUsers() internal {
        vm.prank(user1);
        scoremint.registerUser("Alice");

        vm.prank(user2);
        scoremint.registerUser("Bob");

        vm.prank(user3);
        scoremint.registerUser("Charlie");

        vm.prank(user4);
        scoremint.registerUser("David");

        vm.prank(user5);
        scoremint.registerUser("Eve");

        vm.prank(user6);
        scoremint.registerUser("Frank");

        vm.prank(user7);
        scoremint.registerUser("Grace");

        vm.prank(user8);
        scoremint.registerUser("Henry");

        vm.prank(user9);
        scoremint.registerUser("Ivy");

        vm.prank(user10);
        scoremint.registerUser("Jack");
    }

    function submitPredictionsForUser(address user) internal {
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

        vm.prank(user);
        scoremint.submitPredictions(eventId, predictions);
    }

    // Helper function to set scores (simulating event finalization)
    function setUserScore(address user, uint256 score) internal {
        scoremint.setUserPredictionScore(eventId, user, score);
    }

    // =============================================================
    //                   LEADERBOARD TESTS
    // =============================================================

    function test_LeaderboardWith10Users() public {
        // Submit predictions for all 10 users
        submitPredictionsForUser(user1);
        submitPredictionsForUser(user2);
        submitPredictionsForUser(user3);
        submitPredictionsForUser(user4);
        submitPredictionsForUser(user5);
        submitPredictionsForUser(user6);
        submitPredictionsForUser(user7);
        submitPredictionsForUser(user8);
        submitPredictionsForUser(user9);
        submitPredictionsForUser(user10);

        // Verify participant count
        uint256 participantCount = scoremint.getEventParticipantCount(eventId);
        assertEq(participantCount, 10, "Should have 10 participants");

        // Set different scores for each user
        setUserScore(user1, 10); // Alice - 1st
        setUserScore(user2, 8); // Bob - 2nd
        setUserScore(user3, 8); // Charlie - 2nd (tie)
        setUserScore(user4, 7); // David - 4th
        setUserScore(user5, 6); // Eve - 5th
        setUserScore(user6, 6); // Frank - 5th (tie)
        setUserScore(user7, 5); // Grace - 7th
        setUserScore(user8, 3); // Henry - 8th
        setUserScore(user9, 2); // Ivy - 9th
        setUserScore(user10, 0); // Jack - 10th

        // Get leaderboard
        ScoremintLib.LeaderboardEntry[] memory leaderboard = scoremint
            .getEventLeaderboard(eventId);

        // Verify leaderboard length
        assertEq(leaderboard.length, 10, "Leaderboard should have 10 entries");

        // Verify sorting (scores should be in descending order)
        assertEq(leaderboard[0].score, 10, "1st place should have 10 points");
        assertEq(leaderboard[1].score, 8, "2nd place should have 8 points");
        assertEq(
            leaderboard[2].score,
            8,
            "3rd position should have 8 points (tie)"
        );
        assertEq(leaderboard[3].score, 7, "4th position should have 7 points");
        assertEq(leaderboard[9].score, 0, "Last place should have 0 points");

        // Verify user addresses
        assertEq(
            leaderboard[0].user,
            user1,
            "1st place should be user1 (Alice)"
        );

        // Verify usernames
        assertEq(
            leaderboard[0].username,
            "Alice",
            "1st place username should be Alice"
        );

        // Verify ranks
        assertEq(leaderboard[0].rank, 1, "1st place rank should be 1");
        assertEq(leaderboard[1].rank, 2, "2nd place rank should be 2");
        assertEq(leaderboard[2].rank, 2, "Tied 2nd place rank should be 2");
        assertEq(
            leaderboard[3].rank,
            4,
            "4th place rank should be 4 (after tie)"
        );

        // Print leaderboard for visual verification
        console.log("\n=== LEADERBOARD ===");
        for (uint256 i = 0; i < leaderboard.length; i++) {
            console.log("Rank:", leaderboard[i].rank);
            console.log("User:", leaderboard[i].username);
            console.log("Score:", leaderboard[i].score);
            console.log("---");
        }
    }

    function test_GetUserRankInEvent() public {
        // Submit predictions for all users
        submitPredictionsForUser(user1);
        submitPredictionsForUser(user2);
        submitPredictionsForUser(user3);
        submitPredictionsForUser(user4);
        submitPredictionsForUser(user5);
        submitPredictionsForUser(user6);
        submitPredictionsForUser(user7);
        submitPredictionsForUser(user8);
        submitPredictionsForUser(user9);
        submitPredictionsForUser(user10);

        // Set scores
        setUserScore(user1, 10);
        setUserScore(user2, 8);
        setUserScore(user3, 8);
        setUserScore(user4, 7);
        setUserScore(user5, 6);

        // Test getUserRankInEvent
        (uint256 rank1, uint256 score1) = scoremint.getUserRankInEvent(
            eventId,
            user1
        );
        assertEq(rank1, 1, "User1 should be rank 1");
        assertEq(score1, 10, "User1 score should be 10");

        (uint256 rank2, uint256 score2) = scoremint.getUserRankInEvent(
            eventId,
            user2
        );
        assertEq(rank2, 2, "User2 should be rank 2");
        assertEq(score2, 8, "User2 score should be 8");

        (uint256 rank3, uint256 score3) = scoremint.getUserRankInEvent(
            eventId,
            user3
        );
        assertEq(rank3, 2, "User3 should be rank 2 (tied with user2)");
        assertEq(score3, 8, "User3 score should be 8");

        (uint256 rank4, uint256 score4) = scoremint.getUserRankInEvent(
            eventId,
            user4
        );
        assertEq(rank4, 4, "User4 should be rank 4 (after tie)");
        assertEq(score4, 7, "User4 score should be 7");
    }

    function test_GetEventParticipantScores() public {
        // Submit predictions
        submitPredictionsForUser(user1);
        submitPredictionsForUser(user2);
        submitPredictionsForUser(user3);

        // Set scores
        setUserScore(user1, 10);
        setUserScore(user2, 8);
        setUserScore(user3, 6);

        // Get participant scores
        (address[] memory participants, uint256[] memory scores) = scoremint
            .getEventParticipantScores(eventId);

        assertEq(participants.length, 3, "Should have 3 participants");
        assertEq(scores.length, 3, "Should have 3 scores");

        // Find each user in the results
        bool foundUser1 = false;
        bool foundUser2 = false;
        bool foundUser3 = false;

        for (uint256 i = 0; i < participants.length; i++) {
            if (participants[i] == user1) {
                assertEq(scores[i], 10, "User1 score should be 10");
                foundUser1 = true;
            } else if (participants[i] == user2) {
                assertEq(scores[i], 8, "User2 score should be 8");
                foundUser2 = true;
            } else if (participants[i] == user3) {
                assertEq(scores[i], 6, "User3 score should be 6");
                foundUser3 = true;
            }
        }

        assertTrue(foundUser1, "Should find user1");
        assertTrue(foundUser2, "Should find user2");
        assertTrue(foundUser3, "Should find user3");
    }

    function test_GetEventParticipants() public {
        // Submit predictions
        submitPredictionsForUser(user1);
        submitPredictionsForUser(user2);
        submitPredictionsForUser(user3);

        address[] memory participants = scoremint.getEventParticipants(eventId);

        assertEq(participants.length, 3, "Should have 3 participants");
        assertEq(participants[0], user1, "First participant should be user1");
        assertEq(participants[1], user2, "Second participant should be user2");
        assertEq(participants[2], user3, "Third participant should be user3");
    }

    function test_EmptyLeaderboard() public {
        // Create a new event with no participants
        vm.prank(creator);
        scoremint.createEvent(
            "Empty Event",
            uint64(block.timestamp + 2 days),
            ScoremintLib.PredictionMode.OUTCOME,
            matchIds,
            ScoremintLib.EventType.FREE,
            0
        );
        uint256 emptyEventId = 1;

        ScoremintLib.LeaderboardEntry[] memory leaderboard = scoremint
            .getEventLeaderboard(emptyEventId);

        assertEq(
            leaderboard.length,
            0,
            "Empty event should have empty leaderboard"
        );
    }

    function test_AllUsersWithSameScore() public {
        // Submit predictions for 5 users
        submitPredictionsForUser(user1);
        submitPredictionsForUser(user2);
        submitPredictionsForUser(user3);
        submitPredictionsForUser(user4);
        submitPredictionsForUser(user5);

        // Set all users to same score
        setUserScore(user1, 5);
        setUserScore(user2, 5);
        setUserScore(user3, 5);
        setUserScore(user4, 5);
        setUserScore(user5, 5);

        ScoremintLib.LeaderboardEntry[] memory leaderboard = scoremint
            .getEventLeaderboard(eventId);

        // All users should have rank 1
        for (uint256 i = 0; i < leaderboard.length; i++) {
            assertEq(leaderboard[i].rank, 1, "All users should have rank 1");
            assertEq(leaderboard[i].score, 5, "All users should have score 5");
        }
    }
}
