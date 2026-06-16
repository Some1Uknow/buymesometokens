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
