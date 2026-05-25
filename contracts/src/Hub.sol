// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SimpleToken} from "./SimpleToken.sol";

/// @title Hub — example onchain actions on Base (template)
contract Hub {
    uint256 public constant POINTS_PER_FREE_GM = 10;
    uint256 public constant POINTS_PER_PAID_GM = 20;
    uint256 public constant FREE_GM_PER_DAY = 3;
    uint256 public constant GM_FEE = 0.0001 ether;
    uint256 public constant MIN_INTERVAL = 5;

    uint256 public constant POINTS_PER_FREE_DEPLOY = 20;
    uint256 public constant POINTS_PER_PAID_DEPLOY = 40;
    uint256 public constant DEPLOY_FEE = 0.0001 ether;

    uint256 public totalGms;
    uint256 public totalDeploys;
    address public owner;
    address public treasury;

    mapping(address => uint256) public lastGmAt;
    mapping(address => uint256) public lastGmDay;
    mapping(address => uint256) public freeGmsUsedToday;
    mapping(address => uint256) public gmCount;
    mapping(address => uint256) public deployCount;
    mapping(address => bool) public freeDeployUsed;
    mapping(address => uint256) public points;

    event GM(
        address indexed user,
        uint256 gmCount,
        uint256 points,
        bool paid,
        uint256 timestamp
    );

    event TokenDeployed(
        address indexed user,
        address indexed token,
        string name,
        string symbol,
        uint256 initialSupply,
        bool paid,
        uint256 pointsEarned,
        uint256 totalPoints,
        uint256 timestamp
    );

    error GmTooSoon(uint256 availableAt);
    error UnexpectedPayment();
    error IncorrectFee(uint256 required);
    error EmptyString();
    error ZeroSupply();

    constructor() {
        owner = msg.sender;
        treasury = msg.sender;
    }

    function setTreasury(address newTreasury) external {
        require(msg.sender == owner, "not owner");
        require(newTreasury != address(0), "zero treasury");
        treasury = newTreasury;
    }

    function gm() external payable {
        _gm(msg.sender);
    }

    function gmTo(address recipient) external payable {
        require(recipient != address(0) && recipient != msg.sender, "invalid recipient");
        _gm(recipient);
    }

    function deployToken(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply
    ) external payable returns (address token) {
        if (bytes(name).length == 0 || bytes(symbol).length == 0) {
            revert EmptyString();
        }
        if (initialSupply == 0) revert ZeroSupply();

        bool isFree = !freeDeployUsed[msg.sender];
        uint256 pointsEarned;

        if (isFree) {
            if (msg.value != 0) revert UnexpectedPayment();
            freeDeployUsed[msg.sender] = true;
            pointsEarned = POINTS_PER_FREE_DEPLOY;
        } else {
            if (msg.value != DEPLOY_FEE) revert IncorrectFee(DEPLOY_FEE);
            (bool sent, ) = treasury.call{value: msg.value}("");
            require(sent, "treasury transfer failed");
            pointsEarned = POINTS_PER_PAID_DEPLOY;
        }

        SimpleToken deployed = new SimpleToken(name, symbol, initialSupply, msg.sender);
        token = address(deployed);

        deployCount[msg.sender] += 1;
        totalDeploys += 1;
        points[msg.sender] += pointsEarned;

        emit TokenDeployed(
            msg.sender,
            token,
            name,
            symbol,
            initialSupply,
            !isFree,
            pointsEarned,
            points[msg.sender],
            block.timestamp
        );
    }

    function freeGmsRemaining(address user) external view returns (uint256) {
        uint256 day = _dayId();
        uint256 used = lastGmDay[user] == day ? freeGmsUsedToday[user] : 0;
        if (used >= FREE_GM_PER_DAY) return 0;
        return FREE_GM_PER_DAY - used;
    }

    function freeDeployAvailable(address user) external view returns (bool) {
        return !freeDeployUsed[user];
    }

    function _dayId() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }

    function _gm(address user) internal {
        uint256 day = _dayId();
        if (lastGmDay[user] != day) {
            freeGmsUsedToday[user] = 0;
        }
        lastGmDay[user] = day;

        uint256 last = lastGmAt[user];
        if (last != 0 && block.timestamp < last + MIN_INTERVAL) {
            revert GmTooSoon(last + MIN_INTERVAL);
        }

        bool isFree = freeGmsUsedToday[user] < FREE_GM_PER_DAY;
        if (isFree) {
            if (msg.value != 0) revert UnexpectedPayment();
            freeGmsUsedToday[user] += 1;
        } else {
            if (msg.value != GM_FEE) revert IncorrectFee(GM_FEE);
            (bool sent, ) = treasury.call{value: msg.value}("");
            require(sent, "treasury transfer failed");
        }

        uint256 pointsEarned = isFree ? POINTS_PER_FREE_GM : POINTS_PER_PAID_GM;

        lastGmAt[user] = block.timestamp;
        gmCount[user] += 1;
        points[user] += pointsEarned;
        totalGms += 1;

        emit GM(user, gmCount[user], points[user], !isFree, block.timestamp);
    }
}
