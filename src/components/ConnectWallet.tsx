"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

import { APP_SLUG } from "@/config/app";
import { DEPLOY_CHAIN_ID } from "@/config/contract";
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp";

const WALLET_USER_DISCONNECTED_KEY = `${APP_SLUG}_wallet_disconnected`;

function getConnectableWallets(connectors: ReturnType<typeof useConnectors>) {
  const farcasterConnector = connectors.find((c) => c.id === "farcaster");
  const extensionConnectors = connectors.filter((c) => c.id !== "farcaster");

  return { farcasterConnector, extensionConnectors };
}

type ConnectWalletProps = {
  compact?: boolean;
};

export function ConnectWallet({ compact = false }: ConnectWalletProps) {
  const { address, isConnected, isConnecting, isReconnecting, connector } =
    useAccount();
  const chainId = useChainId();
  const { connect, isPending } = useConnect();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();
  const { inMiniApp, user } = useFarcasterMiniApp();
  const [showPicker, setShowPicker] = useState(false);

  const { farcasterConnector, extensionConnectors } =
    getConnectableWallets(connectors);

  useEffect(() => {
    if (inMiniApp || !isConnected || isConnecting || isReconnecting) return;
    if (chainId === DEPLOY_CHAIN_ID) return;
    switchChain({ chainId: DEPLOY_CHAIN_ID });
  }, [
    chainId,
    inMiniApp,
    isConnected,
    isConnecting,
    isReconnecting,
    switchChain,
  ]);

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
    connect({ connector: target, chainId: DEPLOY_CHAIN_ID });
    setShowPicker(false);
  };

  if (isReconnecting) {
    return (
      <p className="uni-caption text-center uni-pulse">Reconnecting wallet…</p>
    );
  }

  if (isConnected && !showPicker) {
    if (compact) {
      const walletLabel =
        user?.username && inMiniApp
          ? `@${user.username}`
          : (connector?.name ?? "Wallet");

      return (
        <div className="uni-wallet-bar">
          <div className="uni-wallet-bar-info">
            <p className="uni-wallet-bar-label">{walletLabel}</p>
            <p className="uni-wallet-bar-address">
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDisconnect({ openPicker: true })}
            className="uni-wallet-bar-change"
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
      <p
        className={
          compact
            ? "uni-wallet-picker-label"
            : "uni-label text-center"
        }
      >
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
          className={`uni-btn uni-btn-ghost ${compact ? "uni-btn-inline mx-auto" : "w-full"}`}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
