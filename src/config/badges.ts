export type BadgeKind = "gm" | "deploy" | "points" | "rank";

export type BadgeTier = "bronze" | "silver" | "gold";

export type BadgeMintMode = "hub" | "rank";

export type BadgeDefinition = {
  id: number;
  kind: BadgeKind;
  threshold: number;
  title: string;
  description: string;
  mintMode: BadgeMintMode;
};

/** On-chain badgeType ids 1–12 (see BadgeNFT.sol) */
export const BADGES: readonly BadgeDefinition[] = [
  {
    id: 1,
    kind: "gm",
    threshold: 10,
    title: "GM ×10",
    description: "Complete 10 GMs in the app",
    mintMode: "hub",
  },
  {
    id: 2,
    kind: "gm",
    threshold: 20,
    title: "GM ×20",
    description: "Complete 20 GMs in the app",
    mintMode: "hub",
  },
  {
    id: 3,
    kind: "gm",
    threshold: 50,
    title: "GM ×50",
    description: "Complete 50 GMs in the app",
    mintMode: "hub",
  },
  {
    id: 4,
    kind: "deploy",
    threshold: 10,
    title: "Deploy ×10",
    description: "Deploy 10 tokens via the hub",
    mintMode: "hub",
  },
  {
    id: 5,
    kind: "deploy",
    threshold: 20,
    title: "Deploy ×20",
    description: "Deploy 20 tokens via the hub",
    mintMode: "hub",
  },
  {
    id: 6,
    kind: "deploy",
    threshold: 50,
    title: "Deploy ×50",
    description: "Deploy 50 tokens via the hub",
    mintMode: "hub",
  },
  {
    id: 7,
    kind: "points",
    threshold: 100,
    title: "Points ×100",
    description: "Earn 100 total points in the app",
    mintMode: "hub",
  },
  {
    id: 8,
    kind: "points",
    threshold: 500,
    title: "Points ×500",
    description: "Earn 500 total points in the app",
    mintMode: "hub",
  },
  {
    id: 9,
    kind: "points",
    threshold: 1000,
    title: "Points ×1000",
    description: "Earn 1000 total points in the app",
    mintMode: "hub",
  },
  {
    id: 10,
    kind: "rank",
    threshold: 10,
    title: "Top 10",
    description: "Reach top 10 on the leaderboard",
    mintMode: "rank",
  },
  {
    id: 11,
    kind: "rank",
    threshold: 50,
    title: "Top 50",
    description: "Reach top 50 on the leaderboard",
    mintMode: "rank",
  },
  {
    id: 12,
    kind: "rank",
    threshold: 100,
    title: "Top 100",
    description: "Reach top 100 on the leaderboard",
    mintMode: "rank",
  },
] as const;

export const GM_BADGES = BADGES.filter((b) => b.kind === "gm");
export const DEPLOY_BADGES = BADGES.filter((b) => b.kind === "deploy");
export const POINTS_BADGES = BADGES.filter((b) => b.kind === "points");
export const RANK_BADGES = BADGES.filter((b) => b.kind === "rank");

/** Max rank required to mint a rank badge (badge threshold = max rank) */
export function isRankEligible(userRank: number | null, maxRank: number): boolean {
  if (userRank == null) return false;
  return userRank <= maxRank;
}

/** Bronze / silver / gold within each badge category (3 tiers per kind) */
export function badgeTier(badge: BadgeDefinition): BadgeTier {
  const inKind = BADGES.filter((b) => b.kind === badge.kind).sort(
    (a, b) => a.threshold - b.threshold,
  );
  const index = inKind.findIndex((b) => b.id === badge.id);
  if (index < 0) return "bronze";

  if (badge.kind === "rank") {
    if (index === 0) return "gold";
    if (index === 1) return "silver";
    return "bronze";
  }

  if (index === 0) return "bronze";
  if (index === 1) return "silver";
  return "gold";
}

export function badgeTierLabel(tier: BadgeTier): string {
  switch (tier) {
    case "bronze":
      return "Bronze";
    case "silver":
      return "Silver";
    case "gold":
      return "Gold";
  }
}
