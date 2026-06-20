import { Attribution } from "ox/erc8021";

/** Base Builder Code — https://docs.base.org/apps/builder-codes/app-developers */
export const BUILDER_CODE = "bc_r6fqwynm";

/** ERC-8021 suffix appended to calldata for Farcaster + browser attribution. */
export const BUILDER_DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
});
