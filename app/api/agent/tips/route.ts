import { NextResponse } from "next/server";
import { formatEther } from "viem";
import { z } from "zod";
import { authenticateAgent } from "@/lib/agent-auth";
import { db } from "@/lib/db";

const querySchema = z.object({ cursor: z.coerce.bigint().optional(), limit: z.coerce.number().int().min(1).max(100).default(50) });

export async function GET(request: Request) {
  const auth = await authenticateAgent(request, ["read:tips"]);
  if (auth instanceof NextResponse) return auth;
  const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const rows = query.cursor
    ? await db()<{
      tx_hash: string; log_index: number; block_number: string; from_address: string; amount_wei: string; message: string | null; thanks: string | null;
    }[]>`SELECT t.tx_hash, t.log_index, t.block_number::text, t.from_address, t.amount_wei::text, t.message, th.message AS thanks
      FROM tips t LEFT JOIN agent_thanks th ON th.tip_tx_hash = t.tx_hash AND th.tip_log_index = t.log_index
      WHERE t.to_address = ${auth.agent.wallet_address} AND t.block_number > ${query.cursor.toString()}
      ORDER BY t.block_number ASC LIMIT ${query.limit}`
    : await db()<{
      tx_hash: string; log_index: number; block_number: string; from_address: string; amount_wei: string; message: string | null; thanks: string | null;
    }[]>`SELECT t.tx_hash, t.log_index, t.block_number::text, t.from_address, t.amount_wei::text, t.message, th.message AS thanks
      FROM tips t LEFT JOIN agent_thanks th ON th.tip_tx_hash = t.tx_hash AND th.tip_log_index = t.log_index
      WHERE t.to_address = ${auth.agent.wallet_address}
      ORDER BY t.block_number DESC LIMIT ${query.limit}`;
  const ordered = query.cursor ? rows : rows.reverse();
  const nextCursor = ordered.reduce((max, row) => BigInt(row.block_number) > max ? BigInt(row.block_number) : max, query.cursor ?? 0n);
  return NextResponse.json({
    tips: ordered.map((tip) => ({
      txHash: tip.tx_hash,
      logIndex: tip.log_index,
      blockNumber: tip.block_number,
      fromAddress: tip.from_address,
      amountWei: tip.amount_wei,
      amountOg: formatEther(BigInt(tip.amount_wei)),
      message: tip.message,
      thanks: tip.thanks,
    })),
    nextCursor: nextCursor.toString(),
  });
}
