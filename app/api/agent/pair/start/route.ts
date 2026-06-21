import { NextResponse } from "next/server";
import { getAddress, isAddress, verifyMessage } from "viem";
import { z } from "zod";
import { pairingCode, sha256 } from "@/lib/agent-auth";
import { productBaseUrl } from "@/lib/config";
import { db, type AgentRow } from "@/lib/db";

const schema = z.object({
  agentId: z.string().regex(/^agt_[a-f0-9]{16}$/),
  walletAddress: z.string().refine(isAddress, "Invalid wallet address"),
  message: z.string().min(20).max(1000),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
  runtime: z.string().trim().min(2).max(40).optional(),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const wallet = getAddress(input.walletAddress);
    const expectedFragments = ["Pair Buy Me Some Tokens agent", input.agentId, wallet, productBaseUrl()];
    if (!expectedFragments.every((fragment) => input.message.includes(fragment))) {
      return NextResponse.json({ error: "Pairing message does not match this agent and product URL" }, { status: 400 });
    }
    const verified = await verifyMessage({ address: wallet, message: input.message, signature: input.signature as `0x${string}` });
    if (!verified) return NextResponse.json({ error: "Signature does not match owner wallet" }, { status: 401 });

    const sql = db();
    const [agent] = await sql<AgentRow[]>`SELECT * FROM agents WHERE id = ${input.agentId} AND status = 'active'`;
    if (!agent) return NextResponse.json({ error: "Active agent not found" }, { status: 404 });
    if (getAddress(agent.wallet_address) !== wallet) return NextResponse.json({ error: "Wallet does not own this agent" }, { status: 403 });

    const code = pairingCode();
    await sql`INSERT INTO agent_pairing_codes (code_hash, agent_id, runtime, expires_at)
      VALUES (${sha256(code)}, ${agent.id}, ${input.runtime ?? null}, now() + interval '10 minutes')`;
    await sql`INSERT INTO agent_spending_policies (agent_id) VALUES (${agent.id}) ON CONFLICT (agent_id) DO NOTHING`;

    const baseUrl = productBaseUrl();
    return NextResponse.json({
      pairingCode: code,
      expiresInSeconds: 600,
      skillUrl: `${baseUrl}/skills/bmst`,
      openApiUrl: `${baseUrl}/.well-known/bmst-openapi.json`,
      installCommand: `openclaw skill install ${baseUrl}/skills/bmst`,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start pairing" }, { status: 400 });
  }
}
