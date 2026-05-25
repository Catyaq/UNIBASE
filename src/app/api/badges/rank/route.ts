import { unstable_cache } from "next/cache";
import { isAddress, type Address } from "viem";

import { isRankEligible, RANK_BADGES } from "@/config/badges";
import { fetchLeaderboard, rankForAddress } from "@/lib/fetchLeaderboard";
import {
  getRankSignerConfigured,
  rankSignatureDeadline,
  signRankBadgeMint,
} from "@/lib/signRankBadge";

const getCachedLeaderboard = unstable_cache(
  async () => fetchLeaderboard(),
  ["hub-leaderboard-rank"],
  { revalidate: 60 },
);

export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address || !isAddress(address)) {
    return Response.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const { configured, entries } = await getCachedLeaderboard();
    if (!configured) {
      return Response.json({ configured: false, rank: null, badges: {} });
    }

    const rank = rankForAddress(entries, address);
    const badges: Record<number, { eligible: boolean; rank: number | null }> =
      {};

    for (const badge of RANK_BADGES) {
      badges[badge.id] = {
        eligible: isRankEligible(rank, badge.threshold),
        rank,
      };
    }

    return Response.json({
      configured: true,
      rank,
      signerConfigured: getRankSignerConfigured(),
      badges,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to check rank";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { address?: string; badgeType?: number };
  try {
    body = (await request.json()) as { address?: string; badgeType?: number };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { address, badgeType } = body;
  if (!address || !isAddress(address)) {
    return Response.json({ error: "Invalid address" }, { status: 400 });
  }
  if (!badgeType || badgeType < 10 || badgeType > 12) {
    return Response.json({ error: "Invalid badgeType" }, { status: 400 });
  }

  if (!getRankSignerConfigured()) {
    return Response.json(
      {
        error:
          "Rank signer key invalid in Vercel — must be private key for 0xB3279A9FBb649825Ca1bc5e23d191C275A3D6462 (0x + 64 hex chars, no quotes or spaces).",
      },
      { status: 503 },
    );
  }

  try {
    const { configured, entries } = await getCachedLeaderboard();
    if (!configured) {
      return Response.json({ error: "Hub not configured" }, { status: 503 });
    }

    const rank = rankForAddress(entries, address);
    const badge = RANK_BADGES.find((b) => b.id === badgeType);
    if (!badge || !isRankEligible(rank, badge.threshold)) {
      return Response.json(
        { error: "Not eligible for this rank badge", rank },
        { status: 403 },
      );
    }

    const deadline = rankSignatureDeadline();
    const signature = await signRankBadgeMint(
      address as Address,
      badgeType,
      deadline,
    );

    return Response.json({
      signature,
      deadline: deadline.toString(),
      rank,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
