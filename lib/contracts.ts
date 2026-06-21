export const registryAbi = [
  {
    type: "function", name: "registerAgent", stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "bytes32" }, { name: "wallet", type: "address" },
      { name: "profileRootHash", type: "bytes32" }, { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }, { name: "signature", type: "bytes" },
    ], outputs: [],
  },
  { type: "function", name: "nonces", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "walletToAgentId", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "bytes32" }] },
  { type: "error", name: "AgentExists", inputs: [] },
  { type: "error", name: "WalletAlreadyRegistered", inputs: [] },
  { type: "error", name: "InvalidSignature", inputs: [] },
  { type: "error", name: "SignatureExpired", inputs: [] },
  { type: "error", name: "NotAgentOwner", inputs: [] },
  { type: "error", name: "InvalidAgent", inputs: [] },
] as const;

export const tipJarAbi = [
  {
    type: "function", name: "tip", stateMutability: "payable",
    inputs: [{ name: "agent", type: "address" }, { name: "messageRootHash", type: "bytes32" }], outputs: [],
  },
  {
    type: "event", name: "Tipped", anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" }, { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }, { indexed: false, name: "messageRootHash", type: "bytes32" },
    ],
  },
] as const;

export const registrationTypes = {
  Registration: [
    { name: "agentId", type: "bytes32" }, { name: "wallet", type: "address" },
    { name: "profileRootHash", type: "bytes32" }, { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;
