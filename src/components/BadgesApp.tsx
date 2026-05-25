"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

import { AppNav } from "@/components/AppNav";
import { BadgeCard } from "@/components/BadgeCard";
import { ConnectWallet } from "@/components/ConnectWallet";
import type { BadgeKind } from "@/config/badges";
import { BADGES } from "@/config/badges";
import { isBadgeContractConfigured } from "@/config/badgeContract";
import { DEPLOY_CHAIN_ID, isContractConfigured } from "@/config/contract";
import { useBadgeStatus } from "@/hooks/useBadgeStatus";
import { useHubStats } from "@/hooks/useHubStats";

type BadgeTab = "all" | BadgeKind;

const TABS: { id: BadgeTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "gm", label: "GM" },
  { id: "deploy", label: "Deploy" },
  { id: "points", label: "Points" },
  { id: "rank", label: "Rank" },
];

const SECTION_LABELS: Record<BadgeKind, string> = {
  gm: "GM milestones",
  deploy: "Deploy milestones",
  points: "Points milestones",
  rank: "Leaderboard rank",
};

export function BadgesApp() {
  const [tab, setTab] = useState<BadgeTab>("all");
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const wrongChain = isConnected && chainId !== DEPLOY_CHAIN_ID;

  const { gmCount, deployCount, points } = useHubStats();
  const { badges, refresh, isLoading, isConfigured, userRank } =
    useBadgeStatus();

  const mintedCount = badges.filter((b) => b.minted).length;
  const readyCount = badges.filter((b) => b.canMint).length;
  const collectionProgress = Math.round((mintedCount / BADGES.length) * 100);

  const filteredBadges = useMemo(() => {
    if (tab === "all") return badges;
    return badges.filter((b) => b.kind === tab);
  }, [badges, tab]);

  const sections = useMemo(() => {
    if (tab !== "all") return [{ kind: tab, items: filteredBadges }];
    const kinds: BadgeKind[] = ["gm", "deploy", "points", "rank"];
    return kinds
      .map((kind) => ({
        kind,
        items: badges.filter((b) => b.kind === kind),
      }))
      .filter((section) => section.items.length > 0);
  }, [badges, filteredBadges, tab]);

  const statForKind = (kind: BadgeKind) => {
    switch (kind) {
      case "gm":
        return gmCount?.toString() ?? "0";
      case "deploy":
        return deployCount?.toString() ?? "0";
      case "points":
        return points?.toString() ?? "0";
      case "rank":
        return userRank != null ? `#${userRank}` : "—";
    }
  };

  const disabled =
    !isConnected || wrongChain || !isConfigured || !isContractConfigured;

  return (
    <>
      <AppNav />

      <header className="uni-badges-hero px-5 py-5">
        <div className="uni-badges-hero-inner">
          <p className="uni-eyebrow text-center">Collectible NFTs · Base</p>
          <h1 className="uni-title mt-2 text-center text-3xl">Badge collection</h1>
          <p className="uni-body mx-auto mt-2 max-w-sm text-center text-sm">
            Earn milestone badges for GM, deploys, points, and leaderboard rank.
            Mint each one once as an on-chain NFT.
          </p>

          <div className="uni-badges-collection">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="uni-label">Collection progress</p>
              <p className="uni-mono text-sm font-semibold text-[var(--uni-text)]">
                {mintedCount}
                <span className="text-[var(--uni-text-tertiary)]">
                  /{BADGES.length}
                </span>
              </p>
            </div>
            <div className="uni-badges-collection-bar">
              <div
                className="uni-badges-collection-fill"
                style={{ width: `${collectionProgress}%` }}
              />
            </div>
            {readyCount > 0 && (
              <p className="uni-caption mt-2 text-center text-[var(--uni-pink)]">
                {readyCount} badge{readyCount === 1 ? "" : "s"} ready to mint
              </p>
            )}
          </div>

          {isConnected && !wrongChain && isConfigured && (
            <div className="uni-badges-stats mt-3">
              <div className="uni-badges-stat">
                <p className="uni-label">GMs</p>
                <p className="uni-badges-stat-value uni-mono mt-0.5">
                  {statForKind("gm")}
                </p>
              </div>
              <div className="uni-badges-stat">
                <p className="uni-label">Deploys</p>
                <p className="uni-badges-stat-value uni-mono mt-0.5">
                  {statForKind("deploy")}
                </p>
              </div>
              <div className="uni-badges-stat">
                <p className="uni-label">Points</p>
                <p className="uni-badges-stat-value uni-mono mt-0.5 uni-text-accent">
                  {statForKind("points")}
                </p>
              </div>
              <div className="uni-badges-stat">
                <p className="uni-label">Rank</p>
                <p className="uni-badges-stat-value uni-mono mt-0.5">
                  {statForKind("rank")}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {!isContractConfigured && (
        <div className="uni-card uni-card-critical px-4 py-4">
          <p className="uni-caption">Configure Hub contract first.</p>
        </div>
      )}

      {!isConfigured && (
        <div className="uni-card uni-card-critical px-4 py-4">
          <p className="uni-caption">
            Deploy <span className="uni-code">BadgeNFT.sol</span> with Hub and
            rank signer, then set{" "}
            <span className="uni-code">BADGE_NFT_ADDRESS</span>.
          </p>
        </div>
      )}

      <div className="uni-card px-4 py-4">
        <ConnectWallet />
      </div>

      {wrongChain && (
        <button
          type="button"
          className="uni-btn uni-btn-primary"
          disabled={isSwitching}
          onClick={() => switchChain({ chainId: DEPLOY_CHAIN_ID })}
        >
          {isSwitching ? "Switching…" : "Switch to Base"}
        </button>
      )}

      {isConnected && !wrongChain && isConfigured && (
        <>
          <div className="uni-badges-tabs">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`uni-badges-tab ${tab === item.id ? "uni-badges-tab-active" : ""}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="uni-badge-grid">
            {sections.map((section) => (
              <div key={section.kind} className="contents">
                {tab === "all" && (
                  <h2 className="uni-badge-section-title">
                    {SECTION_LABELS[section.kind]}
                  </h2>
                )}
                {section.items.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    minted={badge.minted}
                    eligible={badge.eligible}
                    canMint={badge.canMint}
                    currentCount={
                      badge.kind === "gm"
                        ? gmCount
                        : badge.kind === "deploy"
                          ? deployCount
                          : badge.kind === "points"
                            ? points
                            : undefined
                    }
                    userRank={badge.userRank}
                    rankSignerReady={badge.rankSignerReady}
                    rankSignerReason={badge.rankSignerReason}
                    disabled={disabled || isLoading}
                    onMinted={() => void refresh()}
                  />
                ))}
              </div>
            ))}
          </div>

          {isLoading && (
            <p className="uni-caption uni-pulse text-center">Syncing badges…</p>
          )}
        </>
      )}

      {!isConnected && (
        <div className="uni-card px-4 py-5 text-center">
          <p className="uni-body text-sm">
            Connect your wallet to track progress and mint badge NFTs.
          </p>
          <Link href="/leaderboard" className="uni-link mt-3 inline-block text-sm">
            View leaderboard →
          </Link>
        </div>
      )}
    </>
  );
}
