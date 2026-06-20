import { useCallback } from "react";
import {
  useWriteContract,
  type UseWriteContractParameters,
  type UseWriteContractReturnType,
} from "wagmi";

import { BUILDER_DATA_SUFFIX } from "@/config/builderCode";

/**
 * Wagmi's config-level `dataSuffix` is not forwarded to connector wallet clients,
 * so we attach the Base Builder Code on every contract write explicitly.
 */
export function useWriteContractWithBuilderCode(
  parameters?: UseWriteContractParameters,
): UseWriteContractReturnType {
  const result = useWriteContract(parameters);

  const writeContract = useCallback<
    UseWriteContractReturnType["writeContract"]
  >(
    (variables, options) =>
      result.writeContract(
        { ...variables, dataSuffix: BUILDER_DATA_SUFFIX },
        options,
      ),
    [result.writeContract],
  );

  const writeContractAsync = useCallback<
    UseWriteContractReturnType["writeContractAsync"]
  >(
    (variables, options) =>
      result.writeContractAsync(
        { ...variables, dataSuffix: BUILDER_DATA_SUFFIX },
        options,
      ),
    [result.writeContractAsync],
  );

  return { ...result, writeContract, writeContractAsync };
}
