"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContracts,
  useWatchContractEvent,
} from "wagmi";

import { BADGES } from "@/config/badges";
import {
  BADGE_NFT_ADDRESS,
  DEPLOY_CHAIN_ID,
  badgeNftAbi,
  isBadgeContractConfigured,
} from "@/config/badgeContract";

type RankStatusResponse = {
  configured: boolean;
  rank: number | null;
  signerConfigured?: boolean;
  signerReason?: string | null;
  badges?: Record<number, { eligible: boolean; rank: number | null }>;
};

export function useBadgeStatus() {
  const { address } = useAccount();
  const enabled = Boolean(address) && isBadgeContractConfigured;
  const [rankStatus, setRankStatus] = useState<RankStatusResponse | null>(
    null,
  );
  const [rankLoading, setRankLoading] = useState(false);

  const mintedContracts = useMemo(() => {
    if (!address) return [];
    return BADGES.map((badge) => ({
      address: BADGE_NFT_ADDRESS,
      abi: badgeNftAbi,
      functionName: "hasMintedType" as const,
      args: [address, BigInt(badge.id)] as const,
      chainId: DEPLOY_CHAIN_ID,
    }));
  }, [address]);

  const hubBadges = useMemo(
    () => BADGES.filter((badge) => badge.mintMode === "hub"),
    [],
  );

  const eligibilityContracts = useMemo(() => {
    if (!address) return [];
    return hubBadges.map((badge) => ({
      address: BADGE_NFT_ADDRESS,
      abi: badgeNftAbi,
      functionName: "eligibility" as const,
      args: [address, BigInt(badge.id)] as const,
      chainId: DEPLOY_CHAIN_ID,
    }));
  }, [address, hubBadges]);

  const { data: mintedData, refetch: refetchMinted, isFetching: mintedFetching } =
    useReadContracts({
      contracts: mintedContracts,
      query: { enabled, staleTime: 0 },
    });

  const {
    data: eligibilityData,
    refetch: refetchEligibility,
    isFetching: eligibilityFetching,
  } = useReadContracts({
    contracts: eligibilityContracts,
    query: { enabled, staleTime: 0 },
  });

  const loadRankStatus = useCallback(async () => {
    if (!address) return;
    setRankLoading(true);
    try {
      const res = await fetch(
        `/api/badges/rank?address=${encodeURIComponent(address)}`,
        { cache: "no-store" },
      );
      const json = (await res.json()) as RankStatusResponse;
      setRankStatus(json);
    } catch {
      setRankStatus(null);
    } finally {
      setRankLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!enabled) return;
    void loadRankStatus();
  }, [enabled, loadRankStatus]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    await Promise.all([
      refetchMinted(),
      refetchEligibility(),
      loadRankStatus(),
    ]);
  }, [enabled, refetchMinted, refetchEligibility, loadRankStatus]);

  useWatchContractEvent({
    address: BADGE_NFT_ADDRESS,
    abi: badgeNftAbi,
    eventName: "BadgeMinted",
    chainId: DEPLOY_CHAIN_ID,
    enabled,
    onLogs(logs) {
      if (!address) return;
      if (
        logs.some(
          (log) =>
            log.args.user?.toLowerCase() === address.toLowerCase(),
        )
      ) {
        void refresh();
      }
    },
  });

  const eligibilityById = useMemo(() => {
    const map = new Map<number, boolean>();
    hubBadges.forEach((badge, index) => {
      map.set(badge.id, eligibilityData?.[index]?.result === true);
    });
    return map;
  }, [eligibilityData, hubBadges]);

  const badges = useMemo(() => {
    return BADGES.map((badge, index) => {
      const minted = mintedData?.[index]?.result === true;
      let eligible = false;
      let userRank: number | null = null;

      if (badge.mintMode === "hub") {
        eligible = eligibilityById.get(badge.id) === true;
      } else {
        userRank = rankStatus?.rank ?? null;
        eligible = rankStatus?.badges?.[badge.id]?.eligible === true;
      }

      return {
        ...badge,
        minted,
        eligible,
        canMint: eligible && !minted,
        userRank,
        rankSignerReady: rankStatus?.signerConfigured ?? false,
        rankSignerReason: rankStatus?.signerReason ?? null,
      };
    });
  }, [mintedData, eligibilityById, rankStatus]);

  return {
    badges,
    refresh,
    isLoading: (mintedFetching || eligibilityFetching || rankLoading) && enabled,
    isConfigured: isBadgeContractConfigured,
    userRank: rankStatus?.rank ?? null,
  };
}
