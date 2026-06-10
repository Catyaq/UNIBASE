"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

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
    refreshStats,
  } = useHubStats();

  const hubReady = isContractConfigured;
  const actionDisabled = !isConnected || wrongChain || !hubReady;

  return (
    <>
      <AppNav />

      <div className="uni-airdrop-callout uni-airdrop-callout-compact">
        <p className="uni-airdrop-text">
          More points = bigger <span className="uni-text-accent font-semibold">$UB</span> airdrop
          {inMiniApp ? " · Farcaster" : " · Web"} · Base
        </p>
      </div>

      {!hubReady && (
        <div className="uni-card uni-card-critical px-3 py-2.5">
          <p className="uni-label text-[var(--uni-critical)]">Hub not configured</p>
          <p className="uni-caption mt-1">
            Deploy <span className="uni-code">Hub.sol</span> and set{" "}
            <span className="uni-code">HUB_CONTRACT_ADDRESS</span>.
          </p>
        </div>
      )}

      <div className="uni-card px-3 py-3">
        <ConnectWallet compact />

        {wrongChain && (
          <button
            type="button"
            className="uni-btn uni-btn-primary mt-2"
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: DEPLOY_CHAIN_ID })}
          >
            {isSwitching ? "Switching…" : "Switch to Base"}
          </button>
        )}

        {hubReady && isConnected && !wrongChain && (
          <>
            <div className="uni-tabs mt-3 mb-2">
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
          </>
        )}
      </div>

      {hubReady && (
        <PointsRulesCard />
      )}

      {hubReady && (
        <div className="flex gap-2">
          {isBadgeContractConfigured && (
            <Link href="/badges" className="uni-btn uni-btn-secondary uni-btn-sm flex-1">
              Badges
            </Link>
          )}
          <Link href="/leaderboard" className="uni-btn uni-btn-secondary uni-btn-sm flex-1">
            Leaderboard
          </Link>
        </div>
      )}

      {!isBadgeContractConfigured && hubReady && (
        <p className="uni-caption text-center">
          Deploy <span className="uni-code">BadgeNFT.sol</span> for NFT badges.
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
