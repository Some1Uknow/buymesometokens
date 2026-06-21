import { NextResponse } from "next/server";
import { getAddress, isAddress, parseEther, verifyMessage } from "viem";
import { z } from "zod";
import { productBaseUrl } from "@/lib/config";
import { db, type AgentRow } from "@/lib/db";

const schema = z.object({
  agentId: z.string().regex(/^agt_[a-f0-9]{16}$/),
  walletAddress: z.string().refine(isAddress, "Invalid owner wallet"),
  message: z.string().min(20).max(1200),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
  policy: z.object({
    canSpend: z.boolean(),
    spendingWalletAddress: z.string().refine(isAddress, "Invalid spending wallet").nullable(),
    maxTipOg: z.string().regex(/^\d+(\.\d{1,18})?$/),
    dailyBudgetOg: z.string().regex(/^\d+(\.\d{1,18})?$/),
    requireApprovalAboveOg: z.string().regex(/^\d+(\.\d{1,18})?$/),
  }),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const owner = getAddress(input.walletAddress);
    const expectedFragments = ["Update Buy Me Some Tokens agent policy", input.agentId, owner, productBaseUrl()];
    if (!expectedFragments.every((fragment) => input.message.includes(fragment))) {
      return NextResponse.json({ error: "Policy message does not match this agent and product URL" }, { status: 400 });
    }
    const verified = await verifyMessage({ address: owner, message: input.message, signature: input.signature as `0x${string}` });
    if (!verified) return NextResponse.json({ error: "Signature does not match owner wallet" }, { status: 401 });
    const sql = db();
    const [agent] = await sql<AgentRow[]>`SELECT * FROM agents WHERE id = ${input.agentId} AND status = 'active'`;
    if (!agent) return NextResponse.json({ error: "Active agent not found" }, { status: 404 });
    if (getAddress(agent.wallet_address) !== owner) return NextResponse.json({ error: "Wallet does not own this agent" }, { status: 403 });
    if (input.policy.canSpend && !input.policy.spendingWalletAddress) {
      return NextResponse.json({ error: "A separate spending wallet is required when spending is enabled" }, { status: 400 });
    }
    const maxTipWei = parseEther(input.policy.maxTipOg);
    const dailyBudgetWei = parseEther(input.policy.dailyBudgetOg);
    const approvalWei = parseEther(input.policy.requireApprovalAboveOg);
    if (input.policy.canSpend && (maxTipWei <= 0n || dailyBudgetWei <= 0n)) {
      return NextResponse.json({ error: "Spending policy requires positive max tip and daily budget" }, { status: 400 });
    }
    await sql`INSERT INTO agent_spending_policies (
        agent_id, can_spend, spending_wallet_address, max_tip_wei, daily_budget_wei, require_approval_above_wei, updated_at
      ) VALUES (
        ${agent.id}, ${input.policy.canSpend}, ${input.policy.spendingWalletAddress ? getAddress(input.policy.spendingWalletAddress).toLowerCase() : null},
        ${maxTipWei.toString()}, ${dailyBudgetWei.toString()}, ${approvalWei.toString()}, now()
      )
      ON CONFLICT (agent_id) DO UPDATE SET
        can_spend = EXCLUDED.can_spend,
        spending_wallet_address = EXCLUDED.spending_wallet_address,
        max_tip_wei = EXCLUDED.max_tip_wei,
        daily_budget_wei = EXCLUDED.daily_budget_wei,
        require_approval_above_wei = EXCLUDED.require_approval_above_wei,
        updated_at = now()`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update policy" }, { status: 400 });
  }
}
