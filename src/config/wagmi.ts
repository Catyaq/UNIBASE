import { Attribution } from "ox/erc8021";
import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";

import { APP_NAME } from "@/config/app";
import { BUILDER_CODE } from "@/config/builderCode";
import { farcasterMiniApp } from "@/lib/farcasterMiniAppConnector";

const DATA_SUFFIX = Attribution.toDataSuffix({ codes: [BUILDER_CODE] });

export const chains = [base] as const;

export const wagmiConfig = createConfig({
  chains: [...chains],
  connectors: [
    farcasterMiniApp(),
    baseAccount({
      appName: APP_NAME,
    }),
    injected({ target: "metaMask" }),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
  dataSuffix: DATA_SUFFIX,
});

export function getConfig() {
  return wagmiConfig;
}

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
