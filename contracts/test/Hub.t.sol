// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Hub} from "../src/Hub.sol";

contract HubTest is Test {
    Hub internal hub;
    uint256 internal aliceKey = 0xA11CE;
    address internal alice;

    function setUp() public {
        alice = vm.addr(aliceKey);
        hub = new Hub();
        hub.setTreasury(alice);
        vm.deal(alice, 1 ether);
    }

    function test_freeGm_awardsPoints() public {
        vm.prank(alice);
        hub.gm();

        assertEq(hub.gmCount(alice), 1);
        assertEq(hub.points(alice), hub.POINTS_PER_FREE_GM());
        assertEq(hub.totalGms(), 1);
    }

    function test_paidGm_afterFreeQuota() public {
        while (hub.freeGmsRemaining(alice) > 0) {
            vm.prank(alice);
            hub.gm();
            vm.warp(block.timestamp + hub.MIN_INTERVAL());
        }

        vm.startBroadcast(aliceKey);
        hub.gm{value: hub.GM_FEE()}();
        vm.stopBroadcast();

        assertEq(hub.gmCount(alice), hub.FREE_GM_PER_DAY() + 1);
        assertEq(
            hub.points(alice),
            hub.FREE_GM_PER_DAY() * hub.POINTS_PER_FREE_GM() +
                hub.POINTS_PER_PAID_GM()
        );
    }

    function test_freeRemaining_afterThreeGms() public {
        while (hub.freeGmsRemaining(alice) > 0) {
            vm.prank(alice);
            hub.gm();
            vm.warp(block.timestamp + hub.MIN_INTERVAL());
        }
        assertEq(hub.freeGmsRemaining(alice), 0);
    }

    function _gmMany(address user, uint256 times) internal {
        uint256 userKey = user == alice ? aliceKey : 0;
        for (uint256 i = 0; i < times; i++) {
            if (hub.freeGmsRemaining(user) > 0) {
                vm.prank(user);
                hub.gm();
            } else {
                require(userKey != 0, "unknown user key");
                vm.startBroadcast(userKey);
                hub.gm{value: hub.GM_FEE()}();
                vm.stopBroadcast();
            }
            vm.warp(block.timestamp + hub.MIN_INTERVAL());
        }
    }

    function test_freeDeploy_awardsPoints() public {
        vm.prank(alice);
        address token = hub.deployToken("Test", "TST", 1_000 ether);

        assertTrue(token != address(0));
        assertEq(hub.deployCount(alice), 1);
        assertEq(hub.points(alice), hub.POINTS_PER_FREE_DEPLOY());
        assertFalse(hub.freeDeployAvailable(alice));
    }

    function test_revert_gmTooSoon() public {
        vm.startPrank(alice);
        hub.gm();
        vm.expectRevert(
            abi.encodeWithSelector(Hub.GmTooSoon.selector, block.timestamp + hub.MIN_INTERVAL())
        );
        hub.gm();
        vm.stopPrank();
    }
}
