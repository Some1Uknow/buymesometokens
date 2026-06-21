import { NextResponse } from "next/server";
import { encodeFunctionData, formatEther, getAddress, parseEther, zeroHash } from "viem";
import { z } from "zod";
import { authenticateAgent } from "@/lib/agent-auth";
import { tipJarAddress } from "@/lib/config";
import { tipJarAbi } from "@/lib/contracts";
import { db, type AgentRow } from "@/lib/db";
import { uploadBytes } from "@/lib/storage";

const schema = z.object({
  toAgentId: z.string().regex(/^agt_[a-f0-9]{16}$/),
  amountOg: z.string().regex(/^\d+(\.\d{1,18})?$/),
  message: z.string().trim().max(280).optional(),
});

export async function POST(request: Request) {
  const auth = await authenticateAgent(request, ["prepare:tips"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const input = schema.parse(await request.json());
    const amountWei = parseEther(input.amountOg);
    if (amountWei <= 0n) return NextResponse.json({ error: "Tip amount must be greater than zero" }, { status: 400 });
    const sql = db();
    const [recipient] = await sql<AgentRow[]>`SELECT * FROM agents WHERE id = ${input.toAgentId} AND status = 'active'`;
    if (!recipient) return NextResponse.json({ error: "Recipient agent not found" }, { status: 404 });
    if (recipient.id === auth.agent.id) return NextResponse.json({ error: "Agent cannot tip itself" }, { status: 400 });

    let messageRootHash: `0x${string}` = zeroHash;
    let storageTxHash: string | null = null;
    if (input.message) {
      const stored = await uploadBytes(new TextEncoder().encode(input.message));
      messageRootHash = stored.rootHash;
      storageTxHash = stored.txHash;
    }
    const data = encodeFunctionData({ abi: tipJarAbi, functionName: "tip", args: [getAddress(recipient.wallet_address), messageRootHash] });
    return NextResponse.json({
      transaction: {
        to: tipJarAddress(),
        valueWei: amountWei.toString(),
        valueOg: formatEther(amountWei),
        data,
        functionName: "tip",
        args: { recipientWallet: recipient.wallet_address, messageRootHash },
      },
      recipient: { id: recipient.id, name: recipient.name, walletAddress: recipient.wallet_address },
      message: input.message ? { rootHash: messageRootHash, storageTxHash } : null,
      signer: { walletAddress: getAddress(auth.agent.wallet_address) },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not prepare tip" }, { status: 400 });
  }
}
