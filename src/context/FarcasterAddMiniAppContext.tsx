"use client";

import sdk from "@farcaster/frame-sdk";
import { AddMiniApp } from "@farcaster/miniapp-core";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { APP_NAME, APP_SLUG } from "@/config/app";
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp";

const DECLINED_SESSION_KEY = `${APP_SLUG}_pin_declined`;

type FarcasterAddMiniAppContextValue = {
  promptAddMiniApp: () => Promise<
    | { ok: true }
    | { ok: false; reason: "not_mini_app" | "already_added" | "rejected" | "manifest" | "error" }
  >;
  dismissPinPrompt: () => void;
  showPinPrompt: boolean;
  isPending: boolean;
  status: string | null;
  isAdded: boolean;
};

const FarcasterAddMiniAppContext =
  createContext<FarcasterAddMiniAppContextValue | null>(null);

export function FarcasterAddMiniAppProvider({ children }: { children: ReactNode }) {
  const { inMiniApp, isSdkReady, context, refreshContext } = useFarcasterMiniApp();
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [localAdded, setLocalAdded] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const pinPromptShownRef = useRef(false);

  const isAdded = context?.client?.added === true || localAdded;

  const dismissPinPrompt = useCallback(() => {
    setShowPinPrompt(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DECLINED_SESSION_KEY, "1");
    }
  }, []);

  useEffect(() => {
    if (!isSdkReady) return;

    const onAdded = () => {
      setLocalAdded(true);
      setShowPinPrompt(false);
      setStatus("Mini app pinned");
      void refreshContext();
    };
    const onRejected = () => setStatus("Pin cancelled");
    const onRemoved = () => {
      setLocalAdded(false);
      void refreshContext();
    };

    sdk.on("miniAppAdded", onAdded);
    sdk.on("miniAppAddRejected", onRejected);
    sdk.on("miniAppRemoved", onRemoved);

    return () => {
      sdk.removeListener("miniAppAdded", onAdded);
      sdk.removeListener("miniAppAddRejected", onRejected);
      sdk.removeListener("miniAppRemoved", onRemoved);
    };
  }, [isSdkReady, refreshContext]);

  useEffect(() => {
    if (pinPromptShownRef.current) return;
    if (!inMiniApp || !isSdkReady) return;
    if (isAdded) return;
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem(DECLINED_SESSION_KEY) === "1"
    ) {
      return;
    }

    pinPromptShownRef.current = true;
    setShowPinPrompt(true);
  }, [inMiniApp, isSdkReady, isAdded]);

  const promptAddMiniApp = useCallback(async () => {
    if (!inMiniApp || !isSdkReady) {
      return { ok: false as const, reason: "not_mini_app" as const };
    }
    if (isAdded) {
      return { ok: false as const, reason: "already_added" as const };
    }

    setIsPending(true);
    setStatus(null);
    try {
      await sdk.actions.addMiniApp();
      setLocalAdded(true);
      setShowPinPrompt(false);
      setStatus(`${APP_NAME} pinned`);
      await refreshContext();
      return { ok: true as const };
    } catch (e) {
      if (e instanceof AddMiniApp.RejectedByUser) {
        setStatus("You declined");
        return { ok: false as const, reason: "rejected" as const };
      }
      if (e instanceof AddMiniApp.InvalidDomainManifest) {
        setStatus("Manifest error — check farcaster.json");
        return { ok: false as const, reason: "manifest" as const };
      }
      setStatus(e instanceof Error ? e.message : "Could not pin app");
      return { ok: false as const, reason: "error" as const };
    } finally {
      setIsPending(false);
    }
  }, [inMiniApp, isAdded, isSdkReady, refreshContext]);

  const value: FarcasterAddMiniAppContextValue = {
    promptAddMiniApp,
    dismissPinPrompt,
    showPinPrompt,
    isPending,
    status,
    isAdded,
  };

  return (
    <FarcasterAddMiniAppContext.Provider value={value}>
      {children}
    </FarcasterAddMiniAppContext.Provider>
  );
}

export function useFarcasterAddMiniApp(): FarcasterAddMiniAppContextValue {
  const ctx = useContext(FarcasterAddMiniAppContext);
  if (!ctx) {
    throw new Error(
      "useFarcasterAddMiniApp must be used within FarcasterAddMiniAppProvider",
    );
  }
  return ctx;
}
