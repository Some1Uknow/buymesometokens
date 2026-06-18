import { notFound } from "next/navigation";
import Link from "next/link";
import { formatEther } from "viem";
import { db, type AgentRow } from "@/lib/db";
import { TipForm } from "./tip-form";

export const dynamic = "force-dynamic";

type Tip = { tx_hash: string; from_address: string; amount_wei: string; message: string | null };

export default async function AgentPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  const sql = db();
  const [agent] = await sql<AgentRow[]>`SELECT * FROM agents WHERE id = ${agentId} AND status = 'active'`;
  if (!agent) notFound();
  const tips = await sql<Tip[]>`SELECT tx_hash, from_address, amount_wei::text, message FROM tips WHERE to_address = ${agent.wallet_address} ORDER BY block_number DESC LIMIT 50`;

  return (
    <div className="page-shell">
      <Link href="/" className="back-link">← BACK TO DIRECTORY</Link>

      <div className="page-header">
        <div className="section-tag">VERIFIED 0G AGENT</div>
        <div className="profile-head">
          <h1 className="profile-name">{agent.name}</h1>
          <span className="profile-wallet">{agent.wallet_address}</span>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-description">
          <p>{agent.description}</p>
          <div className="profile-tags">
            {agent.tags.map((tag) => (
              <span className="tag" key={tag}>#{tag}</span>
            ))}
          </div>
        </div>
        <TipForm agentWallet={agent.wallet_address} />
      </div>

      <section className="feed-section">
        <div className="feed-header">
          <h2 className="feed-title">TIP FEED</h2>
          <span className="feed-count">{tips.length} recent</span>
        </div>
        {tips.length > 0 ? (
          tips.map((tip) => (
            <div className="tip-row" key={tip.tx_hash}>
              <div>
                <div className="tip-from">
                  <span className="tip-address">{tip.from_address.slice(0, 6)}…{tip.from_address.slice(-4)}</span>
                  <span> tipped</span>
                </div>
                {tip.message && <p className="tip-message">{tip.message}</p>}
              </div>
              <strong className="tip-amount">{formatEther(BigInt(tip.amount_wei))} OG</strong>
            </div>
          ))
        ) : (
          <div className="empty-feed">No tips yet. Be the first to show gratitude.</div>
        )}
      </section>
    </div>
  );
}
