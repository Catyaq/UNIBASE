"use client";

import dynamic from "next/dynamic";
import type { State } from "wagmi";

const DynamicProviders = dynamic(
  () => import("./providers").then((m) => m.Providers),
  { ssr: false },
);

export function ProvidersShell({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  return (
    <DynamicProviders initialState={initialState}>{children}</DynamicProviders>
  );
}
