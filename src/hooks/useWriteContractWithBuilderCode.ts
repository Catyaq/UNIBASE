"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { encodeFunctionData, type Abi, type Hex } from "viem";

import { BUILDER_DATA_SUFFIX } from "@/config/builderCode";
import { DEPLOY_CHAIN_ID } from "@/config/contract";
import { isDelegatedEoa } from "@/lib/isDelegatedEoa";
import { sendSmartWalletWrite } from "@/lib/sendSmartWalletWrite";

type ContractWriteRequest = {
  address: `0x${string}`;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  chainId?: typeof DEPLOY_CHAIN_ID;
  value?: bigint;
};

const SMART_WALLET_CONNECTORS = new Set(["farcaster", "baseAccount"]);

/**
 * Farcaster / Base Account / EIP-7702 wallets strip ERC-8021 suffixes from
 * eth_sendTransaction. Route those through wallet_sendCalls with tagged calldata.
 */
export function useWriteContractWithBuilderCode() {
  const { address, connector } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, reset: resetWrite } = useWriteContract();

  const [data, setData] = useState<Hex | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setIsPending(false);
    resetWrite();
  }, [resetWrite]);

  const writeContractAsyncWithBuilder = useCallback(
    async (variables: ContractWriteRequest) => {
      if (!address) {
        throw new Error("Connect a wallet first.");
      }

      setIsPending(true);
      setError(null);
      setData(undefined);

      const chainId = variables.chainId ?? DEPLOY_CHAIN_ID;
      const callData = encodeFunctionData({
        abi: variables.abi as Abi,
        functionName: variables.functionName,
        args: variables.args,
      });

      try {
        const delegated =
          SMART_WALLET_CONNECTORS.has(connector?.id ?? "") ||
          (await isDelegatedEoa(publicClient, address));

        if (delegated) {
          if (!connector) {
            throw new Error("Wallet connector unavailable.");
          }

          const hash = await sendSmartWalletWrite({
            connector,
            address,
            chainId,
            to: variables.address,
            callData,
            value: variables.value,
          });

          setData(hash);
          return hash;
        }

        const hash = await writeContractAsync({
          address: variables.address,
          abi: variables.abi,
          functionName: variables.functionName,
          args: variables.args,
          chainId,
          ...(variables.value !== undefined ? { value: variables.value } : {}),
          dataSuffix: BUILDER_DATA_SUFFIX,
        } as Parameters<typeof writeContractAsync>[0]);

        setData(hash);
        return hash;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [address, connector, publicClient, writeContractAsync],
  );

  const writeContract = useCallback(
    (variables: ContractWriteRequest) => {
      void writeContractAsyncWithBuilder(variables);
    },
    [writeContractAsyncWithBuilder],
  );

  return {
    writeContract,
    writeContractAsync: writeContractAsyncWithBuilder,
    data,
    isPending,
    error,
    reset,
  };
}
