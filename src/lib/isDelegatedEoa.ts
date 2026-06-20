import type { Address, Hex } from "viem";

/** EIP-7702 delegation indicator prefix (`0xef0100 || delegate`). */
const DELEGATION_PREFIX = "0xef0100";

type CodeReader = {
  getCode: (args: { address: Address }) => Promise<Hex | undefined>;
};

export async function isDelegatedEoa(
  publicClient: CodeReader | undefined,
  address: Address | undefined,
): Promise<boolean> {
  if (!publicClient || !address) return false;
  const code = await publicClient.getCode({ address });
  return code?.toLowerCase().startsWith(DELEGATION_PREFIX) ?? false;
}
