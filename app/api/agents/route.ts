import { NextResponse } from "next/server";
import { getAddress, isAddress, keccak256, stringToBytes } from "viem";
import { chain, registryAddress } from "@/lib/config";
import { db, type AgentRow } from "@/lib/db";

export async function GET(request: Request) {
  const walletParam = new URL(request.url).searchParams.get("walletAddress");
  if (!walletParam || !isAddress(walletParam)) return NextResponse.json({ error: "Valid walletAddress is required" }, { status: 400 });
  const wallet = getAddress(walletParam);
  const rows = await db()<AgentRow[]>`SELECT * FROM agents WHERE wallet_address = ${wallet.toLowerCase()} ORDER BY created_at DESC`;
  return NextResponse.json({ agents: rows.map((agent) => {
    const terminalFailure = agent.error_message?.includes("Wallet already registered on-chain");
    return {
      id: agent.id,
      name: agent.name,
      status: agent.status,
      walletAddress: agent.wallet_address,
      txHash: agent.activation_tx_hash,
      error: agent.status === "failed" ? (agent.error_message ?? "Activation failed; retry the signed claim.") : null,
      retryable: agent.status !== "active" && !terminalFailure,
      typedData: agent.status === "active" || terminalFailure ? null : {
        domain: { name: "BuyMeSomeTokens Registry", version: "1", chainId: chain.id, verifyingContract: registryAddress() },
        types: { Registration: [
          { name: "agentId", type: "bytes32" }, { name: "wallet", type: "address" }, { name: "profileRootHash", type: "bytes32" },
          { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" },
        ] },
        primaryType: "Registration",
        message: { agentId: keccak256(stringToBytes(agent.id)), wallet, profileRootHash: agent.profile_root_hash, nonce: agent.claim_nonce, deadline: agent.claim_deadline },
      },
    };
  }) });
}
