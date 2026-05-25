"use client";

import { useCallback, useMemo } from "react";
import {
  useAccount,
  useReadContracts,
  useWatchContractEvent,
} from "wagmi";

import {
  DEPLOY_CHAIN_ID,
  HUB_CONTRACT_ADDRESS,
  hubAbi,
  isContractConfigured,
} from "@/config/contract";

export function useHubStats() {
  const { address } = useAccount();
  const enabled = Boolean(address) && isContractConfigured;

  const contracts = useMemo(() => {
    if (!address) return [];
    return [
      {
        address: HUB_CONTRACT_ADDRESS,
        abi: hubAbi,
        functionName: "gmCount" as const,
        args: [address] as const,
        chainId: DEPLOY_CHAIN_ID,
      },
      {
        address: HUB_CONTRACT_ADDRESS,
        abi: hubAbi,
        functionName: "points" as const,
        args: [address] as const,
        chainId: DEPLOY_CHAIN_ID,
      },
      {
        address: HUB_CONTRACT_ADDRESS,
        abi: hubAbi,
        functionName: "lastGmAt" as const,
        args: [address] as const,
        chainId: DEPLOY_CHAIN_ID,
      },
      {
        address: HUB_CONTRACT_ADDRESS,
        abi: hubAbi,
        functionName: "freeGmsRemaining" as const,
        args: [address] as const,
        chainId: DEPLOY_CHAIN_ID,
      },
      {
        address: HUB_CONTRACT_ADDRESS,
        abi: hubAbi,
        functionName: "deployCount" as const,
        args: [address] as const,
        chainId: DEPLOY_CHAIN_ID,
      },
      {
        address: HUB_CONTRACT_ADDRESS,
        abi: hubAbi,
        functionName: "freeDeployAvailable" as const,
        args: [address] as const,
        chainId: DEPLOY_CHAIN_ID,
      },
      {
        address: HUB_CONTRACT_ADDRESS,
        abi: hubAbi,
        functionName: "totalGms" as const,
        chainId: DEPLOY_CHAIN_ID,
      },
      {
        address: HUB_CONTRACT_ADDRESS,
        abi: hubAbi,
        functionName: "totalDeploys" as const,
        chainId: DEPLOY_CHAIN_ID,
      },
      {
        address: HUB_CONTRACT_ADDRESS,
        abi: hubAbi,
        functionName: "GM_FEE" as const,
        chainId: DEPLOY_CHAIN_ID,
      },
      {
        address: HUB_CONTRACT_ADDRESS,
        abi: hubAbi,
        functionName: "DEPLOY_FEE" as const,
        chainId: DEPLOY_CHAIN_ID,
      },
      {
        address: HUB_CONTRACT_ADDRESS,
        abi: hubAbi,
        functionName: "MIN_INTERVAL" as const,
        chainId: DEPLOY_CHAIN_ID,
      },
    ];
  }, [address]);

  const { data, refetch } = useReadContracts({
    contracts,
    query: {
      enabled,
      staleTime: 0,
    },
  });

  const refreshStats = useCallback(async () => {
    if (!enabled) return;
    await refetch();
  }, [enabled, refetch]);

  const onMine = useCallback(
    (user?: `0x${string}`) => {
      if (!address || !user) return false;
      return user.toLowerCase() === address.toLowerCase();
    },
    [address],
  );

  useWatchContractEvent({
    address: HUB_CONTRACT_ADDRESS,
    abi: hubAbi,
    eventName: "GM",
    chainId: DEPLOY_CHAIN_ID,
    enabled,
    onLogs(logs) {
      if (logs.some((log) => onMine(log.args.user))) void refetch();
    },
  });

  useWatchContractEvent({
    address: HUB_CONTRACT_ADDRESS,
    abi: hubAbi,
    eventName: "TokenDeployed",
    chainId: DEPLOY_CHAIN_ID,
    enabled,
    onLogs(logs) {
      if (logs.some((log) => onMine(log.args.user))) void refetch();
    },
  });

  return {
    gmCount: data?.[0]?.result as bigint | undefined,
    points: data?.[1]?.result as bigint | undefined,
    lastGmAt: data?.[2]?.result as bigint | undefined,
    freeRemaining: data?.[3]?.result as bigint | undefined,
    deployCount: data?.[4]?.result as bigint | undefined,
    freeDeployAvailable: data?.[5]?.result as boolean | undefined,
    totalGms: data?.[6]?.result as bigint | undefined,
    totalDeploys: data?.[7]?.result as bigint | undefined,
    gmFeeOnChain: data?.[8]?.result as bigint | undefined,
    deployFeeOnChain: data?.[9]?.result as bigint | undefined,
    minInterval: data?.[10]?.result as bigint | undefined,
    refreshStats,
  };
}

