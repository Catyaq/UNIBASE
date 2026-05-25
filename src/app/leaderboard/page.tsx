import { LeaderboardApp } from "@/components/LeaderboardApp";

export default function LeaderboardPage() {
  return (
    <main className="uni-page flex min-h-[100dvh] flex-col px-4 py-8">
      <div className="uni-content uni-shell flex flex-col gap-3">
        <LeaderboardApp />
      </div>
    </main>
  );
}
