import type { Address } from "viem";

export type LeaderboardEntry = {
  address: Address;
  points: string;
  gmCount: string;
  deployCount: string;
  lastActive: string;
};

export type LeaderboardRow = LeaderboardEntry & {
  rank: number;
};

type Participant = {
  points: bigint;
  gmCount: bigint;
  deployCount: bigint;
  lastActive: bigint;
};

export function buildLeaderboardFromEvents(
  gmLogs: Array<{
    args: {
      user?: Address;
      gmCount?: bigint;
      points?: bigint;
      timestamp?: bigint;
    };
  }>,
  deployLogs: Array<{
    args: {
      user?: Address;
      totalPoints?: bigint;
      timestamp?: bigint;
    };
  }>,
): LeaderboardEntry[] {
  const participants = new Map<string, Participant>();

  for (const log of gmLogs) {
    const user = log.args.user;
    if (!user) continue;
    const key = user.toLowerCase();
    const prev = participants.get(key) ?? {
      points: BigInt(0),
      gmCount: BigInt(0),
      deployCount: BigInt(0),
      lastActive: BigInt(0),
    };
    const ts = log.args.timestamp ?? BigInt(0);
    participants.set(key, {
      points: log.args.points ?? prev.points,
      gmCount: log.args.gmCount ?? prev.gmCount,
      deployCount: prev.deployCount,
      lastActive: ts > prev.lastActive ? ts : prev.lastActive,
    });
  }

  for (const log of deployLogs) {
    const user = log.args.user;
    if (!user) continue;
    const key = user.toLowerCase();
    const prev = participants.get(key) ?? {
      points: BigInt(0),
      gmCount: BigInt(0),
      deployCount: BigInt(0),
      lastActive: BigInt(0),
    };
    const ts = log.args.timestamp ?? BigInt(0);
    participants.set(key, {
      points: log.args.totalPoints ?? prev.points,
      gmCount: prev.gmCount,
      deployCount: prev.deployCount + BigInt(1),
      lastActive: ts > prev.lastActive ? ts : prev.lastActive,
    });
  }

  return Array.from(participants.entries())
    .map(([address, data]) => ({
      address: address as Address,
      points: data.points.toString(),
      gmCount: data.gmCount.toString(),
      deployCount: data.deployCount.toString(),
      lastActive: data.lastActive.toString(),
    }))
    .sort((a, b) => {
      const diff = BigInt(b.points) - BigInt(a.points);
      if (diff > BigInt(0)) return 1;
      if (diff < BigInt(0)) return -1;
      return a.address.localeCompare(b.address);
    });
}

export function withRanks(entries: LeaderboardEntry[]): LeaderboardRow[] {
  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
