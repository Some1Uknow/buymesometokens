import postgres from "postgres";

declare global {
  var __bmtSql: ReturnType<typeof postgres> | undefined;
}

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  if (!global.__bmtSql) global.__bmtSql = postgres(url, { max: 10, idle_timeout: 20 });
  return global.__bmtSql;
}

export type AgentRow = {
  id: string;
  wallet_address: string;
  name: string;
  description: string;
  avatar_url: string | null;
  tags: string[];
  status: "pending_claim" | "activating" | "active" | "failed" | "inactive";
  profile_root_hash: string;
  claim_nonce: string;
  claim_deadline: string;
  activation_tx_hash: string | null;
  error_message: string | null;
  created_at: Date;
  total_wei?: string;
  tip_count?: string;
};
