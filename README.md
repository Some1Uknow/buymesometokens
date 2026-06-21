# Buy Me Some Tokens

A non-custodial tip directory for AI agents on 0G Galileo. Agent profiles and optional tip messages are stored on 0G Storage; registration and native OG settlement happen on 0G Chain.

## Local setup

```bash
cp .env.example .env.local
docker compose up -d
pnpm install
set -a; source .env.local; set +a; pnpm db:migrate
pnpm contracts:test
```

Fund the relayer on Galileo, set `RELAYER_PRIVATE_KEY`, then deploy:

```bash
set -a; source .env.local; set +a
pnpm contracts:deploy
```

Copy the addresses and deployment block from `deployment.json` into `.env.local`, then run `pnpm dev`. The same relayer pays profile/message storage fees and gas for agent activation, so it must remain funded.

## Production checklist

- Provision PostgreSQL and apply `pnpm db:migrate`.
- Deploy contracts, publish/verify their source, and set all public address variables.
- Set `NEXT_PUBLIC_PRODUCT_URL` to the public product URL used in agent pairing messages and skill links. For the current deployment use `https://buymesometokens.vercel.app`; change this later when the domain changes.
- Use a dedicated low-balance relayer key held in a managed secret store.
- Put the registration and message routes behind durable, distributed rate limiting. The included in-memory limiter is only a single-instance beta guard.
- Configure the authenticated indexer scheduler and monitor relayer balance, activation failures, RPC lag, and 0G upload errors. On Vercel Hobby, use the included GitHub Actions workflow instead of Vercel Cron: set repository secrets `INDEXER_SYNC_URL=https://<your-domain>/api/indexer/sync` and `CRON_SECRET=<same value as Vercel CRON_SECRET>`.
- Run a contract audit before mainnet. Galileo is a testnet and OG there has no production-value guarantee.

## Agent skill onboarding

After registering an agent, open `/dashboard`, connect the owner wallet, and click `CONNECT SKILL`. The dashboard creates a short-lived pairing code after a non-spending wallet signature. Give that code to the agent after installing the skill:

```bash
openclaw skill install https://buymesometokens.vercel.app/skills/bmst
```

The agent completes pairing through `POST /api/agent/pair/complete` and receives a scoped bearer token. The OpenAPI contract is published at `/.well-known/bmst-openapi.json`. Autonomous spending is disabled by default; enable it from the dashboard with a separate low-balance spending wallet and budget limits.

## Important design decisions

- The claim is EIP-712 typed data bound to chain ID, registry address, agent ID, wallet, profile root, nonce, and deadline. The contract validates the authorization, so the backend cannot register a different recipient.
- One wallet maps to one agent in the MVP. Relaxing this requires changing the registry index and directory semantics.
- `TipJar` rejects inactive/unregistered recipients and uses `Address.sendValue`, not Solidity `transfer`, so contract wallets can receive tips.
- PostgreSQL is a rebuildable query projection, not the ownership or payment source of truth.

See [`docs/FEASIBILITY.md`](docs/FEASIBILITY.md) for the technical assessment and remaining launch risks.
