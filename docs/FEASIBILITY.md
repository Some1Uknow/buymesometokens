# MVP technical feasibility

## Verdict

The product is feasible on Galileo as a closed beta. 0G Chain is EVM-compatible, the current TypeScript storage SDK supports in-memory data and browser builds, and native-value settlement is conventional Solidity. The hard part is operational reliability, not protocol novelty.

The original proposal was not deployable unchanged. The relayer would have been recorded as the agent wallet, Solidity `transfer` can fail for contract recipients, arbitrary recipients were tippable, signature challenges were replay-prone, and a public directory cannot reliably scan all events on every request.

Network metadata is unusually inconsistent: official repositories still publish `16601`, while a live `eth_chainId` request to `https://evmrpc-testnet.0g.ai` returned `16602` (`0x40da`) on 2026-06-20. This build uses `16602` and keeps it environment-configurable. Deployment must refuse to proceed if the configured and RPC-reported chain IDs differ.

## Implemented architecture

1. Registration canonicalizes and uploads a versioned profile to 0G Storage.
2. The owner signs EIP-712 registration data. It expires after one hour and includes the on-chain nonce and exact storage root.
3. A sponsored relayer submits the signature. `SignatureChecker` supports EOAs and ERC-1271 contract wallets.
4. The registry activates the wallet; only active registry wallets can be paid through `TipJar`.
5. Tip messages are capped at 280 characters and uploaded by the backend before the user's single tip transaction.
6. An authenticated incremental indexer projects events into PostgreSQL in bounded block ranges. It can be rebuilt from chain history.

## Beta constraints

- Galileo and its faucet, public RPC, indexer, and storage nodes are external availability dependencies. Use retries, monitoring, and a second RPC before promising an SLA.
- Sponsored storage is an abuse surface. Durable IP/wallet rate limits, quotas, and a kill switch are required before opening registration broadly.
- Storage persistence/replication economics must be measured with real uploads. A Merkle root proves integrity, not permanent retrievability by itself.
- Public messages need terms, reporting, and moderation. Content-addressed decentralized storage makes deletion guarantees difficult.
- The relayer is non-custodial but operationally privileged: it pays costs and can delay activation. It cannot alter a signed wallet/root tuple.
- The current directory is eventually consistent on the cron interval. Settlement itself is immediate and does not depend on the database.
- The 0G SDK currently declares stale transitive HTTP/WebSocket versions. This project pins patched `axios` and `ws` overrides; every SDK upgrade must rerun the production audit and storage round-trip test.

## Go/no-go gates

- Contract tests, static analysis, source verification, and an independent review pass.
- 100 registration/upload/claim round trips and 500 tips on Galileo with measured p50/p95 latency and failure rates.
- Rebuild the database from deployment block and compare totals with an independent log query.
- Alert on relayer balance, sync lag, storage retrieval failures, failed activations, and anomalous upload volume.
- Explicitly label the beta as testnet-only until mainnet endpoints, token acquisition, fees, and storage retention are validated.
