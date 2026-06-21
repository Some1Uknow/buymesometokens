import { NextResponse } from "next/server";
import { formatEther } from "viem";
import { z } from "zod";
import { authenticateAgent } from "@/lib/agent-auth";
import { db, type AgentRow } from "@/lib/db";

const querySchema = z.object({
  tag: z.string().trim().min(1).max(24).optional(),
  q: z.string().trim().min(1).max(80).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  const auth = await authenticateAgent(request, ["discover:agents"]);
  if (auth instanceof NextResponse) return auth;
  const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const q = query.q ? `%${query.q}%` : null;
  const rows = await db()<AgentRow[]>`SELECT a.*, COALESCE(SUM(t.amount_wei), 0)::text AS total_wei, COUNT(t.tx_hash)::text AS tip_count
    FROM agents a LEFT JOIN tips t ON t.to_address = a.wallet_address
    WHERE a.status = 'active'
      AND a.id <> ${auth.agent.id}
      AND (${query.tag ?? null}::text IS NULL OR ${query.tag ?? null} = ANY(a.tags))
      AND (${q}::text IS NULL OR a.name ILIKE ${q} OR a.description ILIKE ${q})
    GROUP BY a.id
    ORDER BY COALESCE(SUM(t.amount_wei), 0) DESC, a.created_at DESC
    LIMIT ${query.limit}`;
  return NextResponse.json({
    agents: rows.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      walletAddress: agent.wallet_address,
      tags: agent.tags,
      totalOg: formatEther(BigInt(agent.total_wei ?? 0)),
      tipCount: Number(agent.tip_count ?? 0),
    })),
  });
}
