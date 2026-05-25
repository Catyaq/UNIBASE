"use client";

import { useState } from "react";
import {
  useAccount,
  useConnect,
  useConnectors,
  useDisconnect,
} from "wagmi";

import { APP_SLUG } from "@/config/app";
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp";

const WALLET_USER_DISCONNECTED_KEY = `${APP_SLUG}_wallet_disconnected`;

export function ConnectWallet() {
  const { address, isConnected, isConnecting, isReconnecting, connector } =
    useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();
  const { inMiniApp, user } = useFarcasterMiniApp();
  const [showPicker, setShowPicker] = useState(false);

  const farcasterConnector = connectors.find((c) => c.id === "farcaster");
  const extensionConnectors = connectors.filter((c) => c.id !== "farcaster");

  const handleDisconnect = (opts?: { openPicker?: boolean }) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(WALLET_USER_DISCONNECTED_KEY, "1");
    }
    disconnect();
    setShowPicker(opts?.openPicker ?? false);
  };

  const handleConnect = (connectorId: string) => {
    const target = connectors.find((c) => c.id === connectorId);
    if (!target) return;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(WALLET_USER_DISCONNECTED_KEY);
    }
    connect({ connector: target });
    setShowPicker(false);
  };

  if (isReconnecting) {
    return (
      <p className="uni-caption text-center uni-pulse">Reconnecting wallet…</p>
    );
  }

  if (isConnected && !showPicker) {
    return (
      <div className="flex w-full flex-col items-center gap-4">
        {user?.username && inMiniApp && (
          <p className="uni-caption uni-text-accent">@{user.username}</p>
        )}
        <div className="uni-card-inset w-full px-4 py-3">
          <p className="uni-label">{connector?.name ?? "Wallet"}</p>
          <p className="uni-mono mt-1 truncate text-base font-medium text-[var(--uni-text)]">
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </p>
        </div>
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={() => handleDisconnect()}
            className="uni-btn uni-btn-secondary uni-btn-sm flex-1"
          >
            Disconnect
          </button>
          <button
            type="button"
            onClick={() => handleDisconnect({ openPicker: true })}
            className="uni-btn uni-btn-primary uni-btn-sm flex-1"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="uni-label text-center">
        {showPicker ? "Select a wallet" : "Connect wallet"}
      </p>

      {inMiniApp && farcasterConnector && (
        <button
          type="button"
          onClick={() => handleConnect("farcaster")}
          disabled={isConnecting || isPending}
          className="uni-btn uni-btn-primary"
        >
          Farcaster wallet
        </button>
      )}

      {extensionConnectors.map((c) => (
        <button
          key={c.uid}
          type="button"
          onClick={() => handleConnect(c.id)}
          disabled={isConnecting || isPending}
          className="uni-btn uni-btn-secondary"
        >
          {c.name}
          {c.id === "injected" ? " (browser)" : ""}
        </button>
      ))}

      {showPicker && isConnected && (
        <button
          type="button"
          onClick={() => setShowPicker(false)}
          className="uni-btn uni-btn-ghost w-full"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
