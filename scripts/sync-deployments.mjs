#!/usr/bin/env node
/**
 * Sync latest Foundry broadcast addresses into frontend config files.
 * Usage: node scripts/sync-deployments.mjs [base|base_sepolia]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const network = process.argv[2] ?? "base_sepolia";
const chainIds = { base: 8453, base_sepolia: 84532 };
const chainId = chainIds[network];

if (!chainId) {
  console.error(`Unknown network: ${network}`);
  process.exit(1);
}

const broadcastDir = path.join(
  root,
  "broadcast",
  "Deploy.s.sol",
  String(chainId),
);

const runLatest = path.join(broadcastDir, "run-latest.json");
if (!fs.existsSync(runLatest)) {
  console.error(`Broadcast file not found: ${runLatest}`);
  console.error("Run scripts/deploy-contracts.sh first.");
  process.exit(1);
}

const broadcast = JSON.parse(fs.readFileSync(runLatest, "utf8"));
const txs = broadcast.transactions ?? [];

let hubAddress;
let badgeAddress;

for (const tx of txs) {
  if (tx.contractName === "Hub" && tx.contractAddress) {
    hubAddress = tx.contractAddress;
  }
  if (tx.contractName === "BadgeNFT" && tx.contractAddress) {
    badgeAddress = tx.contractAddress;
  }
}

if (!hubAddress || !badgeAddress) {
  console.error("Could not find Hub / BadgeNFT addresses in broadcast file.");
  process.exit(1);
}

const contractTs = path.join(root, "src/config/contract.ts");
const badgeContractTs = path.join(root, "src/config/badgeContract.ts");
const deploymentsJson = path.join(root, "deployments", `${network}.json`);

const hubRe =
  /export const HUB_CONTRACT_ADDRESS: `0x\$\{string\}` =\s*\n\s*"0x[^"]*";/;
const badgeRe =
  /export const BADGE_NFT_ADDRESS: `0x\$\{string\}` =\s*\n\s*"0x[^"]*";/;

let contractSrc = fs.readFileSync(contractTs, "utf8");
let badgeSrc = fs.readFileSync(badgeContractTs, "utf8");

contractSrc = contractSrc.replace(
  hubRe,
  `export const HUB_CONTRACT_ADDRESS: \`0x\${string}\` =\n  "${hubAddress}";`,
);
badgeSrc = badgeSrc.replace(
  badgeRe,
  `export const BADGE_NFT_ADDRESS: \`0x\${string}\` =\n  "${badgeAddress}";`,
);

fs.writeFileSync(contractTs, contractSrc);
fs.writeFileSync(badgeContractTs, badgeSrc);

fs.mkdirSync(path.dirname(deploymentsJson), { recursive: true });
fs.writeFileSync(
  deploymentsJson,
  JSON.stringify(
    {
      network,
      chainId,
      hub: hubAddress,
      badgeNft: badgeAddress,
      syncedAt: new Date().toISOString(),
    },
    null,
    2,
  ) + "\n",
);

console.log("Synced deployment addresses:");
console.log("  Hub:      ", hubAddress);
console.log("  BadgeNFT: ", badgeAddress);
console.log("");
console.log("Updated:");
console.log(" ", path.relative(root, contractTs));
console.log(" ", path.relative(root, badgeContractTs));
console.log(" ", path.relative(root, deploymentsJson));

if (broadcast.receipts?.[0]?.blockNumber) {
  const block = broadcast.receipts[0].blockNumber;
  console.log("");
  console.log(`Optional — add to .env.local for faster leaderboard:`);
  console.log(`HUB_DEPLOY_FROM_BLOCK=${block}`);
}
