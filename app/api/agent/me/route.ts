import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/agent-auth";

export async function GET(request: Request) {
  const auth = await authenticateAgent(request, ["read:profile"]);
  if (auth instanceof NextResponse) return auth;
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
  });
}
