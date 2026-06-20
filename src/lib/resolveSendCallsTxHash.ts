import { getConnectorClient } from "wagmi/actions";
import { getCallsStatus, waitForCallsStatus } from "viem/actions";
import type { Hex } from "viem";

import { DEPLOY_CHAIN_ID } from "@/config/contract";
import { getConfig } from "@/config/wagmi";

/** Resolve a tx hash from a `wallet_sendCalls` batch id (or viem fallback id). */
export async function resolveSendCallsTxHash(
  id: string,
  chainId: typeof DEPLOY_CHAIN_ID = DEPLOY_CHAIN_ID,
): Promise<Hex> {
  const config = getConfig();
  const client = await getConnectorClient(config, { chainId });

  try {
    const status = await waitForCallsStatus(client, {
      id,
      timeout: 120_000,
    });
    const hash = status.receipts?.[0]?.transactionHash;
    if (hash) return hash;
  } catch {
    // Some wallets return a fallback id that is readable immediately.
  }

  const status = await getCallsStatus(client, { id });
  const hash = status.receipts?.[0]?.transactionHash;
  if (hash) return hash;

  throw new Error("Could not resolve transaction hash from wallet_sendCalls batch.");
}
