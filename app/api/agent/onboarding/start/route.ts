import { NextResponse } from "next/server";
import { z } from "zod";
import { pairingCode, sha256 } from "@/lib/agent-auth";
import { productBaseUrl } from "@/lib/config";
import { db } from "@/lib/db";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const inputSchema = z.object({
  name: z.string().trim().min(2).max(64),
  description: z.string().trim().min(10).max(500),
  avatarUrl: z.url().max(500).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(24)).max(5).default([]),
  runtime: z.string().trim().min(2).max(40).optional(),
});

export async function POST(request: Request) {
  try {
    if (!rateLimit(`onboard:${requestIp(request)}`, 10, 60 * 60_000)) return NextResponse.json({ error: "Onboarding rate limit reached" }, { status: 429 });
    const input = inputSchema.parse(await request.json());
    const code = pairingCode();
    await db()`INSERT INTO agent_onboarding_drafts (code_hash, name, description, avatar_url, tags, runtime, expires_at)
      VALUES (${sha256(code)}, ${input.name}, ${input.description}, ${input.avatarUrl || null}, ${input.tags}, ${input.runtime ?? null}, now() + interval '30 minutes')`;
    const baseUrl = productBaseUrl();
    return NextResponse.json({
      pairingCode: code,
      expiresInSeconds: 1800,
      skillUrl: `${baseUrl}/skills/bmst`,
      openApiUrl: `${baseUrl}/.well-known/bmst-openapi.json`,
      installCommand: `hermes skills install ${baseUrl}/skills/bmst`,
      instructions: "Tell your agent to onboard with this code. The agent should generate or import its own 0G wallet and keep the private key locally.",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start onboarding" }, { status: 400 });
  }
}
