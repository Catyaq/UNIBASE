import { concat, numberToHex, type Address, type Hex } from "viem";
import type { Connector } from "wagmi";

import { BUILDER_DATA_SUFFIX } from "@/config/builderCode";
import { DEPLOY_CHAIN_ID } from "@/config/contract";
import { resolveSendCallsTxHash } from "@/lib/resolveSendCallsTxHash";

type SendSmartWalletWriteArgs = {
  connector: Connector;
  address: Address;
  chainId?: typeof DEPLOY_CHAIN_ID;
  to: Address;
  callData: Hex;
  value?: bigint;
};

/**
 * Send a contract write through wallet_sendCalls with builder suffix baked into
 * calldata. Smart wallets (Farcaster / Base Account / EIP-7702) drop suffixes from
 * eth_sendTransaction and may ignore the dataSuffix capability.
 */
export async function sendSmartWalletWrite({
  connector,
  address,
  chainId = DEPLOY_CHAIN_ID,
  to,
  callData,
  value = 0n,
}: SendSmartWalletWriteArgs): Promise<Hex> {
  const provider = await connector.getProvider();
  if (
    !provider ||
    typeof provider !== "object" ||
    !("request" in provider) ||
    typeof provider.request !== "function"
  ) {
    throw new Error("Wallet provider unavailable.");
  }

  const taggedData = concat([callData, BUILDER_DATA_SUFFIX]);

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

  const id =
    typeof result === "string"
      ? result
      : (result as { id?: string })?.id;

  if (!id) {
    throw new Error("wallet_sendCalls did not return a batch id.");
  }

  return resolveSendCallsTxHash(id, chainId);
}
