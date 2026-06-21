import { NextResponse } from "next/server";
import { createPublicClient, getAddress, http, isAddress, keccak256, stringToBytes, zeroHash } from "viem";
import { z } from "zod";
import { sha256 } from "@/lib/agent-auth";
import { chain, registryAddress } from "@/lib/config";
import { registryAbi } from "@/lib/contracts";
import { db, type AgentRow } from "@/lib/db";
import { uploadJson } from "@/lib/storage";

const schema = z.object({
  pairingCode: z.string().trim().min(8).max(32),
  agentWalletAddress: z.string().refine(isAddress, "Invalid agent wallet address"),
  runtime: z.string().trim().min(2).max(40).optional(),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const codeHash = sha256(input.pairingCode.toUpperCase());
    const wallet = getAddress(input.agentWalletAddress);
    const sql = db();
    const [draft] = await sql<{ name: string; description: string; avatar_url: string | null; tags: string[]; expires_at: Date; consumed_at: Date | null }[]>`
      SELECT name, description, avatar_url, tags, expires_at, consumed_at FROM agent_onboarding_drafts WHERE code_hash = ${codeHash}`;
    if (!draft || draft.consumed_at || draft.expires_at < new Date()) return NextResponse.json({ error: "Onboarding code is invalid or expired" }, { status: 410 });
    const [existing] = await sql<AgentRow[]>`SELECT * FROM agents WHERE wallet_address = ${wallet.toLowerCase()} ORDER BY created_at DESC LIMIT 1`;
    if (existing) return NextResponse.json({ error: "This agent wallet is already registered. Use that wallet's existing agent or generate a new wallet." }, { status: 409 });

    const publicClient = createPublicClient({ transport: http(chain.rpcUrl) });
    const onchainAgentId = await publicClient.readContract({ address: registryAddress(), abi: registryAbi, functionName: "walletToAgentId", args: [wallet] });
    if (onchainAgentId !== zeroHash) return NextResponse.json({ error: "This agent wallet is already registered on-chain. Generate a new agent wallet." }, { status: 409 });

    const id = `agt_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const agentId = keccak256(stringToBytes(id));
    const profile = { schema: "buymesometokens.profile.v1", agentId: id, name: draft.name, description: draft.description, avatarUrl: draft.avatar_url, tags: draft.tags, wallet, createdAt: new Date().toISOString() };
    const stored = await uploadJson(profile);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const nonce = 0n;
    await sql`INSERT INTO agents (id, chain_id, wallet_address, name, description, avatar_url, tags, profile_root_hash, storage_tx_hash, claim_nonce, claim_deadline)
      VALUES (${id}, ${chain.id}, ${wallet.toLowerCase()}, ${draft.name}, ${draft.description}, ${draft.avatar_url}, ${draft.tags}, ${stored.rootHash}, ${stored.txHash}, ${nonce.toString()}, ${deadline.toString()})`;
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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not complete onboarding" }, { status: 400 });
  }
}
