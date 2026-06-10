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

function getConnectableWallets(connectors: ReturnType<typeof useConnectors>) {
  const farcasterConnector = connectors.find((c) => c.id === "farcaster");
  const hasBaseAccount = connectors.some((c) => c.id === "baseAccount");

  const extensionConnectors = connectors.filter((c) => {
    if (c.id === "farcaster") return false;
    if (!hasBaseAccount) return true;
    // baseAccount already covers Base wallet; hide duplicate injected entries.
    if (c.id === "base" || c.name === "Base") return false;
    if (c.id === "injected") return false;
    return true;
  });

  return { farcasterConnector, extensionConnectors };
}

type ConnectWalletProps = {
  compact?: boolean;
};

export function ConnectWallet({ compact = false }: ConnectWalletProps) {
  const { address, isConnected, isConnecting, isReconnecting, connector } =
    useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();
  const { inMiniApp, user } = useFarcasterMiniApp();
  const [showPicker, setShowPicker] = useState(false);

  const { farcasterConnector, extensionConnectors } =
    getConnectableWallets(connectors);

  const handleDisconnect = (opts?: { openPicker?: boolean }) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(WALLET_USER_DISCONNECTED_KEY, "1");
    }
    disconnect();
    setShowPicker(opts?.openPicker ?? false);
  };

  const handleConnect = (connectorUid: string) => {
    const target = connectors.find((c) => c.uid === connectorUid);
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
    if (compact) {
      return (
        <div className="flex w-full items-center gap-2">
          <div className="uni-card-inset min-w-0 flex-1 px-2.5 py-2">
            <p className="uni-label truncate text-[0.625rem]">
              {user?.username && inMiniApp
                ? `@${user.username}`
                : (connector?.name ?? "Wallet")}
            </p>
            <p className="uni-mono truncate text-sm font-medium text-[var(--uni-text)]">
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDisconnect({ openPicker: true })}
            className="uni-btn uni-btn-secondary uni-btn-sm shrink-0"
          >
            Change
          </button>
        </div>
      );
    }

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
    <div className={`flex w-full flex-col ${compact ? "gap-2" : "gap-3"}`}>
      <p className={`uni-label text-center ${compact ? "text-[0.6875rem]" : ""}`}>
        {showPicker ? "Select a wallet" : "Connect wallet"}
      </p>

      {inMiniApp && farcasterConnector && (
        <button
          type="button"
          onClick={() => handleConnect(farcasterConnector.uid)}
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
          onClick={() => handleConnect(c.uid)}
          disabled={isConnecting || isPending}
          className="uni-btn uni-btn-secondary"
        >
          {c.name}
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
