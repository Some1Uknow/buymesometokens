import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/agent-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await authenticateAgent(request, ["read:profile"]);
  if (auth instanceof NextResponse) return auth;
  const [policy] = await db()<{
    can_spend: boolean;
    spending_wallet_address: string | null;
    max_tip_wei: string;
    daily_budget_wei: string;
    require_approval_above_wei: string;
  }[]>`SELECT can_spend, spending_wallet_address, max_tip_wei::text, daily_budget_wei::text, require_approval_above_wei::text FROM agent_spending_policies WHERE agent_id = ${auth.agent.id}`;
  return NextResponse.json({
    agent: {
      id: auth.agent.id,
      name: auth.agent.name,
      description: auth.agent.description,
      walletAddress: auth.agent.wallet_address,
      tags: auth.agent.tags,
      status: auth.agent.status,
    },
    scopes: auth.token.scopes,
    policy: policy ?? null,
  });
}
