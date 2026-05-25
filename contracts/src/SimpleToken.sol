// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SimpleToken — minimal ERC20 deployed via app hub
contract SimpleToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        address owner_
    ) {
        require(bytes(name_).length > 0, "empty name");
        require(bytes(symbol_).length > 0, "empty symbol");
        require(initialSupply_ > 0, "zero supply");
        require(owner_ != address(0), "zero owner");

        name = name_;
        symbol = symbol_;
        owner = owner_;
        totalSupply = initialSupply_;
        balanceOf[owner_] = initialSupply_;

        emit Transfer(address(0), owner_, initialSupply_);
    }
}
