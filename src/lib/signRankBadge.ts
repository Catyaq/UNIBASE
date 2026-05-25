import { encodePacked, keccak256, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const SIGNATURE_TTL_SEC = 60 * 15;

export function getRankSignerConfigured(): boolean {
  return Boolean(process.env.BADGE_RANK_SIGNER_PRIVATE_KEY);
}

function getRankSignerAccount() {
  const key = process.env.BADGE_RANK_SIGNER_PRIVATE_KEY;
  if (!key?.startsWith("0x")) return null;
  return privateKeyToAccount(key as Hex);
}

export function rankSignatureDeadline(): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + SIGNATURE_TTL_SEC);
}

export async function signRankBadgeMint(
  user: Address,
  badgeType: number,
  deadline: bigint,
): Promise<Hex | null> {
  const account = getRankSignerAccount();
  if (!account) return null;

  const digest = keccak256(
    encodePacked(
      ["address", "uint256", "uint256"],
      [user, BigInt(badgeType), deadline],
    ),
  );

  return account.signMessage({ message: { raw: digest } });
}

export { SIGNATURE_TTL_SEC };
