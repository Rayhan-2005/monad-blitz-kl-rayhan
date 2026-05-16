export const CONTRACT_ADDRESS = "0xd600e0c62dae978e4dab33ca0d1885091f9b6605" as `0x${string}`;
export const CONTRACT_ABI = [
  {
    type: "function",
    name: "registerAsset",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "brand", type: "string" },
      { name: "serialNumber", type: "string" },
      { name: "assetType", type: "string" },
      { name: "estimatedValue", type: "uint256" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getAsset",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "asset",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "brand", type: "string" },
          { name: "serialNumber", type: "string" },
          { name: "assetType", type: "string" },
          { name: "estimatedValue", type: "uint256" },
          { name: "originalOwner", type: "address" },
          { name: "registeredAt", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getHistory",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "history",
        type: "tuple[]",
        components: [
          { name: "eventType", type: "string" },
          { name: "description", type: "string" },
          { name: "actor", type: "address" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "requestVerification",
    stateMutability: "payable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "verifyAsset",
    stateMutability: "payable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "openDispute",
    stateMutability: "payable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getVerification",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "verification",
        type: "tuple",
        components: [
          { name: "requestedBy", type: "address" },
          { name: "bountyAmount", type: "uint256" },
          { name: "verifier", type: "address" },
          { name: "stakeAmount", type: "uint256" },
          { name: "isVerified", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getDispute",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "dispute",
        type: "tuple",
        components: [
          { name: "isDisputed", type: "bool" },
          { name: "disputeOpener", type: "address" },
          { name: "deposit", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getReputationScore",
    stateMutability: "view",
    inputs: [{ name: "verifier", type: "address" }],
    outputs: [{ name: "score", type: "uint256" }],
  },
] as const;
