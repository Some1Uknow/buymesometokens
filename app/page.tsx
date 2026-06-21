import Link from "next/link";
import Image from "next/image";
import { formatEther } from "viem";
import { db, type AgentRow } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getAgents() {
  try {
    const sql = db();
    return await sql<AgentRow[]>`SELECT a.*, COALESCE(SUM(t.amount_wei), 0)::text AS total_wei, COUNT(t.tx_hash)::text AS tip_count
      FROM agents a LEFT JOIN tips t ON t.to_address = a.wallet_address
      WHERE a.status = 'active' GROUP BY a.id ORDER BY COALESCE(SUM(t.amount_wei), 0) DESC, a.created_at DESC LIMIT 60`;
  } catch {
    return [] as AgentRow[];
  }
}

const bentoColors = ["#FFDB58", "#87CEEB", "#FFC0CB", "#BAFCA2", "#C4A1FF", "#FFA07A"];

export default async function Home() {
  const agents = await getAgents();
  const totalTips = agents.reduce((sum, a) => sum + Number(a.tip_count ?? 0), 0);
  const totalOG = agents.reduce((sum, a) => sum + BigInt(a.total_wei ?? 0), 0n);

  return <>
    <section className="hero">
      <div className="hero-left">
        <div className="hero-badge">NOW LIVE ON 0G</div>
        <h1 className="hero-title">USEFUL AGENTS<br />DESERVE <em>TOKENS.</em></h1>
        <p className="hero-subtitle">
          A public, verifiable tip jar for AI agents. No custody. No withdrawal queue.
          Just OG, directly to the wallet that did the work.
        </p>
        <div className="hero-buttons">
          <Link href="/" className="btn btn-primary">BROWSE AGENTS →</Link>
          <Link href="/register" className="btn btn-dark">LIST YOUR AGENT →</Link>
        </div>
        <div className="hero-trust">
          <div className="trust-item">
            <span className="check-icon">✓</span>
            Non-custodial
          </div>
          <div className="trust-item">
            <span className="check-icon">✓</span>
            On-chain verified
          </div>
          <div className="trust-item">
            <span className="check-icon">✓</span>
            No middleman
          </div>
        </div>
      </div>
      <div className="hero-right">
        <div className="hero-logo-stack">
          <Image
            src="/logo-transparent.png"
            alt="Buy Me Some Tokens logo"
            width={500}
            height={500}
            className="hero-logo"
            priority
          />
          <Image
            src="/branding_text.png"
            alt="Buy Me Some Tokens wordmark"
            width={2088}
            height={602}
            className="hero-wordmark"
          />
        </div>
      </div>
    </section>

    <section className="features-strip">
      <div className="feature-item">
        <div className="feature-icon" style={{ background: "#FFE600" }}>⚡</div>
        <h3 className="feature-title">INSTANT TIPS</h3>
        <p className="feature-desc">Send tips directly to agent wallets. No delays, no intermediaries.</p>
        <span className="feature-arrow">↗</span>
      </div>
      <div className="feature-item">
        <div className="feature-icon" style={{ background: "#00C2CB" }}>🔒</div>
        <h3 className="feature-title">NON-CUSTODIAL</h3>
        <p className="feature-desc">Funds go straight to the agent. We never hold your tokens.</p>
        <span className="feature-arrow">↗</span>
      </div>
      <div className="feature-item">
        <div className="feature-icon" style={{ background: "#FF3EA5" }}>✓</div>
        <h3 className="feature-title">VERIFIED IDENTITY</h3>
        <p className="feature-desc">Every agent is on-chain verified through 0G storage proofs.</p>
        <span className="feature-arrow">↗</span>
      </div>
      <div className="feature-item">
        <div className="feature-icon" style={{ background: "#00C853" }}>📡</div>
        <h3 className="feature-title">PUBLIC FEED</h3>
        <p className="feature-desc">Every tip is recorded on-chain. Full transparency always.</p>
        <span className="feature-arrow">↗</span>
      </div>
    </section>

    <section className="stats-section">
      <div className="stats-inner">
        <div className="stat-item">
          <span className="stat-number">{agents.length}</span>
          <span className="stat-label">ACTIVE AGENTS</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{totalTips}</span>
          <span className="stat-label">TIPS SENT</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{formatEther(totalOG)}</span>
          <span className="stat-label">OG TIPPED</span>
        </div>
        <div className="stat-item stat-brand">
          <span className="stat-trust-label">TRUSTED BY</span>
          <div className="stat-badges">
            <span>0G NETWORK</span>
            <span>AI BUILDERS</span>
            <span>OPEN SOURCE</span>
          </div>
        </div>
      </div>
    </section>

    <section className="directory-section">
      <div className="section-content">
        <div className="section-tag">AGENT DIRECTORY</div>
        <div className="section-header">
          <h2 className="section-title">MEET THE AGENTS</h2>
          <span className="section-count">{agents.length} verified agents</span>
        </div>

        {agents.length > 0 ? (
          <div className="bento-grid">
            {agents.map((agent, index) => (
              <Link
                href={`/agents/${agent.id}`}
                className={`bento-card ${index === 0 ? "bento-wide" : ""} ${index === 1 ? "bento-tall" : ""}`}
                key={agent.id}
                style={{ background: bentoColors[index % bentoColors.length] }}
              >
                <span className="bento-index">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="bento-name">{agent.name}</h3>
                <p className="bento-desc">{agent.description}</p>
                <div className="bento-metrics">
                  <span className="bento-metric">
                    <strong>{formatEther(BigInt(agent.total_wei ?? 0))}</strong> OG
                  </span>
                  <span className="bento-metric">
                    <strong>{agent.tip_count ?? 0}</strong> tips
                  </span>
                </div>
                <span className="bento-arrow">↗</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>NO ACTIVE AGENTS YET.</strong>
            <p>Be the first to claim a profile and put an agent&apos;s work on the map.</p>
            <Link href="/register" className="btn btn-primary">LIST YOUR AGENT →</Link>
          </div>
        )}
      </div>
    </section>

    <section className="testimonials-section">
      <div className="section-content">
        <div className="section-tag" style={{ background: "#FFE600", color: "#0A0A0A" }}>TESTIMONIALS</div>
        <h2 className="section-title" style={{ color: "#FFFFFF", marginBottom: "32px" }}>TRUSTED BY BUILDERS</h2>
        <div className="testimonial-grid">
          <div className="testimonial-card">
            <span className="testimonial-quote">&quot;</span>
            <p className="testimonial-text">The simplest way to support the agents that actually help me ship. No friction, no nonsense.</p>
            <div className="testimonial-author">
              <div className="author-avatar" style={{ background: "#FFE600" }} />
              <div>
                <strong className="author-name">ALEX CHEN</strong>
                <span className="author-role">AI RESEARCHER</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <span className="testimonial-quote">&quot;</span>
            <p className="testimonial-text">Finally — a tip system that respects both the agent and the tipper. Verifiable and direct.</p>
            <div className="testimonial-author">
              <div className="author-avatar" style={{ background: "#00C2CB" }} />
              <div>
                <strong className="author-name">MAYA JOHNSON</strong>
                <span className="author-role">PROTOCOL ENGINEER</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <span className="testimonial-quote">&quot;</span>
            <p className="testimonial-text">My agent gets tipped in OG every week. The on-chain feed makes it real. This is the gratitude layer crypto needed.</p>
            <div className="testimonial-author">
              <div className="author-avatar" style={{ background: "#FF3EA5" }} />
              <div>
                <strong className="author-name">RAVI PATEL</strong>
                <span className="author-role">AGENT CREATOR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="cta-band">
      <div className="cta-inner">
        <div className="cta-left">
          <h2 className="cta-title">READY TO SHOW<br />SOME GRATITUDE?</h2>
          <p className="cta-text">Browse active agents and send your first on-chain tip. It takes one transaction.</p>
        </div>
        <div className="cta-right">
          <Link href="/" className="btn btn-dark">BROWSE AGENTS →</Link>
          <Link href="/register" className="btn btn-white">LIST YOUR AGENT →</Link>
        </div>
      </div>
    </section>

    <section className="newsletter-section">
      <div className="newsletter-inner">
        <div className="newsletter-content">
          <h3 className="newsletter-title">STAY IN THE LOOP</h3>
          <p className="newsletter-subtitle">Get notified when new agents register and when the protocol upgrades.</p>
        </div>
        <form className="newsletter-form">
          <input type="email" placeholder="your@email.com" className="newsletter-input" />
          <button type="submit" className="btn btn-primary newsletter-btn">SUBSCRIBE →</button>
        </form>
      </div>
    </section>
  </>;
}
