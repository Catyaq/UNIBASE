import { getConnectorClient } from "wagmi/actions";
import { getCallsStatus, waitForCallsStatus } from "viem/actions";
import type { Hex } from "viem";

import { DEPLOY_CHAIN_ID } from "@/config/contract";
import { getConfig } from "@/config/wagmi";
import { isTransactionHash } from "@/lib/transactionHash";

/** Resolve a tx hash from a `wallet_sendCalls` batch id. */
export async function resolveSendCallsTxHash(
  id: string,
  chainId: typeof DEPLOY_CHAIN_ID = DEPLOY_CHAIN_ID,
): Promise<Hex> {
  if (isTransactionHash(id)) return id;

  const config = getConfig();
  const client = await getConnectorClient(config, { chainId });

  try {
    const status = await waitForCallsStatus(client, {
      id,
      timeout: 15_000,
    });
    const hash = status.receipts?.[0]?.transactionHash;
    if (hash) return hash;
  } catch {
    // Fallback ids can be resolved immediately via getCallsStatus.
  }

  const status = await getCallsStatus(client, { id });
  const hash = status.receipts?.[0]?.transactionHash;
  if (hash) return hash;

  throw new Error("Could not resolve transaction hash from wallet_sendCalls batch.");
}
