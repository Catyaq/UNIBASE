"use client";

import { useEffect, useRef } from "react";
import { useConnection, useDisconnect, useReconnect } from "wagmi";

import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp";

import { APP_SLUG } from "@/config/app";

const WALLET_USER_DISCONNECTED_KEY = `${APP_SLUG}_wallet_disconnected`;
const STUCK_CONNECT_MS = 12_000;

export function WalletAutoReconnect() {
  const { inMiniApp, isSdkReady, isLoading } = useFarcasterMiniApp();
  const { address, isConnecting, isReconnecting, status } = useConnection();
  const { mutate: reconnect } = useReconnect();
  const { disconnect } = useDisconnect();
  const didAutoReconnect = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(WALLET_USER_DISCONNECTED_KEY) === "1") return;
    if (inMiniApp && isLoading) return;
    if (inMiniApp && !isSdkReady) return;
    if (didAutoReconnect.current) return;
    if (status !== "disconnected") return;

    didAutoReconnect.current = true;
    reconnect();
  }, [inMiniApp, isLoading, isSdkReady, reconnect, status]);

  useEffect(() => {
    if (!isConnecting && !isReconnecting) return;
    if (address) return;

    const timer = window.setTimeout(() => disconnect(), STUCK_CONNECT_MS);
    return () => window.clearTimeout(timer);
  }, [address, disconnect, isConnecting, isReconnecting]);

  return null;
}
