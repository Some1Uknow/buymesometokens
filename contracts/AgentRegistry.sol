// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

contract AgentRegistry is EIP712 {
    struct Agent {
        address wallet;
        bytes32 profileRootHash;
        bool active;
    }

    bytes32 public constant REGISTRATION_TYPEHASH = keccak256(
        "Registration(bytes32 agentId,address wallet,bytes32 profileRootHash,uint256 nonce,uint256 deadline)"
    );

    mapping(bytes32 => Agent) public agents;
    mapping(address => bytes32) public walletToAgentId;
    mapping(address => uint256) public nonces;

    event AgentRegistered(bytes32 indexed agentId, address indexed wallet, bytes32 profileRootHash);
    event AgentUpdated(bytes32 indexed agentId, bytes32 newProfileRootHash);
    event AgentStatusChanged(bytes32 indexed agentId, bool active);

    error AgentExists();
    error WalletAlreadyRegistered();
    error InvalidSignature();
    error SignatureExpired();
    error NotAgentOwner();
    error InvalidAgent();

    constructor() EIP712("BuyMeSomeTokens Registry", "1") {}

    function registerAgent(
        bytes32 agentId,
        address wallet,
        bytes32 profileRootHash,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (wallet == address(0) || agentId == bytes32(0) || profileRootHash == bytes32(0)) revert InvalidAgent();
        if (agents[agentId].wallet != address(0)) revert AgentExists();
        if (walletToAgentId[wallet] != bytes32(0)) revert WalletAlreadyRegistered();
        if (block.timestamp > deadline) revert SignatureExpired();
        if (nonce != nonces[wallet]++) revert InvalidSignature();

        bytes32 structHash = keccak256(abi.encode(
            REGISTRATION_TYPEHASH, agentId, wallet, profileRootHash, nonce, deadline
        ));
        if (!SignatureChecker.isValidSignatureNow(wallet, _hashTypedDataV4(structHash), signature)) {
            revert InvalidSignature();
        }

        agents[agentId] = Agent(wallet, profileRootHash, true);
        walletToAgentId[wallet] = agentId;
        emit AgentRegistered(agentId, wallet, profileRootHash);
    }

    function updateProfile(bytes32 agentId, bytes32 newRootHash) external {
        Agent storage agent = agents[agentId];
        if (agent.wallet != msg.sender) revert NotAgentOwner();
        if (newRootHash == bytes32(0)) revert InvalidAgent();
        agent.profileRootHash = newRootHash;
        emit AgentUpdated(agentId, newRootHash);
    }

    function setActive(bytes32 agentId, bool active) external {
        Agent storage agent = agents[agentId];
        if (agent.wallet != msg.sender) revert NotAgentOwner();
        agent.active = active;
        emit AgentStatusChanged(agentId, active);
    }

    function isActiveWallet(address wallet) external view returns (bool) {
        bytes32 agentId = walletToAgentId[wallet];
        return agentId != bytes32(0) && agents[agentId].active;
    }
}
