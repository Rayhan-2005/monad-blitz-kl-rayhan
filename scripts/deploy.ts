import { existsSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { formatEther } from "viem";

const MONAD_TESTNET_CHAIN_ID = 10143;

loadProjectEnv();

if (process.env.PRIVATE_KEY === undefined || process.env.PRIVATE_KEY.trim() === "") {
  throw new Error("Set PRIVATE_KEY before deploying to Monad Testnet.");
}

const { artifacts, network } = await import("hardhat");

const connection = await network.create({
  network: "monad",
  chainType: "generic",
});

const { viem } = connection;
const publicClient = await viem.getPublicClient();
const [deployer] = await viem.getWalletClients();

if (deployer === undefined) {
  throw new Error("No deployer account found. Check PRIVATE_KEY in hardhat.config.ts.");
}

const chainId = await publicClient.getChainId();

if (chainId !== MONAD_TESTNET_CHAIN_ID) {
  throw new Error(`Connected to chain ${chainId}, expected Monad Testnet ${MONAD_TESTNET_CHAIN_ID}.`);
}

const deployerAddress = deployer.account.address;
const deployerBalance = await publicClient.getBalance({ address: deployerAddress });

console.log("Deploying Hallmark to Monad Testnet");
console.log("Deployer:", deployerAddress);
console.log("Balance:", formatEther(deployerBalance), "MON");

const artifact = await artifacts.readArtifact("Hallmark");
const deploymentTxHash = await deployer.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
});

console.log("Deployment transaction:", deploymentTxHash);

const receipt = await publicClient.waitForTransactionReceipt({
  hash: deploymentTxHash,
  confirmations: 1,
});

if (receipt.status !== "success" || receipt.contractAddress === null) {
  throw new Error(`Deployment failed in transaction ${deploymentTxHash}.`);
}

console.log("Hallmark deployed at:", receipt.contractAddress);

function loadProjectEnv() {
  if (!existsSync(".env")) {
    return;
  }

  loadEnvFile(".env");

  if (process.env.PRIVATE_KEY !== undefined && process.env.PRIVATE_KEY !== "") {
    return;
  }

  const bytes = readFileSync(".env");
  const text = bytes[0] === 0xff && bytes[1] === 0xfe ? bytes.toString("utf16le") : bytes.toString("utf8");
  const privateKeyMatch = text.match(/^\s*PRIVATE_KEY\s*=\s*(.+?)\s*$/m);

  if (privateKeyMatch !== null) {
    process.env.PRIVATE_KEY = privateKeyMatch[1].trim().replace(/^["']|["']$/g, "");
  }
}
