import { NextResponse } from "next/server";
import { getAddress, isAddress, keccak256, stringToBytes } from "viem";
import { z } from "zod";
import { chain, registryAddress } from "@/lib/config";
import { db } from "@/lib/db";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { uploadJson } from "@/lib/storage";

export const runtime = "nodejs";
const inputSchema = z.object({
  name: z.string().trim().min(2).max(64),
  description: z.string().trim().min(10).max(500),
  walletAddress: z.string().refine(isAddress, "Invalid wallet address"),
  avatarUrl: z.url().max(500).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(24)).max(5).default([]),
});

export async function POST(request: Request) {
  try {
    if (!rateLimit(`register:${requestIp(request)}`, 3, 60 * 60_000)) return NextResponse.json({ error: "Registration rate limit reached" }, { status: 429 });
    const input = inputSchema.parse(await request.json());
    const id = `agt_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const agentId = keccak256(stringToBytes(id));
    const wallet = getAddress(input.walletAddress);
    const profile = { schema: "buymesometokens.profile.v1", agentId: id, name: input.name, description: input.description, avatarUrl: input.avatarUrl || null, tags: input.tags, wallet, createdAt: new Date().toISOString() };
    const stored = await uploadJson(profile);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const nonce = 0n;
    const sql = db();
    await sql`INSERT INTO agents (id, chain_id, wallet_address, name, description, avatar_url, tags, profile_root_hash, storage_tx_hash, claim_nonce, claim_deadline)
      VALUES (${id}, ${chain.id}, ${wallet.toLowerCase()}, ${input.name}, ${input.description}, ${input.avatarUrl || null}, ${input.tags}, ${stored.rootHash}, ${stored.txHash}, ${nonce.toString()}, ${deadline.toString()})`;
    return NextResponse.json({
      agent: { id, status: "pending_claim", walletAddress: wallet },
      typedData: {
        domain: { name: "BuyMeSomeTokens Registry", version: "1", chainId: chain.id, verifyingContract: registryAddress() },
        types: { Registration: [
          { name: "agentId", type: "bytes32" }, { name: "wallet", type: "address" }, { name: "profileRootHash", type: "bytes32" },
          { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" },
        ] },
        primaryType: "Registration",
        message: { agentId, wallet, profileRootHash: stored.rootHash, nonce: nonce.toString(), deadline: deadline.toString() },
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    const conflict = message.includes("unique") || message.includes("duplicate");
    return NextResponse.json({ error: conflict ? "This wallet is already registered" : message }, { status: conflict ? 409 : 400 });
  }
}
