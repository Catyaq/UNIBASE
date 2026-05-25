import type { Address } from "viem";

import {
  HUB_CONTRACT_ADDRESS,
  HUB_DEPLOY_FROM_BLOCK,
  hubAbi,
  isContractConfigured,
} from "@/config/contract";
import { createBasePublicClient, type BasePublicClient } from "@/lib/baseRpc";
import {
  buildLeaderboardFromEvents,
  withRanks,
  type LeaderboardRow,
} from "@/lib/leaderboard";

/** Wider chunks = fewer eth_getLogs calls (public RPC rate limits) */
const LOG_CHUNK_SIZE = 10_000n;
const CHUNK_DELAY_MS = 80;
const MAX_CHUNK_RETRIES = 3;

function hubDeployFromBlock(): bigint {
  const raw = process.env.HUB_DEPLOY_FROM_BLOCK;
  if (raw) {
    try {
      return BigInt(raw);
    } catch {
      /* fall through */
    }
  }
  return HUB_DEPLOY_FROM_BLOCK;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /rate limit|429|too many requests|exceeded/i.test(msg);
}

function friendlyRpcError(error: unknown): string {
  if (isRateLimitError(error)) {
    return "Base RPC rate limit — add BASE_RPC_URL (Alchemy/Infura) in Vercel env, then retry.";
  }
  if (error instanceof Error) return error.message;
  return "Failed to load leaderboard";
}

async function getLogsWithRetry<T>(
  fn: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_CHUNK_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_CHUNK_RETRIES - 1) {
        await sleep(300 * (attempt + 1));
      }
    }
  }
  throw lastError;
}

async function fetchHubEventsChunked(
  client: BasePublicClient,
  fromBlock: bigint,
) {
  const latest = await client.getBlockNumber();
  const start = fromBlock > latest ? latest : fromBlock;

  const gmLogs: Awaited<
    ReturnType<BasePublicClient["getContractEvents"]>
  > = [];
  const deployLogs: Awaited<
    ReturnType<BasePublicClient["getContractEvents"]>
  > = [];

  for (let chunkStart = start; chunkStart <= latest; chunkStart += LOG_CHUNK_SIZE) {
    const chunkEnd =
      chunkStart + LOG_CHUNK_SIZE - 1n > latest
        ? latest
        : chunkStart + LOG_CHUNK_SIZE - 1n;

    const [gmChunk, deployChunk] = await getLogsWithRetry(() =>
      Promise.all([
        client.getContractEvents({
          address: HUB_CONTRACT_ADDRESS,
          abi: hubAbi,
          eventName: "GM",
          fromBlock: chunkStart,
          toBlock: chunkEnd,
        }),
        client.getContractEvents({
          address: HUB_CONTRACT_ADDRESS,
          abi: hubAbi,
          eventName: "TokenDeployed",
          fromBlock: chunkStart,
          toBlock: chunkEnd,
        }),
      ]),
    );

    gmLogs.push(...gmChunk);
    deployLogs.push(...deployChunk);

    if (chunkEnd < latest) {
      await sleep(CHUNK_DELAY_MS);
    }
  }

  return { gmLogs, deployLogs };
}

export async function fetchLeaderboard(): Promise<{
  configured: boolean;
  entries: LeaderboardRow[];
}> {
  if (!isContractConfigured) {
    return { configured: false, entries: [] };
  }

  try {
    const client = createBasePublicClient();
    const fromBlock = hubDeployFromBlock();
    const { gmLogs, deployLogs } = await fetchHubEventsChunked(
      client,
      fromBlock,
    );

    const entries = withRanks(
      buildLeaderboardFromEvents(
        gmLogs as Parameters<typeof buildLeaderboardFromEvents>[0],
        deployLogs as Parameters<typeof buildLeaderboardFromEvents>[1],
      ),
    );

    if (entries.length > 0) {
      const reads = await client.multicall({
        contracts: entries.flatMap((entry) => [
          {
            address: HUB_CONTRACT_ADDRESS,
            abi: hubAbi,
            functionName: "points" as const,
            args: [entry.address as Address] as const,
          },
          {
            address: HUB_CONTRACT_ADDRESS,
            abi: hubAbi,
            functionName: "gmCount" as const,
            args: [entry.address as Address] as const,
          },
          {
            address: HUB_CONTRACT_ADDRESS,
            abi: hubAbi,
            functionName: "deployCount" as const,
            args: [entry.address as Address] as const,
          },
        ]),
      });

      for (let i = 0; i < entries.length; i++) {
        const points = reads[i * 3]?.result;
        const gmCount = reads[i * 3 + 1]?.result;
        const deployCount = reads[i * 3 + 2]?.result;
        if (points != null) entries[i].points = points.toString();
        if (gmCount != null) entries[i].gmCount = gmCount.toString();
        if (deployCount != null) entries[i].deployCount = deployCount.toString();
      }

      entries.sort((a, b) => {
        const diff = BigInt(b.points) - BigInt(a.points);
        if (diff > BigInt(0)) return 1;
        if (diff < BigInt(0)) return -1;
        return a.address.localeCompare(b.address);
      });

      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });
    }

    return { configured: true, entries };
  } catch (error) {
    throw new Error(friendlyRpcError(error));
  }
}

export function rankForAddress(
  entries: LeaderboardRow[],
  address: string,
): number | null {
  const row = entries.find(
    (e) => e.address.toLowerCase() === address.toLowerCase(),
  );
  return row?.rank ?? null;
}
