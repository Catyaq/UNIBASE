"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatEther } from "viem";

import {
  DEPLOY_CHAIN_ID,
  FREE_GM_PER_DAY,
  GM_FEE_WEI,
  HUB_CONTRACT_ADDRESS,
  hubAbi,
} from "@/config/contract";
import { pointsForGm, POINTS_RULES } from "@/config/points";
import { useHubStats } from "@/hooks/useHubStats";

function explorerTxUrl(hash: string) {
  return `https://basescan.org/tx/${hash}`;
}

type GmPanelProps = {
  disabled?: boolean;
};

export function GmPanel({ disabled }: GmPanelProps) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const syncedTxHash = useRef<string | undefined>(undefined);

  const [lastEarned, setLastEarned] = useState<number | null>(null);

  const {
    gmCount,
    points,
    lastGmAt,
    freeRemaining,
    gmFeeOnChain,
    minInterval,
    refreshStats,
  } = useHubStats();

  const { data: hash, isPending, writeContract, error: writeError } =
    useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isSuccess || !hash) return;
    if (syncedTxHash.current === hash) return;
    syncedTxHash.current = hash;
    const sync = async () => {
      await refreshStats();
      window.setTimeout(() => void refreshStats(), 800);
    };
    void sync();
  }, [isSuccess, hash, refreshStats]);

  const feeWei = gmFeeOnChain ?? GM_FEE_WEI;
  const feeLabel = formatEther(feeWei);
  const freeLeft = Number(freeRemaining ?? FREE_GM_PER_DAY);
  const isPaidGm = freeLeft === 0;

  const cooldownEnds = useMemo(() => {
    if (!lastGmAt || !minInterval) return 0;
    const last = Number(lastGmAt);
    if (last === 0) return 0;
    return last + Number(minInterval);
  }, [lastGmAt, minInterval]);

  const secondsLeft = Math.max(0, cooldownEnds - now);
  const canGm = secondsLeft === 0;

  const handleGm = () => {
    setLastEarned(pointsForGm(isPaidGm));
    writeContract({
      address: HUB_CONTRACT_ADDRESS,
      abi: hubAbi,
      functionName: "gm",
      chainId: DEPLOY_CHAIN_ID,
      value: isPaidGm ? feeWei : BigInt(0),
    });
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={handleGm}
        disabled={disabled || !canGm || isPending || isConfirming}
        className="uni-btn uni-btn-primary uni-btn-hero"
      >
        {!canGm
          ? `Wait ${secondsLeft}s`
          : isPending
            ? "Confirm in wallet"
            : isConfirming
              ? "Processing…"
              : isPaidGm
                ? `GM · ${feeLabel} ETH`
                : "GM · Free"}
      </button>

      <p className="uni-caption text-center">
        {isPaidGm
          ? `Paid GM · +${POINTS_RULES.paidGm} pts`
          : `Free GM · +${POINTS_RULES.freeGm} pts · ${freeLeft} left today`}
      </p>

      <div className="grid grid-cols-4 gap-1.5">
        <Stat label="GMs" value={gmCount?.toString() ?? "0"} />
        <Stat label="Pts" value={points?.toString() ?? "0"} />
        <Stat label="Free" value={`${freeLeft}/${FREE_GM_PER_DAY}`} />
        <Stat
          label="Earn"
          value={`+${POINTS_RULES.freeGm}/${POINTS_RULES.paidGm}`}
        />
      </div>

      {writeError && (
        <p className="uni-caption text-center text-[var(--uni-critical)]">
          {writeError.message.split("\n")[0]}
        </p>
      )}

      {isSuccess && hash && (
        <div className="uni-card-inset px-3 py-3 text-center">
          {lastEarned != null && (
            <p className="uni-label text-[var(--uni-success)]">
              +{lastEarned} points earned
            </p>
          )}
          <a
            href={explorerTxUrl(hash)}
            target="_blank"
            rel="noreferrer"
            className="uni-link uni-caption mt-1 inline-block"
          >
            View on Basescan
          </a>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="uni-card-inset px-2 py-1.5 text-center">
      <p className="uni-label text-[0.625rem]">{label}</p>
      <p className="uni-mono mt-0.5 text-sm font-semibold text-[var(--uni-text)]">
        {value}
      </p>
    </div>
  );
}
