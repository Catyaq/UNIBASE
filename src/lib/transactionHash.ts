import type { Hex } from "viem";

const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

export function isTransactionHash(value: string): value is Hex {
  return TX_HASH_RE.test(value);
}
