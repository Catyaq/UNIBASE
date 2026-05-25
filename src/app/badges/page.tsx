import { BadgesApp } from "@/components/BadgesApp";

export default function BadgesPage() {
  return (
    <main className="uni-page flex min-h-[100dvh] flex-col px-4 py-8">
      <div className="uni-content uni-shell flex flex-col gap-3">
        <BadgesApp />
      </div>
    </main>
  );
}
