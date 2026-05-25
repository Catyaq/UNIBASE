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

export type RankSignerStatus = {
  configured: boolean;
  reason?:
    | "missing"
    | "invalid_format"
    | "invalid_key"
    | "wrong_wallet";
  expectedAddress?: typeof RANK_SIGNER_ADDRESS;
};

export function getRankSignerStatus(): RankSignerStatus {
  const raw = process.env.BADGE_RANK_SIGNER_PRIVATE_KEY;
  if (!raw?.trim()) {
    return { configured: false, reason: "missing" };
  }

  const key = normalizePrivateKey(raw);
  if (!key) {
    return { configured: false, reason: "invalid_format" };
  }

  try {
    const account = privateKeyToAccount(key);
    if (account.address.toLowerCase() !== RANK_SIGNER_ADDRESS.toLowerCase()) {
      return {
        configured: false,
        reason: "wrong_wallet",
        expectedAddress: RANK_SIGNER_ADDRESS,
      };
    }
    return { configured: true };
  } catch {
    return { configured: false, reason: "invalid_key" };
  }
}

export function getRankSignerConfigured(): boolean {
  return getRankSignerStatus().configured;
}

export function rankSignerStatusMessage(status: RankSignerStatus): string {
  switch (status.reason) {
    case "missing":
      return "Add BADGE_RANK_SIGNER_PRIVATE_KEY in Vercel, then redeploy.";
    case "invalid_format":
      return "Key must be 0x + 64 hex characters (no spaces or quotes).";
    case "invalid_key":
      return "Private key is not valid — check BADGE_RANK_SIGNER_PRIVATE_KEY in Vercel.";
    case "wrong_wallet":
      return `Key must be for rank signer ${status.expectedAddress ?? RANK_SIGNER_ADDRESS}, not another wallet.`;
    default:
      return "Rank signer ready.";
  }
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
