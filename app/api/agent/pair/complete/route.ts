import { NextResponse } from "next/server";
import { z } from "zod";
import { randomToken, sha256 } from "@/lib/agent-auth";
import { productBaseUrl } from "@/lib/config";
import { db, type AgentRow } from "@/lib/db";

const schema = z.object({
  pairingCode: z.string().trim().min(8).max(32),
  runtime: z.string().trim().min(2).max(40).default("rest-agent"),
  label: z.string().trim().min(1).max(80).default("Agent skill"),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const sql = db();
    const [pairing] = await sql<{ agent_id: string; runtime: string | null; expires_at: Date; consumed_at: Date | null }[]>`
      SELECT agent_id, runtime, expires_at, consumed_at FROM agent_pairing_codes WHERE code_hash = ${sha256(input.pairingCode.toUpperCase())}`;
    if (!pairing || pairing.consumed_at || pairing.expires_at < new Date()) {
      return NextResponse.json({ error: "Pairing code is invalid or expired" }, { status: 410 });
    }
    const [agent] = await sql<AgentRow[]>`SELECT * FROM agents WHERE id = ${pairing.agent_id} AND status = 'active'`;
    if (!agent) return NextResponse.json({ error: "Active agent not found" }, { status: 404 });

    const token = randomToken("bmst");
    const tokenId = `tok_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const scopes = ["read:profile", "read:tips", "write:thanks", "discover:agents", "prepare:tips"];
    await sql`INSERT INTO agent_api_tokens (id, agent_id, token_hash, label, scopes, runtime, expires_at)
      VALUES (${tokenId}, ${agent.id}, ${sha256(token)}, ${input.label}, ${scopes}, ${input.runtime}, now() + interval '180 days')`;
    await sql`UPDATE agent_pairing_codes SET consumed_at = now() WHERE code_hash = ${sha256(input.pairingCode.toUpperCase())}`;

    return NextResponse.json({
      agent: { id: agent.id, name: agent.name, walletAddress: agent.wallet_address },
      token,
      tokenType: "Bearer",
      scopes,
      expiresInDays: 180,
      baseUrl: productBaseUrl(),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not complete pairing" }, { status: 400 });
  }
}
