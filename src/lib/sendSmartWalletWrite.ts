import { concat, numberToHex, type Address, type Hex } from "viem";
import type { Connector } from "wagmi";

import { BUILDER_DATA_SUFFIX } from "@/config/builderCode";
import { DEPLOY_CHAIN_ID } from "@/config/contract";
import { resolveSendCallsTxHash } from "@/lib/resolveSendCallsTxHash";
import { isTransactionHash } from "@/lib/transactionHash";

type SendSmartWalletWriteArgs = {
  connector: Connector;
  address: Address;
  chainId?: typeof DEPLOY_CHAIN_ID;
  to: Address;
  callData: Hex;
  value?: bigint;
};

type ProviderRequester = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
};

async function getProviderRequester(
  connector: Connector,
): Promise<ProviderRequester> {
  const provider = await connector.getProvider();
  if (
    !provider ||
    typeof provider !== "object" ||
    !("request" in provider) ||
    typeof provider.request !== "function"
  ) {
    throw new Error("Wallet provider unavailable.");
  }

  return provider as ProviderRequester;
}

async function resolveSendCallsResult(
  result: unknown,
  chainId: typeof DEPLOY_CHAIN_ID,
): Promise<Hex | null> {
  if (typeof result === "string") {
    if (isTransactionHash(result)) return result;
    return resolveSendCallsTxHash(result, chainId);
  }

  if (result && typeof result === "object" && "id" in result) {
    const id = String((result as { id: unknown }).id);
    if (isTransactionHash(id)) return id;
    return resolveSendCallsTxHash(id, chainId);
  }

  return null;
}

async function sendTaggedEthTransaction(
  provider: ProviderRequester,
  {
    address,
    to,
    taggedData,
    value,
  }: {
    address: Address;
    to: Address;
    taggedData: Hex;
    value: bigint;
  },
): Promise<Hex> {
  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: address,
        to,
        data: taggedData,
        value: numberToHex(value),
      },
    ],
  });

  if (typeof hash !== "string" || !isTransactionHash(hash)) {
    throw new Error("eth_sendTransaction did not return a transaction hash.");
  }

  return hash;
}

/**
 * Send a contract write with ERC-8021 suffix for smart wallets.
 * Farcaster uses eth_sendTransaction; Base Account prefers wallet_sendCalls.
 */
export async function sendSmartWalletWrite({
  connector,
  address,
  chainId = DEPLOY_CHAIN_ID,
  to,
  callData,
  value = 0n,
}: SendSmartWalletWriteArgs): Promise<Hex> {
  const provider = await getProviderRequester(connector);
  const taggedData = concat([callData, BUILDER_DATA_SUFFIX]);

  if (connector.id === "farcaster") {
    return sendTaggedEthTransaction(provider, {
      address,
      to,
      taggedData,
      value,
    });
  }

  try {
    const result = await provider.request({
      method: "wallet_sendCalls",
      params: [
        {
          version: "1.0",
          chainId: numberToHex(chainId),
          from: address,
          calls: [
            {
              to,
              data: taggedData,
              value: numberToHex(value),
            },
          ],
          capabilities: {
            dataSuffix: {
              value: BUILDER_DATA_SUFFIX,
              optional: true,
            },
          },
        },
      ],
    });

    const hash = await resolveSendCallsResult(result, chainId);
    if (hash) return hash;
  } catch {
    // Fall back to eth_sendTransaction below.
  }

  return sendTaggedEthTransaction(provider, {
    address,
    to,
    taggedData,
    value,
  });
}
