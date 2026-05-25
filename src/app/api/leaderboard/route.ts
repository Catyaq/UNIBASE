import { unstable_cache } from "next/cache";

import { fetchLeaderboard } from "@/lib/fetchLeaderboard";

const getCachedLeaderboard = unstable_cache(
  async () => fetchLeaderboard(),
  ["hub-leaderboard"],
  { revalidate: 60 },
);

export const revalidate = 60;

export async function GET() {
  try {
    const { configured, entries } = await getCachedLeaderboard();
    return Response.json({
      configured,
      entries,
      total: entries.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load leaderboard";
    return Response.json(
      { configured: true, entries: [], total: 0, error: message },
      { status: 503 },
    );
  }
}
