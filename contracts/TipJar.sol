// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAgentRegistry {
    function isActiveWallet(address wallet) external view returns (bool);
}

contract TipJar is ReentrancyGuard {
    IAgentRegistry public immutable registry;

    event Tipped(address indexed from, address indexed to, uint256 amount, bytes32 messageRootHash);

    error EmptyTip();
    error AgentNotActive();

    constructor(address registryAddress) {
        registry = IAgentRegistry(registryAddress);
    }

    function tip(address payable agent, bytes32 messageRootHash) external payable nonReentrant {
        if (msg.value == 0) revert EmptyTip();
        if (!registry.isActiveWallet(agent)) revert AgentNotActive();
        Address.sendValue(agent, msg.value);
        emit Tipped(msg.sender, agent, msg.value, messageRootHash);
    }
}
