import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";

import { APP_NAME } from "@/config/app";
import { BUILDER_DATA_SUFFIX } from "@/config/builderCode";
import { farcasterMiniApp } from "@/lib/farcasterMiniAppConnector";

export const chains = [base] as const;

export const wagmiConfig = createConfig({
  chains: [...chains],
  dataSuffix: BUILDER_DATA_SUFFIX,
  connectors: [
    farcasterMiniApp(),
    baseAccount({
      appName: APP_NAME,
    }),
    injected({ target: "metaMask" }),
    injected(),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
});

export function getConfig() {
  return wagmiConfig;
}

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
