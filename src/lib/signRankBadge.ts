import { encodePacked, keccak256, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

/** Must match BadgeNFT.rankSigner on Base */
export const RANK_SIGNER_ADDRESS =
  "0xB3279A9FBb649825Ca1bc5e23d191C275A3D6462" as const;

const SIGNATURE_TTL_SEC = 60 * 15;

function normalizePrivateKey(raw: string | undefined): Hex | null {
  if (!raw) return null;

  let key = raw.trim().replace(/^["']|["']$/g, "").replace(/\s/g, "");
  if (!key.startsWith("0x")) {
    key = `0x${key}`;
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    return null;
  }

  return key as Hex;
}

function getRankSignerAccount() {
  const key = normalizePrivateKey(process.env.BADGE_RANK_SIGNER_PRIVATE_KEY);
  if (!key) return null;

  try {
    const account = privateKeyToAccount(key);
    if (account.address.toLowerCase() !== RANK_SIGNER_ADDRESS.toLowerCase()) {
      return null;
    }
    return account;
  } catch {
    return null;
  }
}

export function getRankSignerConfigured(): boolean {
  return getRankSignerAccount() != null;
}

export function rankSignatureDeadline(): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + SIGNATURE_TTL_SEC);
}

export async function signRankBadgeMint(
  user: Address,
  badgeType: number,
  deadline: bigint,
): Promise<Hex> {
  const account = getRankSignerAccount();
  if (!account) {
    throw new Error(
      "Rank signer key invalid or wrong wallet — use the private key for 0xB3279A9FBb649825Ca1bc5e23d191C275A3D6462 in Vercel (0x + 64 hex, no spaces).",
    );
  }

  const digest = keccak256(
    encodePacked(
      ["address", "uint256", "uint256"],
      [user, BigInt(badgeType), deadline],
    ),
  );

  return account.signMessage({ message: { raw: digest } });
}

export { SIGNATURE_TTL_SEC };
