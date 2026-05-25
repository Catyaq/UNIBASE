import sdk from "@farcaster/frame-sdk";
import { ChainNotConfiguredError, createConnector } from "wagmi";
import { fromHex, getAddress, numberToHex, SwitchChainError } from "viem";

import { withTimeout } from "@/lib/asyncTimeout";

const PROVIDER_REQUEST_TIMEOUT_MS = 4_000;

farcasterMiniApp.type = "farcasterMiniApp";

let accountsChanged:
  | ((accounts: readonly `0x${string}`[]) => void)
  | undefined;
let chainChanged: ((chain: string) => void) | undefined;
let disconnect: (() => void) | undefined;

type MiniAppProvider = typeof sdk.wallet.ethProvider;
type MiniAppProviderWithEvents = MiniAppProvider & {
  on: NonNullable<MiniAppProvider["on"]>;
  removeListener: NonNullable<MiniAppProvider["removeListener"]>;
};

function assertProviderHasEventEmitterMethods(
  provider: MiniAppProvider,
): asserts provider is MiniAppProviderWithEvents {
  if (typeof provider.on !== "function") {
    throw new Error("Farcaster mini app provider does not support event listeners.");
  }
  if (typeof provider.removeListener !== "function") {
    throw new Error(
      "Farcaster mini app provider does not support removing listeners.",
    );
  }
}

/** Embedded Farcaster mini app wallet (EIP-1193). */
export function farcasterMiniApp() {
  return createConnector<MiniAppProvider>((config) => ({
    id: "farcaster",
    name: "Farcaster",
    rdns: "xyz.farcaster.MiniAppWallet",
    icon: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/055c25d6-7fe7-4a49-abf9-49772021cf00/original",
    type: farcasterMiniApp.type,

    async connect({ chainId } = {}) {
      const provider = await this.getProvider();
      assertProviderHasEventEmitterMethods(provider);

      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      let targetChainId = chainId;
      if (!targetChainId) {
        const state = (await config.storage?.getItem("state")) ?? {};
        const isChainSupported = config.chains.some((x) => x.id === state.chainId);
        if (isChainSupported) targetChainId = state.chainId;
        else targetChainId = config.chains[0]?.id;
      }
      if (!targetChainId) throw new Error("No chains configured for Farcaster connector.");

      if (!accountsChanged) {
        const onAccountsChanged = this.onAccountsChanged.bind(this);
        accountsChanged = (accounts) => onAccountsChanged([...accounts]);
        provider.on("accountsChanged", accountsChanged);
      }
      if (!chainChanged) {
        chainChanged = this.onChainChanged.bind(this);
        provider.on("chainChanged", chainChanged);
      }
      if (!disconnect) {
        disconnect = this.onDisconnect.bind(this);
        provider.on("disconnect", disconnect);
      }

      let currentChainId = await this.getChainId();
      if (targetChainId && currentChainId !== targetChainId) {
        const chain = await this.switchChain!({ chainId: targetChainId });
        currentChainId = chain.id;
      }

      return {
        accounts: accounts.map((x) => getAddress(x)),
        chainId: currentChainId,
      } as never;
    },

    async disconnect() {
      const provider = await this.getProvider();
      assertProviderHasEventEmitterMethods(provider);

      if (accountsChanged) {
        provider.removeListener("accountsChanged", accountsChanged);
        accountsChanged = undefined;
      }
      if (chainChanged) {
        provider.removeListener("chainChanged", chainChanged);
        chainChanged = undefined;
      }
      if (disconnect) {
        provider.removeListener("disconnect", disconnect);
        disconnect = undefined;
      }
    },

    async getAccounts() {
      const provider = await this.getProvider();
      const accounts = await withTimeout(
        provider.request({ method: "eth_accounts" }),
        PROVIDER_REQUEST_TIMEOUT_MS,
        "Farcaster provider request timed out",
      );
      return accounts.map((x) => getAddress(x));
    },

    async getChainId() {
      const provider = await this.getProvider();
      const hexChainId = await provider.request({ method: "eth_chainId" });
      return fromHex(hexChainId, "number");
    },

    async isAuthorized() {
      try {
        const inside = await withTimeout(
          sdk.isInMiniApp(),
          3_000,
          "Farcaster host detection timed out",
        );
        if (!inside) return false;
        const accounts = await this.getAccounts();
        return accounts.length > 0;
      } catch {
        return false;
      }
    },

    async switchChain({ chainId }) {
      const provider = await this.getProvider();
      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) {
        throw new SwitchChainError(new ChainNotConfiguredError());
      }

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: numberToHex(chainId) }],
      });

      config.emitter.emit("change", { chainId });
      return chain;
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        this.onDisconnect();
      } else {
        config.emitter.emit("change", {
          accounts: accounts.map((x) => getAddress(x)),
        });
      }
    },

    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit("change", { chainId });
    },

    async onDisconnect() {
      config.emitter.emit("disconnect");
    },

    async getProvider() {
      return sdk.wallet.ethProvider;
    },
  }));
}
