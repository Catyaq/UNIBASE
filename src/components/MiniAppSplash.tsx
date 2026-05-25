"use client";

import { APP_NAME } from "@/config/app";
import { AppLogo } from "@/components/AppLogo";

export function MiniAppSplash() {
  return (
    <div
      className="uni-page fixed inset-0 z-[10000] flex min-h-[100dvh] items-center justify-center"
      role="presentation"
      aria-hidden
    >
      <div className="flex flex-col items-center gap-4">
        <AppLogo size={112} className="uni-pulse shadow-[0_0_48px_rgba(255,0,122,0.35)]" />
        <p className="uni-heading text-lg uni-pulse">{APP_NAME}</p>
        <p className="uni-caption uni-pulse">Loading…</p>
      </div>
    </div>
  );
}
