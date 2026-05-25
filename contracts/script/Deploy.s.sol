// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {Hub} from "../src/Hub.sol";
import {BadgeNFT} from "../src/BadgeNFT.sol";

/// @notice Deploy Hub + BadgeNFT to Base / Base Sepolia
/// @dev Requires env: PRIVATE_KEY, RANK_SIGNER
contract Deploy is Script {
    function run() external returns (Hub hub, BadgeNFT badges) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address rankSigner = vm.envAddress("RANK_SIGNER");

        vm.startBroadcast(deployerKey);

        hub = new Hub();
        badges = new BadgeNFT(address(hub), rankSigner);

        vm.stopBroadcast();

        console2.log("Hub deployed at:", address(hub));
        console2.log("BadgeNFT deployed at:", address(badges));
        console2.log("Rank signer:", rankSigner);
    }
}
