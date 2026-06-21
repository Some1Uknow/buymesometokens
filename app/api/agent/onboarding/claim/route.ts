import { NextResponse } from "next/server";
import { randomToken, sha256 } from "@/lib/agent-auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const response = await fetch(new URL("/api/agents/claim", request.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(await request.json()),
  });
  const body = await response.json();
  if (!response.ok) return NextResponse.json(body, { status: response.status });
  const agentId = body.agentId as string;
  const token = randomToken("bmst");
  const tokenId = `tok_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
  const scopes = ["read:profile", "read:tips", "write:thanks", "discover:agents", "prepare:tips"];
  await db()`INSERT INTO agent_api_tokens (id, agent_id, token_hash, label, scopes, runtime, expires_at)
    VALUES (${tokenId}, ${agentId}, ${sha256(token)}, 'Agent wallet skill', ${scopes}, 'agent-wallet', now() + interval '365 days')`;
  return NextResponse.json({ ...body, token, tokenType: "Bearer", scopes });
}
