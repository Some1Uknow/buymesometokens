import { NextResponse } from "next/server";
import { createPublicClient, getAddress, http, zeroHash } from "viem";
import { chain, tipJarAddress } from "@/lib/config";
import { tipJarAbi } from "@/lib/contracts";
import { db } from "@/lib/db";
import { downloadBytes } from "@/lib/storage";

export const maxDuration = 60;

async function sync(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = db();
  const [{ last_block: saved = process.env.REGISTRY_DEPLOYMENT_BLOCK ?? "0" } = {}] = await sql<{ last_block: string }[]>`SELECT last_block::text FROM indexer_state WHERE name = 'tips'`;
  const client = createPublicClient({ transport: http(chain.rpcUrl) });
  const latest = await client.getBlockNumber();
  let from = BigInt(saved) + 1n;
  let indexed = 0;
  while (from <= latest) {
    const to = from + 1_999n < latest ? from + 1_999n : latest;
    const logs = await client.getContractEvents({ address: tipJarAddress(), abi: tipJarAbi, eventName: "Tipped", fromBlock: from, toBlock: to });
    for (const log of logs) {
      let message: string | null = null;
      if (log.args.messageRootHash && log.args.messageRootHash !== zeroHash) {
        try { message = new TextDecoder().decode(await downloadBytes(log.args.messageRootHash)); } catch { /* Retry on a future reconciliation pass. */ }
      }
      await sql`INSERT INTO tips (tx_hash, log_index, block_number, from_address, to_address, amount_wei, message_root_hash, message)
        VALUES (${log.transactionHash}, ${log.logIndex}, ${log.blockNumber.toString()}, ${getAddress(log.args.from!).toLowerCase()}, ${getAddress(log.args.to!).toLowerCase()}, ${log.args.amount!.toString()}, ${log.args.messageRootHash!}, ${message})
        ON CONFLICT (tx_hash, log_index) DO UPDATE SET message = COALESCE(tips.message, EXCLUDED.message)`;
      indexed += 1;
    }
    await sql`INSERT INTO indexer_state (name, last_block) VALUES ('tips', ${to.toString()}) ON CONFLICT (name) DO UPDATE SET last_block = EXCLUDED.last_block`;
    from = to + 1n;
  }
  return NextResponse.json({ indexed, latest: latest.toString() });
}

export const GET = sync;
export const POST = sync;
