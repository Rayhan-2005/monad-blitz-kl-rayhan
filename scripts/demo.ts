import { existsSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { parseEther } from "viem";

const HALLMARK_ADDRESS = "0xd600e0c62dae978e4dab33ca0d1885091f9b6605" as const;
const MONAD_TESTNET_CHAIN_ID = 10143;

loadProjectEnv();

if (process.env.PRIVATE_KEY === undefined || process.env.PRIVATE_KEY.trim() === "") {
  throw new Error("Set PRIVATE_KEY before running the demo script.");
}

const { artifacts, network } = await import("hardhat");

// Connect using the existing Hardhat + viem setup (see hardhat.config.ts)
const connection = await network.create({
  network: "monad",
  chainType: "generic",
});

const { viem } = connection;
const publicClient = await viem.getPublicClient();
const [walletClient] = await viem.getWalletClients();

if (walletClient === undefined) {
  throw new Error("No wallet client found. Check PRIVATE_KEY.");
}

const chainId = await publicClient.getChainId();
if (chainId !== MONAD_TESTNET_CHAIN_ID) {
  throw new Error(`Connected to chain ${chainId}, expected Monad Testnet ${MONAD_TESTNET_CHAIN_ID}.`);
}

console.log("Using wallet:", walletClient.account.address);
console.log("Hallmark contract:", HALLMARK_ADDRESS);

const hallmarkArtifact = await artifacts.readArtifact("Hallmark");
const hallmark = {
  address: HALLMARK_ADDRESS,
  abi: hallmarkArtifact.abi,
} as const;

// Small helper so we can JSON.stringify BigInt values
function toJson(value: unknown) {
  return JSON.stringify(
    value,
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2
  );
}

// ------------------------------------------------------------
// 1) Register a sample luxury asset
// ------------------------------------------------------------
const nextTokenId = (await publicClient.readContract({
  ...hallmark,
  functionName: "nextTokenId",
})) as bigint;

console.log("Next tokenId will be:", nextTokenId.toString());

const registerHash = await walletClient.writeContract({
  ...hallmark,
  functionName: "registerAsset",
  args: [
    "Rolex Daytona",
    "Rolex",
    `SN-${Date.now()}`,
    "Watch",
    "ipfs://example-metadata",
    50_000n,
  ],
});

await publicClient.waitForTransactionReceipt({ hash: registerHash, confirmations: 1 });
console.log("✅ registerAsset tx:", registerHash);

const tokenId = nextTokenId;

// ------------------------------------------------------------
// 2) Request verification with a small MON bounty
// ------------------------------------------------------------
const bounty = parseEther("0.01");

const requestHash = await walletClient.writeContract({
  ...hallmark,
  functionName: "requestVerification",
  args: [tokenId, bounty],
  value: bounty,
});

await publicClient.waitForTransactionReceipt({ hash: requestHash, confirmations: 1 });
console.log("✅ requestVerification tx:", requestHash);

// ------------------------------------------------------------
// 3) Verify the asset with a MON stake
// NOTE: for demo simplicity, the same wallet also verifies.
// Verdict.VERIFIED = 0
// ------------------------------------------------------------
const stake = parseEther("0.02");

const verifyHash = await walletClient.writeContract({
  ...hallmark,
  functionName: "verifyAsset",
  args: [tokenId, 0],
  value: stake,
});

await publicClient.waitForTransactionReceipt({ hash: verifyHash, confirmations: 1 });
console.log("✅ verifyAsset tx:", verifyHash);

// ------------------------------------------------------------
// 4) Read and print getAsset, getVerification, getHistory
// ------------------------------------------------------------
const assetResult = await publicClient.readContract({
  ...hallmark,
  functionName: "getAsset",
  args: [tokenId],
});

const verificationResult = await publicClient.readContract({
  ...hallmark,
  functionName: "getVerification",
  args: [tokenId],
});

const historyResult = await publicClient.readContract({
  ...hallmark,
  functionName: "getHistory",
  args: [tokenId],
});

console.log("\n=== getAsset(tokenId) ===\n" + toJson(assetResult));
console.log("\n=== getVerification(tokenId) ===\n" + toJson(verificationResult));
console.log("\n=== getHistory(tokenId) ===\n" + toJson(historyResult));

function loadProjectEnv() {
  if (!existsSync(".env")) {
    return;
  }

  loadEnvFile(".env");

  if (process.env.PRIVATE_KEY !== undefined && process.env.PRIVATE_KEY !== "") {
    return;
  }

  const bytes = readFileSync(".env");
  const text =
    bytes[0] === 0xff && bytes[1] === 0xfe
      ? bytes.toString("utf16le")
      : bytes.toString("utf8");
  const privateKeyMatch = text.match(/^\s*PRIVATE_KEY\s*=\s*(.+?)\s*$/m);

  if (privateKeyMatch !== null) {
    process.env.PRIVATE_KEY = privateKeyMatch[1]
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}
