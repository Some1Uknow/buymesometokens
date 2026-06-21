import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, getAddress, http, keccak256, stringToBytes, zeroHash } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";
import { chain, registryAddress, relayerKey } from "@/lib/config";
import { registrationTypes, registryAbi } from "@/lib/contracts";
import { db, type AgentRow } from "@/lib/db";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({ agentId: z.string().regex(/^agt_[a-f0-9]{16}$/), signature: z.string().regex(/^0x[0-9a-fA-F]+$/) });

export async function POST(request: Request) {
  try {
    if (!rateLimit(`claim:${requestIp(request)}`, 10)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    const input = schema.parse(await request.json());
    const sql = db();
    const [agent] = await sql<AgentRow[]>`SELECT * FROM agents WHERE id = ${input.agentId}`;
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    if (agent.status === "active") return NextResponse.json({ agentId: agent.id, status: "active", txHash: agent.activation_tx_hash });
    if (BigInt(agent.claim_deadline) < BigInt(Math.floor(Date.now() / 1000))) return NextResponse.json({ error: "Claim expired; register again" }, { status: 410 });

    const message = { agentId: keccak256(stringToBytes(agent.id)), wallet: getAddress(agent.wallet_address), profileRootHash: agent.profile_root_hash as `0x${string}`, nonce: BigInt(agent.claim_nonce), deadline: BigInt(agent.claim_deadline) };
    const domain = { name: "BuyMeSomeTokens Registry", version: "1", chainId: chain.id, verifyingContract: registryAddress() } as const;
    const transport = http(chain.rpcUrl);
    const publicClient = createPublicClient({ transport });
    const valid = await publicClient.verifyTypedData({ address: message.wallet, domain, types: registrationTypes, primaryType: "Registration", message, signature: input.signature as `0x${string}` });
    if (!valid) return NextResponse.json({ error: "Signature does not match the registered wallet" }, { status: 401 });
    const onchainAgentId = await publicClient.readContract({ address: registryAddress(), abi: registryAbi, functionName: "walletToAgentId", args: [message.wallet] });
    if (onchainAgentId !== zeroHash) {
      if (onchainAgentId === message.agentId) {
        await sql`UPDATE agents SET status = 'active', error_message = NULL, updated_at = now() WHERE id = ${agent.id}`;
        return NextResponse.json({ agentId: agent.id, status: "active", txHash: agent.activation_tx_hash });
      }
      await sql`UPDATE agents SET status = 'failed', error_message = 'Wallet already registered on-chain to another agent.', updated_at = now() WHERE id = ${agent.id}`;
      return NextResponse.json({ error: "This wallet is already registered on-chain to another agent. Use a different wallet." }, { status: 409 });
    }

    await sql`UPDATE agents SET status = 'activating', error_message = NULL, updated_at = now() WHERE id = ${agent.id}`;
    const account = privateKeyToAccount(relayerKey());
    const walletClient = createWalletClient({ account, transport });
    try {
      const hash = await walletClient.writeContract({ address: registryAddress(), abi: registryAbi, functionName: "registerAgent", args: [message.agentId, message.wallet, message.profileRootHash, message.nonce, message.deadline, input.signature as `0x${string}`], chain: null });
      await sql`UPDATE agents SET activation_tx_hash = ${hash}, updated_at = now() WHERE id = ${agent.id}`;
      await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
      await sql`UPDATE agents SET status = 'active', activation_tx_hash = ${hash}, updated_at = now() WHERE id = ${agent.id}`;
      return NextResponse.json({ agentId: agent.id, status: "active", txHash: hash });
    } catch (error) {
      const messageText = error instanceof Error ? error.message.slice(0, 1000) : "Activation transaction failed";
      await sql`UPDATE agents SET status = 'failed', error_message = ${messageText}, updated_at = now() WHERE id = ${agent.id}`;
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Claim failed" }, { status: 400 });
  }
}
