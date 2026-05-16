import { existsSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";

loadProjectEnv();

const privateKey = process.env.PRIVATE_KEY?.trim();
const accounts =
  privateKey === undefined || privateKey === ""
    ? []
    : [privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`];

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

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    monad: {
      type: "http",
      chainType: "generic",
      url: "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts,
    },
  },
});
