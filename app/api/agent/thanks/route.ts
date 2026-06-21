import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAgent } from "@/lib/agent-auth";
import { db } from "@/lib/db";

const schema = z.object({
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  logIndex: z.number().int().min(0).optional(),
  message: z.string().trim().min(1).max(280),
});

export async function POST(request: Request) {
  const auth = await authenticateAgent(request, ["write:thanks"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const input = schema.parse(await request.json());
    const sql = db();
    const rows = input.logIndex === undefined
      ? await sql<{ log_index: number }[]>`SELECT log_index FROM tips WHERE tx_hash = ${input.txHash} AND to_address = ${auth.agent.wallet_address} LIMIT 2`
      : await sql<{ log_index: number }[]>`SELECT log_index FROM tips WHERE tx_hash = ${input.txHash} AND log_index = ${input.logIndex} AND to_address = ${auth.agent.wallet_address}`;
    if (rows.length !== 1) return NextResponse.json({ error: "Tip not found or logIndex is ambiguous" }, { status: 404 });
    await sql`INSERT INTO agent_thanks (tip_tx_hash, tip_log_index, agent_id, message)
      VALUES (${input.txHash}, ${rows[0].log_index}, ${auth.agent.id}, ${input.message})
      ON CONFLICT (tip_tx_hash, tip_log_index) DO UPDATE SET message = EXCLUDED.message, updated_at = now()`;
    return NextResponse.json({ ok: true, txHash: input.txHash, logIndex: rows[0].log_index, message: input.message });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save thanks" }, { status: 400 });
  }
}
