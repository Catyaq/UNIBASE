import type { Hex } from "viem";
import { concat } from "viem";

import { BUILDER_DATA_SUFFIX } from "@/config/builderCode";

type ProviderRequest = {
  method: string;
  params?: unknown[];
};

type ProviderLike = {
  request: (args: ProviderRequest) => Promise<unknown>;
  on?: (...args: unknown[]) => unknown;
  removeListener?: (...args: unknown[]) => unknown;
};

const suffixBody = BUILDER_DATA_SUFFIX.slice(2).toLowerCase();

function withTaggedCalldata(data: Hex | undefined): Hex | undefined {
  if (!data) return data;
  const body = data.toLowerCase().replace(/^0x/, "");
  if (body.endsWith(suffixBody)) return data;
  return concat([data, BUILDER_DATA_SUFFIX]);
}

function tagEthSendTransactionParams(params: unknown[] | undefined) {
  const tx = (params?.[0] ?? {}) as { data?: Hex };
  if (!tx.data) return params;
  return [{ ...tx, data: withTaggedCalldata(tx.data) }];
}

function tagSendCallsParams(params: unknown[] | undefined) {
  const batch = (params?.[0] ?? {}) as {
    calls?: Array<{ data?: Hex; to?: Hex; value?: Hex }>;
    capabilities?: Record<string, unknown>;
  };

  if (batch.calls) {
    batch.calls = batch.calls.map((call) => ({
      ...call,
      data: withTaggedCalldata(call.data),
    }));
  }

  batch.capabilities = {
    ...batch.capabilities,
    dataSuffix: {
      value: BUILDER_DATA_SUFFIX,
      optional: true,
    },
  };

  return [batch];
}

/** Append ERC-8021 builder suffix to outgoing wallet transactions. */
export function withBuilderAttribution<T extends ProviderLike>(provider: T): T {
  const request = provider.request.bind(provider);

  return {
    ...provider,
    request: async (args: ProviderRequest) => {
      if (args.method === "wallet_sendCalls") {
        return request({
          ...args,
          params: tagSendCallsParams(args.params),
        });
      }

      if (args.method === "eth_sendTransaction") {
        return request({
          ...args,
          params: tagEthSendTransactionParams(args.params),
        });
      }

      return request(args);
    },
  };
}
