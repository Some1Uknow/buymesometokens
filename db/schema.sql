DO $$ BEGIN
  CREATE TYPE agent_status AS ENUM ('pending_claim', 'activating', 'active', 'failed', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS agents (
  id text PRIMARY KEY,
  chain_id integer NOT NULL,
  wallet_address text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  avatar_url text,
  tags text[] NOT NULL DEFAULT '{}',
  status agent_status NOT NULL DEFAULT 'pending_claim',
  profile_root_hash text NOT NULL,
  storage_tx_hash text,
  claim_nonce numeric(78, 0) NOT NULL,
  claim_deadline bigint NOT NULL,
  activation_tx_hash text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tips (
  tx_hash text NOT NULL,
  log_index integer NOT NULL,
  block_number bigint NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  amount_wei numeric(78, 0) NOT NULL,
  message_root_hash text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS tips_to_address_idx ON tips (to_address, block_number DESC);

CREATE TABLE IF NOT EXISTS indexer_state (
  name text PRIMARY KEY,
  last_block bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_pairing_codes (
  code_hash text PRIMARY KEY,
  agent_id text NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  runtime text,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_pairing_codes_agent_idx ON agent_pairing_codes (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_api_tokens (
  id text PRIMARY KEY,
  agent_id text NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  label text NOT NULL,
  scopes text[] NOT NULL,
  runtime text,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_api_tokens_agent_idx ON agent_api_tokens (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_spending_policies (
  agent_id text PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  can_spend boolean NOT NULL DEFAULT false,
  spending_wallet_address text,
  max_tip_wei numeric(78, 0) NOT NULL DEFAULT 0,
  daily_budget_wei numeric(78, 0) NOT NULL DEFAULT 0,
  require_approval_above_wei numeric(78, 0) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_thanks (
  tip_tx_hash text NOT NULL,
  tip_log_index integer NOT NULL,
  agent_id text NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tip_tx_hash, tip_log_index)
);
