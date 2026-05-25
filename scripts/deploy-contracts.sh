#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-$ROOT/.env.local}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

NETWORK="${1:-base_sepolia}"
DRY_RUN="${DRY_RUN:-0}"

case "$NETWORK" in
  base)
    RPC_URL="${BASE_RPC_URL:-https://mainnet.base.org}"
    CHAIN_ID=8453
    ;;
  base_sepolia)
    RPC_URL="${BASE_SEPOLIA_RPC_URL:-https://sepolia.base.org}"
    CHAIN_ID=84532
    ;;
  *)
    echo "Unknown network: $NETWORK (use base or base_sepolia)" >&2
    exit 1
    ;;
esac

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "Set PRIVATE_KEY in .env.local (deployer wallet, with ETH on $NETWORK)" >&2
  exit 1
fi

if [[ -z "${RANK_SIGNER:-}" && -n "${BADGE_RANK_SIGNER_PRIVATE_KEY:-}" ]]; then
  RANK_SIGNER="$(cast wallet address --private-key "$BADGE_RANK_SIGNER_PRIVATE_KEY")"
  export RANK_SIGNER
fi

if [[ -z "${RANK_SIGNER:-}" ]]; then
  echo "Set RANK_SIGNER or BADGE_RANK_SIGNER_PRIVATE_KEY in .env.local" >&2
  exit 1
fi

echo "Network:     $NETWORK (chain $CHAIN_ID)"
echo "RPC:         $RPC_URL"
echo "Rank signer: $RANK_SIGNER"
echo ""

forge build

ARGS=(
  script contracts/script/Deploy.s.sol:Deploy
  --rpc-url "$RPC_URL"
  --chain-id "$CHAIN_ID"
  --private-key "$PRIVATE_KEY"
  -vvvv
)

if [[ "$DRY_RUN" == "1" ]]; then
  echo "DRY_RUN=1 — simulating only (no broadcast)"
  forge "${ARGS[@]}"
else
  forge "${ARGS[@]}" --broadcast
  node "$ROOT/scripts/sync-deployments.mjs" "$NETWORK"
fi
