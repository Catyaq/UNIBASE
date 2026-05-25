"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import {
  BadgeIcon,
  badgeTierChipClass,
  badgeTierClass,
  badgeTierLabel,
  badgeThresholdLabel,
} from "@/components/BadgeIcon";
import type { BadgeDefinition } from "@/config/badges";
import { badgeTier } from "@/config/badges";
import {
  BADGE_NFT_ADDRESS,
  DEPLOY_CHAIN_ID,
  badgeNftAbi,
} from "@/config/badgeContract";

type BadgeCardProps = {
  badge: BadgeDefinition;
  minted: boolean;
  eligible: boolean;
  canMint: boolean;
  currentCount?: bigint;
  userRank?: number | null;
  rankSignerReady?: boolean;
  disabled?: boolean;
  onMinted?: () => void;
};

export function BadgeCard({
  badge,
  minted,
  eligible,
  canMint,
  currentCount,
  userRank,
  rankSignerReady = true,
  disabled,
  onMinted,
}: BadgeCardProps) {
  const { address } = useAccount();
  const [mintError, setMintError] = useState<string | null>(null);

  const { writeContract, data: hash, isPending, error, reset } =
    useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const syncedHash = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!isSuccess || !hash) return;
    if (syncedHash.current === hash) return;
    syncedHash.current = hash;
    onMinted?.();
  }, [isSuccess, hash, onMinted]);

  const handleMintHub = () => {
    setMintError(null);
    reset();
    writeContract({
      address: BADGE_NFT_ADDRESS,
      abi: badgeNftAbi,
      functionName: "mint",
      args: [BigInt(badge.id)],
      chainId: DEPLOY_CHAIN_ID,
    });
  };

  const handleMintRank = async () => {
    if (!address) {
      setMintError("Connect wallet first");
      return;
    }

    setMintError(null);
    reset();

    try {
      const res = await fetch("/api/badges/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, badgeType: badge.id }),
      });
      const json = (await res.json()) as {
        signature?: string;
        deadline?: string;
        error?: string;
      };

      if (!res.ok || !json.signature || !json.deadline) {
        setMintError(json.error ?? "Could not get rank signature");
        return;
      }

      if (!json.signature.startsWith("0x")) {
        setMintError("Invalid signature from server");
        return;
      }

      writeContract({
        address: BADGE_NFT_ADDRESS,
        abi: badgeNftAbi,
        functionName: "mintRankBadge",
        args: [
          BigInt(badge.id),
          BigInt(json.deadline),
          json.signature as `0x${string}`,
        ],
        chainId: DEPLOY_CHAIN_ID,
      });
    } catch {
      setMintError("Rank mint request failed");
    }
  };

  const handleMint = () => {
    if (badge.mintMode === "rank") {
      void handleMintRank();
    } else {
      handleMintHub();
    }
  };

  const progress =
    badge.kind === "rank"
      ? userRank != null && userRank <= badge.threshold
        ? 100
        : userRank != null
          ? Math.min(100, Math.round((badge.threshold / userRank) * 100))
          : 0
      : currentCount
        ? Math.min(
            100,
            Math.round((Number(currentCount) / badge.threshold) * 100),
          )
        : 0;

  const progressLabel =
    badge.kind === "rank"
      ? userRank != null
        ? `#${userRank} / top ${badge.threshold}`
        : "Not ranked"
      : currentCount
        ? `${currentCount} / ${badge.threshold}`
        : `0 / ${badge.threshold}`;

  const tier = badgeTier(badge);
  const tierLabel = badgeTierLabel(tier);

  const cardState = minted
    ? "uni-badge-card-minted"
    : canMint
      ? "uni-badge-card-ready"
      : !eligible
        ? "uni-badge-card-locked"
        : "";

  const chipClass = minted
    ? "uni-badge-chip-minted"
    : canMint
      ? "uni-badge-chip-ready"
      : "uni-badge-chip-locked";

  const chipLabel = minted
    ? "Minted"
    : canMint
      ? "Ready"
      : eligible
        ? "Eligible"
        : "Locked";

  const mintDisabled =
    disabled ||
    !canMint ||
    isPending ||
    isConfirming ||
    (badge.mintMode === "rank" && !rankSignerReady);

  return (
    <article
      className={`uni-badge-card uni-badge-card-tier-${tier} ${cardState}`}
    >
      <div className={`uni-badge-medallion ${badgeTierClass(tier)}`}>
        <BadgeIcon kind={badge.kind} />
        {minted && (
          <span className="uni-badge-check" aria-hidden>
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
              <path
                d="M2.5 6l2.5 2.5 4.5-5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>

      <div className="w-full min-w-0">
        <div className="flex flex-wrap items-center justify-center gap-1">
          <span className={badgeTierChipClass(tier)}>{tierLabel}</span>
          <span className={`uni-badge-chip ${chipClass}`}>{chipLabel}</span>
        </div>
        <h3 className="mt-1.5 truncate text-sm font-semibold text-[var(--uni-text)]">
          {badge.title}
        </h3>
        <p className="uni-caption mt-0.5 line-clamp-2 min-h-[2.25rem] text-[11px] leading-snug">
          {badge.description}
        </p>
      </div>

      <div className="w-full">
        <div className="mb-1 flex items-center justify-between gap-1">
          <span className="uni-mono text-[10px] text-[var(--uni-text-tertiary)]">
            {progressLabel}
          </span>
          <span className="uni-mono text-[10px] font-medium text-[var(--uni-text-secondary)]">
            {badgeThresholdLabel(badge.kind, badge.threshold)}
          </span>
        </div>
        <div className="uni-badge-progress">
          <div
            className={`uni-badge-progress-fill uni-badge-progress-fill-${tier} ${minted ? "uni-badge-progress-fill-minted" : ""}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {badge.mintMode === "rank" && !rankSignerReady && !minted && (
        <p className="uni-caption w-full text-[10px] text-[var(--uni-critical)]">
          Rank signer not configured
        </p>
      )}

      {minted ? (
        <p className="uni-caption w-full text-[11px] text-[var(--uni-success)]">
          In your wallet
        </p>
      ) : (
        <button
          type="button"
          className={`uni-badge-mint-btn uni-badge-mint-btn-${tier} ${!canMint ? "uni-badge-mint-btn-secondary" : ""}`}
          disabled={mintDisabled}
          onClick={handleMint}
        >
          {isPending
            ? "Confirm…"
            : isConfirming
              ? "Minting…"
              : canMint
                ? "Mint NFT"
                : "Locked"}
        </button>
      )}

      {(error || mintError) && (
        <p className="uni-caption w-full text-[10px] text-[var(--uni-critical)]">
          {(error ?? new Error(mintError!)).message.split("\n")[0]}
        </p>
      )}
    </article>
  );
}
