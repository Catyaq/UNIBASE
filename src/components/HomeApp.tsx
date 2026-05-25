"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

import { APP_DESCRIPTION, APP_NAME } from "@/config/app";
import { AppNav } from "@/components/AppNav";
import { ConnectWallet } from "@/components/ConnectWallet";
import { DeployPanel } from "@/components/DeployPanel";
import { GmPanel } from "@/components/GmPanel";
import {
  DEPLOY_CHAIN_ID,
  isContractConfigured,
} from "@/config/contract";
import { isBadgeContractConfigured } from "@/config/badgeContract";
import { PointsRulesCard } from "@/components/PointsRulesCard";
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp";
import { useHubStats } from "@/hooks/useHubStats";

type Tab = "gm" | "deploy";

export function HomeApp() {
  const { inMiniApp } = useFarcasterMiniApp();
  const [tab, setTab] = useState<Tab>("gm");
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const wrongChain = isConnected && chainId !== DEPLOY_CHAIN_ID;

  const {
    deployCount,
    freeDeployAvailable,
    deployFeeOnChain,
    points,
    refreshStats,
  } = useHubStats();

  const hubReady = isContractConfigured;
  const actionDisabled = !isConnected || wrongChain || !hubReady;

  return (
    <>
      <AppNav />

      <header className="uni-card px-5 py-5 text-center">
        <p className="uni-eyebrow">
          {inMiniApp ? "Farcaster" : "Web"} · Base
        </p>
        <h1 className="uni-title mt-2 text-3xl">{APP_NAME}</h1>
        <p className="uni-body mt-2 text-sm">{APP_DESCRIPTION}</p>
        <div className="uni-airdrop-callout mt-4">
          <p className="uni-airdrop-text">
            More points = Bigger{" "}
            <span className="uni-text-accent font-semibold">$UB</span> airdrop.
            Simple as that.
          </p>
        </div>
      </header>

      {!hubReady && (
        <div className="uni-card uni-card-critical px-4 py-4">
          <p className="uni-label text-[var(--uni-critical)]">Hub not configured</p>
          <p className="uni-caption mt-2">
            Deploy <span className="uni-code">Hub.sol</span> and set{" "}
            <span className="uni-code">HUB_CONTRACT_ADDRESS</span>.
          </p>
        </div>
      )}

      <div className="uni-card px-4 py-5">
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

      {hubReady && isConnected && !wrongChain && (
        <div className="uni-card px-4 py-3 text-center">
          <p className="uni-label">Total points</p>
          <p className="uni-mono mt-1 text-2xl font-semibold uni-text-accent">
            {points?.toString() ?? "0"}
          </p>
        </div>
      )}

      {hubReady && isConnected && !wrongChain && (
        <div className="uni-card p-4">
          <div className="uni-tabs mb-4">
            <button
              type="button"
              className={`uni-tab ${tab === "gm" ? "uni-tab-active" : ""}`}
              onClick={() => setTab("gm")}
            >
              GM
            </button>
            <button
              type="button"
              className={`uni-tab ${tab === "deploy" ? "uni-tab-active" : ""}`}
              onClick={() => setTab("deploy")}
            >
              Deploy
            </button>
          </div>

          {tab === "gm" ? (
            <GmPanel disabled={actionDisabled} />
          ) : (
            <DeployPanel
              freeDeployAvailable={freeDeployAvailable}
              deployFeeOnChain={deployFeeOnChain}
              onSuccess={() => void refreshStats()}
            />
          )}
        </div>
      )}

      {hubReady && (
        <PointsRulesCard />
      )}

      {isBadgeContractConfigured && (
        <Link href="/badges" className="uni-btn uni-btn-secondary block text-center">
          View badges · GM & Deploy milestones
        </Link>
      )}

      {hubReady && (
        <Link href="/leaderboard" className="uni-btn uni-btn-secondary block text-center">
          Leaderboard · rank by points
        </Link>
      )}

      {!isBadgeContractConfigured && hubReady && (
        <p className="uni-caption text-center">
          Deploy <span className="uni-code">BadgeNFT.sol</span> and set{" "}
          <span className="uni-code">BADGE_NFT_ADDRESS</span> for NFT badges.
        </p>
      )}

      {hubReady && isConnected && !wrongChain && (
        <p className="uni-caption text-center">
          Deploys: <span className="uni-mono">{deployCount?.toString() ?? "0"}</span>
          {" · "}
          <Link href="/badges" className="uni-link">
            Earn badges
          </Link>
        </p>
      )}
    </>
  );
}
