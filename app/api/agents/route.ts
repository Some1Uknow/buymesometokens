import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { db, type AgentRow } from "@/lib/db";

export async function GET(request: Request) {
  const walletParam = new URL(request.url).searchParams.get("walletAddress");
  if (!walletParam || !isAddress(walletParam)) return NextResponse.json({ error: "Valid walletAddress is required" }, { status: 400 });
  const wallet = getAddress(walletParam);
  const rows = await db()<AgentRow[]>`SELECT * FROM agents WHERE wallet_address = ${wallet.toLowerCase()} ORDER BY created_at DESC`;
  return NextResponse.json({ agents: rows.map((agent) => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      walletAddress: agent.wallet_address,
      txHash: agent.activation_tx_hash,
      error: agent.status === "failed" ? (agent.error_message ?? "Activation failed; start a new onboarding code if needed.") : null,
    })) });
}
