"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { AppNav } from "@/components/AppNav";
import { ConnectWallet } from "@/components/ConnectWallet";
import { isContractConfigured } from "@/config/contract";
import {
  truncateAddress,
  type LeaderboardRow,
} from "@/lib/leaderboard";

type LeaderboardResponse = {
  configured: boolean;
  entries: LeaderboardRow[];
  total: number;
  error?: string;
};

export function LeaderboardApp() {
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      const json = (await res.json()) as LeaderboardResponse;
      setData(json);
    } catch {
      setData({
        configured: isContractConfigured,
        entries: [],
        total: 0,
        error: "Could not load leaderboard",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const myRank = address
    ? data?.entries.find(
        (e) => e.address.toLowerCase() === address.toLowerCase(),
      )
    : undefined;

  return (
    <>
      <AppNav />

      <header className="uni-card px-5 py-5">
        <h1 className="uni-title text-2xl">Leaderboard</h1>
        <p className="uni-body mt-2 text-sm">
          All Hub participants ranked by total points.
        </p>
      </header>

      {!isContractConfigured && (
        <div className="uni-card uni-card-critical px-4 py-4">
          <p className="uni-caption">Deploy Hub and set contract address first.</p>
        </div>
      )}

      <div className="uni-card px-4 py-5">
        <ConnectWallet />
      </div>

      {isConnected && myRank && (
        <div className="uni-card px-4 py-4">
          <p className="uni-label">Your rank</p>
          <p className="uni-mono mt-1 text-xl font-semibold uni-text-accent">
            #{myRank.rank} · {myRank.points} pts
          </p>
          <p className="uni-caption mt-1">
            {myRank.gmCount} GM · {myRank.deployCount} deploys
          </p>
        </div>
      )}

      <div className="uni-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--uni-border)] px-4 py-3">
          <p className="uni-label">
            {loading
              ? "Loading…"
              : `${data?.total ?? 0} participant${data?.total === 1 ? "" : "s"}`}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="uni-btn uni-btn-ghost uni-btn-sm"
          >
            Refresh
          </button>
        </div>

        {data?.error && (
          <p className="uni-caption px-4 py-3 text-[var(--uni-critical)]">
            {data.error}
          </p>
        )}

        {!loading && data?.configured && data.entries.length === 0 && (
          <p className="uni-caption px-4 py-8 text-center">
            No activity yet. Be the first on the App tab.
          </p>
        )}

        {data && data.entries.length > 0 && (
          <ul className="divide-y divide-[var(--uni-border)]">
            {data.entries.map((entry) => {
              const isYou =
                address?.toLowerCase() === entry.address.toLowerCase();
              return (
                <li
                  key={entry.address}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    isYou ? "bg-[var(--uni-pink-muted)]" : ""
                  }`}
                >
                  <RankBadge rank={entry.rank} />
                  <div className="min-w-0 flex-1">
                    <p className="uni-mono text-sm font-medium text-[var(--uni-text)]">
                      {truncateAddress(entry.address)}
                      {isYou && (
                        <span className="ml-2 text-xs uni-text-accent">you</span>
                      )}
                    </p>
                    <p className="uni-caption">
                      {entry.gmCount} GM · {entry.deployCount} deploy
                    </p>
                  </div>
                  <p className="uni-mono text-base font-semibold uni-text-accent">
                    {entry.points}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const top =
    rank === 1
      ? "text-[#FFD700]"
      : rank === 2
        ? "text-[#C0C0C0]"
        : rank === 3
          ? "text-[#CD7F32]"
          : "text-[var(--uni-text-tertiary)]";

  return (
    <span
      className={`uni-mono flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--uni-surface-2)] text-sm font-bold ${top}`}
    >
      {rank}
    </span>
  );
}
