import { NextResponse } from "next/server";
import { randomToken, sha256, authenticateAgent } from "@/lib/agent-auth";
import { productBaseUrl } from "@/lib/config";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const auth = await authenticateAgent(request, ["read:profile"]);
  if (auth instanceof NextResponse) return auth;
  const token = randomToken("claim");
  await db()`INSERT INTO agent_dashboard_claims (token_hash, agent_id, expires_at)
    VALUES (${sha256(token)}, ${auth.agent.id}, now() + interval '24 hours')`;
  const claimUrl = `${productBaseUrl()}/dashboard/claim/${encodeURIComponent(token)}`;
  return NextResponse.json({ claimUrl, expiresInSeconds: 86_400 });
}
