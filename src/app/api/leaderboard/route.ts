import { fetchLeaderboard } from "@/lib/fetchLeaderboard";

export const revalidate = 30;

export async function GET() {
  try {
    const { configured, entries } = await fetchLeaderboard();
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
      { status: 500 },
    );
  }
}
