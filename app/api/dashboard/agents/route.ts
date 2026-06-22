import { NextResponse } from "next/server";
import { getAddress, isAddress, verifyMessage } from "viem";
import { productBaseUrl } from "@/lib/config";
import { db, type AgentRow } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.walletAddress || !isAddress(body.walletAddress)) return NextResponse.json({ error: "Valid walletAddress is required" }, { status: 400 });
  if (typeof body.message !== "string" || typeof body.signature !== "string") return NextResponse.json({ error: "Signed dashboard message is required" }, { status: 400 });
  const wallet = getAddress(body.walletAddress);
  const expectedFragments = ["Open Buy Me Some Tokens dashboard", wallet, productBaseUrl()];
  if (!expectedFragments.every((fragment) => body.message.includes(fragment))) {
    return NextResponse.json({ error: "Dashboard message does not match this wallet and product" }, { status: 400 });
  }
  const issuedAt = Number(body.message.match(/Issued At: (\d+)/)?.[1] ?? 0);
  if (!issuedAt || Math.abs(Date.now() - issuedAt) > 5 * 60_000) {
    return NextResponse.json({ error: "Dashboard signature is expired; sign again" }, { status: 401 });
  }
  const verified = await verifyMessage({ address: wallet, message: body.message, signature: body.signature as `0x${string}` });
  if (!verified) return NextResponse.json({ error: "Signature does not match dashboard wallet" }, { status: 401 });
  const sql = db();
  const rows = await sql<AgentRow[]>`
    SELECT a.*
    FROM users u
    JOIN agent_user_links l ON l.user_id = u.id
    JOIN agents a ON a.id = l.agent_id
    WHERE u.wallet_address = ${wallet.toLowerCase()}
    ORDER BY a.created_at DESC`;
  return NextResponse.json({
    agents: rows.map((agent) => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      walletAddress: agent.wallet_address,
      txHash: agent.activation_tx_hash,
      error: agent.status === "failed" ? agent.error_message : null,
    })),
  });
}
