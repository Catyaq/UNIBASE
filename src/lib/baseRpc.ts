import { fallback, http } from "viem";
import { base } from "viem/chains";
import { createPublicClient } from "viem";

/** Public Base RPCs — rotate on failure; prefer BASE_RPC_URL (Alchemy/Infura) on Vercel */
const PUBLIC_BASE_RPC_URLS = [
  "https://base.llamarpc.com",
  "https://1rpc.io/base",
  "https://base-rpc.publicnode.com",
  "https://mainnet.base.org",
] as const;

export function createBasePublicClient() {
  const urls = [
    process.env.BASE_RPC_URL,
    ...PUBLIC_BASE_RPC_URLS,
  ].filter((url): url is string => Boolean(url?.trim()));

  const unique = [...new Set(urls)];

  return createPublicClient({
    chain: base,
    transport: fallback(
      unique.map((url) =>
        http(url, {
          timeout: 45_000,
          retryCount: 2,
          retryDelay: 400,
        }),
      ),
      { rank: true },
    ),
  });
}

export type BasePublicClient = ReturnType<typeof createBasePublicClient>;
