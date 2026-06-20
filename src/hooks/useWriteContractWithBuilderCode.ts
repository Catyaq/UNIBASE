"use client";

import { useCallback, useState } from "react";
import {
  useSendCalls,
  useWriteContract,
} from "wagmi";
import { encodeFunctionData, type Abi, type Hex } from "viem";

import { BUILDER_DATA_SUFFIX } from "@/config/builderCode";
import { DEPLOY_CHAIN_ID } from "@/config/contract";
import { resolveSendCallsTxHash } from "@/lib/resolveSendCallsTxHash";

type ContractWriteRequest = {
  address: `0x${string}`;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  chainId?: typeof DEPLOY_CHAIN_ID;
  value?: bigint;
};

/**
 * Smart wallets (Farcaster mini app, Base Account) strip ERC-8021 suffixes sent
 * via eth_sendTransaction. Use wallet_sendCalls + dataSuffix capability first,
 * then fall back to writeContract for plain EOAs (e.g. MetaMask).
 */
export function useWriteContractWithBuilderCode() {
  const { sendCallsAsync } = useSendCalls();
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
        try {
          const result = await sendCallsAsync({
            chainId,
            calls: [
              {
                to: variables.address,
                data: callData,
                value: variables.value ?? 0n,
              },
            ],
            capabilities: {
              dataSuffix: {
                value: BUILDER_DATA_SUFFIX,
                optional: true,
              },
            },
            experimental_fallback: true,
          });

          const hash = await resolveSendCallsTxHash(result.id, chainId);
          setData(hash);
          return hash;
        } catch {
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
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [sendCallsAsync, writeContractAsync],
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
