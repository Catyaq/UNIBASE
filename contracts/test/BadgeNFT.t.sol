// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Hub} from "../src/Hub.sol";
import {BadgeNFT} from "../src/BadgeNFT.sol";

contract BadgeNFTTest is Test {
    Hub internal hub;
    BadgeNFT internal badges;
    uint256 internal aliceKey = 0xA11CE;
    address internal alice;
    uint256 internal rankSignerKey = 0xBEEF;
    address internal rankSigner;

    function setUp() public {
        alice = vm.addr(aliceKey);
        rankSigner = vm.addr(rankSignerKey);
        hub = new Hub();
        hub.setTreasury(alice);
        badges = new BadgeNFT(address(hub), rankSigner);
        vm.deal(alice, 1 ether);
    }

    function test_mintGmBadge_afterThreshold() public {
        _gmMany(alice, 10);

        assertTrue(badges.eligibility(alice, 1));

        vm.prank(alice);
        badges.mint(1);

        assertTrue(badges.hasMintedType(alice, 1));
        assertEq(badges.balanceOf(alice), 1);
    }

    function test_mintPointsBadge() public {
        _deployForPoints(alice);

        assertGe(hub.points(alice), 100);
        assertTrue(badges.eligibility(alice, 7));

        vm.prank(alice);
        badges.mint(7);

        assertTrue(badges.hasMintedType(alice, 7));
    }

    function test_mintRankBadge_withSignature() public {
        uint256 badgeType = 10;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory sig = _signRank(alice, badgeType, deadline);

        vm.prank(alice);
        badges.mintRankBadge(badgeType, deadline, sig);

        assertTrue(badges.hasMintedType(alice, badgeType));
    }

    function test_revert_rankBadge_invalidSignature() public {
        uint256 badgeType = 10;
        uint256 deadline = block.timestamp + 1 hours;

        bytes32 digest = keccak256(abi.encodePacked(alice, badgeType, deadline));
        bytes32 ethHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", digest)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(rankSignerKey + 1, ethHash);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.prank(alice);
        vm.expectRevert(BadgeNFT.InvalidSignature.selector);
        badges.mintRankBadge(badgeType, deadline, sig);
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

    function _deployForPoints(address user) internal {
        vm.prank(user);
        hub.deployToken("A", "A", 100 ether);

        vm.startBroadcast(aliceKey);
        hub.deployToken{value: hub.DEPLOY_FEE()}("B", "B", 100 ether);
        hub.deployToken{value: hub.DEPLOY_FEE()}("C", "C", 100 ether);
        vm.stopBroadcast();
    }

    function _signRank(
        address user,
        uint256 badgeType,
        uint256 deadline
    ) internal view returns (bytes memory) {
        bytes32 digest = keccak256(abi.encodePacked(user, badgeType, deadline));
        bytes32 ethHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", digest)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(rankSignerKey, ethHash);
        return abi.encodePacked(r, s, v);
    }
}
