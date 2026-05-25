"use client";

import { AppLogo } from "@/components/AppLogo";
import { APP_NAME } from "@/config/app";
import { useFarcasterAddMiniApp } from "@/hooks/useFarcasterAddMiniApp";

export function FarcasterPinModal() {
  const {
    showPinPrompt,
    isPending,
    status,
    promptAddMiniApp,
    dismissPinPrompt,
    isAdded,
  } = useFarcasterAddMiniApp();

  if (!showPinPrompt || isAdded) return null;

  return (
    <div className="uni-overlay fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <div className="uni-card w-full max-w-sm p-6" style={{ boxShadow: "var(--uni-shadow-modal)" }}>
        <div className="flex flex-col items-center text-center">
          <AppLogo size={80} className="shadow-[0_0_32px_rgba(255,0,122,0.28)]" />
          <h2 className="uni-heading mt-4">Pin {APP_NAME}</h2>
          <p className="uni-body mt-2">
            Add this mini app to Farcaster for quick access from your feed.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => void promptAddMiniApp()}
            className="uni-btn uni-btn-primary"
          >
            {isPending ? "Opening…" : "Pin app"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={dismissPinPrompt}
            className="uni-btn uni-btn-ghost w-full"
          >
            Not now
          </button>
        </div>

        {status ? (
          <p className="uni-caption mt-4 text-center">{status}</p>
        ) : null}
      </div>
    </div>
  );
}
