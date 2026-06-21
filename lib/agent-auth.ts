import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db, type AgentRow } from "@/lib/db";

export type AgentTokenRow = {
  id: string;
  agent_id: string;
  scopes: string[];
  revoked_at: Date | null;
  expires_at: Date | null;
};

export type AuthenticatedAgent = {
  token: AgentTokenRow;
  agent: AgentRow;
};

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(prefix: string): string {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}

export function pairingCode(): string {
  const raw = randomBytes(6).toString("base64url").replace(/[^A-Z0-9]/gi, "").toUpperCase().padEnd(10, "X").slice(0, 10);
  return `BMST-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function authenticateAgent(request: Request, requiredScopes: string[] = []): Promise<AuthenticatedAgent | NextResponse> {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  const sql = db();
  const [row] = await sql<(AgentTokenRow & AgentRow)[]>`
    SELECT t.id, t.agent_id, t.scopes, t.revoked_at, t.expires_at,
      a.wallet_address, a.name, a.description, a.avatar_url, a.tags, a.status,
      a.profile_root_hash, a.claim_nonce, a.claim_deadline, a.activation_tx_hash, a.created_at
    FROM agent_api_tokens t
    JOIN agents a ON a.id = t.agent_id
    WHERE t.token_hash = ${sha256(token)}
    LIMIT 1`;
  if (!row || row.revoked_at || (row.expires_at && row.expires_at < new Date())) {
    return NextResponse.json({ error: "Invalid or expired agent token" }, { status: 401 });
  }
  const missing = requiredScopes.filter((scope) => !row.scopes.includes(scope));
  if (missing.length) return NextResponse.json({ error: `Missing scope: ${missing.join(", ")}` }, { status: 403 });
  await sql`UPDATE agent_api_tokens SET last_used_at = now() WHERE id = ${row.id}`;
  return {
    token: { id: row.id, agent_id: row.agent_id, scopes: row.scopes, revoked_at: row.revoked_at, expires_at: row.expires_at },
    agent: {
      id: row.agent_id,
      wallet_address: row.wallet_address,
      name: row.name,
      description: row.description,
      avatar_url: row.avatar_url,
      tags: row.tags,
      status: row.status,
      profile_root_hash: row.profile_root_hash,
      claim_nonce: row.claim_nonce,
      claim_deadline: row.claim_deadline,
      activation_tx_hash: row.activation_tx_hash,
      created_at: row.created_at,
    },
  };
}
