import { NextResponse } from "next/server";
import { getAddress, isAddress, verifyMessage } from "viem";
import { z } from "zod";
import { sha256 } from "@/lib/agent-auth";
import { productBaseUrl } from "@/lib/config";
import { db, type AgentRow } from "@/lib/db";

const schema = z.object({
  token: z.string().trim().min(20).max(200),
  walletAddress: z.string().refine(isAddress, "Invalid wallet address"),
  message: z.string().min(20).max(1000),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const wallet = getAddress(input.walletAddress);
    const expectedFragments = ["Claim Buy Me Some Tokens dashboard", input.token, wallet, productBaseUrl()];
    if (!expectedFragments.every((fragment) => input.message.includes(fragment))) {
      return NextResponse.json({ error: "Dashboard claim message does not match this link and wallet" }, { status: 400 });
    }
    const verified = await verifyMessage({ address: wallet, message: input.message, signature: input.signature as `0x${string}` });
    if (!verified) return NextResponse.json({ error: "Signature does not match dashboard wallet" }, { status: 401 });
    const sql = db();
    const [claim] = await sql<{ agent_id: string; expires_at: Date; consumed_at: Date | null }[]>`
      SELECT agent_id, expires_at, consumed_at FROM agent_dashboard_claims WHERE token_hash = ${sha256(input.token)}`;
    if (!claim || claim.consumed_at || claim.expires_at < new Date()) {
      return NextResponse.json({ error: "Dashboard claim link is invalid or expired" }, { status: 410 });
    }
    const [agent] = await sql<AgentRow[]>`SELECT * FROM agents WHERE id = ${claim.agent_id} AND status = 'active'`;
    if (!agent) return NextResponse.json({ error: "Active agent not found" }, { status: 404 });
    const userId = `usr_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
    await sql.begin(async (tx) => {
      await tx`INSERT INTO users (id, wallet_address)
        VALUES (${userId}, ${wallet.toLowerCase()})
        ON CONFLICT (wallet_address) DO UPDATE SET updated_at = now()`;
      const [user] = await tx<{ id: string }[]>`SELECT id FROM users WHERE wallet_address = ${wallet.toLowerCase()}`;
      await tx`INSERT INTO agent_user_links (agent_id, user_id, role, verified_by)
        VALUES (${agent.id}, ${user.id}, 'owner', 'agent_claim_link')
        ON CONFLICT (agent_id, user_id) DO UPDATE SET role = EXCLUDED.role`;
      await tx`UPDATE agent_dashboard_claims SET consumed_at = now() WHERE token_hash = ${sha256(input.token)}`;
    });
    return NextResponse.json({
      agent: { id: agent.id, name: agent.name, status: agent.status, walletAddress: agent.wallet_address, txHash: agent.activation_tx_hash },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not claim dashboard link" }, { status: 400 });
  }
}
