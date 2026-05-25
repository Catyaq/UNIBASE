import {
  createPublicClient,
  http,
  type Address,
  type PublicClient,
} from "viem";
import { base } from "viem/chains";

import {
  HUB_CONTRACT_ADDRESS,
  HUB_DEPLOY_FROM_BLOCK,
  hubAbi,
  isContractConfigured,
} from "@/config/contract";
import {
  buildLeaderboardFromEvents,
  withRanks,
  type LeaderboardRow,
} from "@/lib/leaderboard";

const LOG_CHUNK_SIZE = 2_000n;
const DEFAULT_BASE_RPC = "https://mainnet.base.org";

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

function createBaseClient() {
  return createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL ?? DEFAULT_BASE_RPC, {
      timeout: 30_000,
    }),
  });
}

async function getContractEventsChunked<
  TEventName extends "GM" | "TokenDeployed",
>({
  client,
  eventName,
  fromBlock,
}: {
  client: PublicClient;
  eventName: TEventName;
  fromBlock: bigint;
}) {
  const latest = await client.getBlockNumber();
  const start = fromBlock > latest ? latest : fromBlock;
  const all: Awaited<
    ReturnType<PublicClient["getContractEvents"]>
  > = [];

  for (let chunkStart = start; chunkStart <= latest; chunkStart += LOG_CHUNK_SIZE) {
    const chunkEnd =
      chunkStart + LOG_CHUNK_SIZE - 1n > latest
        ? latest
        : chunkStart + LOG_CHUNK_SIZE - 1n;

    const logs = await client.getContractEvents({
      address: HUB_CONTRACT_ADDRESS,
      abi: hubAbi,
      eventName,
      fromBlock: chunkStart,
      toBlock: chunkEnd,
    });
    all.push(...logs);
  }

  return all;
}

export async function fetchLeaderboard(): Promise<{
  configured: boolean;
  entries: LeaderboardRow[];
}> {
  if (!isContractConfigured) {
    return { configured: false, entries: [] };
  }

  const client = createBaseClient();
  const fromBlock = hubDeployFromBlock();

  const [gmLogs, deployLogs] = await Promise.all([
    getContractEventsChunked({ client, eventName: "GM", fromBlock }),
    getContractEventsChunked({
      client,
      eventName: "TokenDeployed",
      fromBlock,
    }),
  ]);

  const entries = withRanks(buildLeaderboardFromEvents(gmLogs, deployLogs));

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
