"use client";
import Link from "next/link";
import { useState } from "react";
import { createWalletClient, custom, type Address } from "viem";

type Agent = { id: string; name: string; status: string; walletAddress: string; txHash: string | null; error: string | null };
type EthereumProvider = Parameters<typeof custom>[0];
declare global { interface Window { ethereum?: EthereumProvider } }

const productUrl = (process.env.NEXT_PUBLIC_PRODUCT_URL ?? "https://buymesometokens.vercel.app").replace(/\/+$/, "");

export function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [walletAddress, setWalletAddress] = useState<Address>();
  const [status, setStatus] = useState("");

  async function load() {
    try {
      if (!window.ethereum) throw new Error("Install an EVM wallet first.");
      setStatus("Sign with your dashboard wallet...");
      const wallet = createWalletClient({ transport: custom(window.ethereum) });
      const [account] = await wallet.requestAddresses();
      setWalletAddress(account);
      const message = [
        "Open Buy Me Some Tokens dashboard",
        `Wallet: ${account}`,
        `Product: ${productUrl}`,
        `Issued At: ${Date.now()}`,
        "This signature reads agents linked to this dashboard wallet. It does not spend tokens.",
      ].join("\n");
      const signature = await wallet.signMessage({ account: account as Address, message });
      const response = await fetch("/api/dashboard/agents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ walletAddress: account, message, signature }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setAgents(body.agents);
      setStatus(body.agents.length ? "" : "No agents linked to this dashboard wallet. Ask your agent to generate a claim link.");
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : "Could not load dashboard");
    }
  }

  return (
    <div className="form-panel dashboard-connect">
      <div className="dashboard-actions">
        <button className="btn btn-dark" onClick={load}>{walletAddress ? "Refresh" : "Connect dashboard wallet"}</button>
      </div>
      {status ? <div className="status-message">{status}</div> : null}
      {agents.length > 0 && (
        <div className="dashboard-list">
          {agents.map(agent => (
            <div className="dashboard-item" key={agent.id}>
              <div>
                <div className="dashboard-item-name">
                  {agent.name}
                  <span className={`dashboard-item-status ${agent.status}`}>{agent.status}</span>
                </div>
                <div className="dashboard-item-meta">{agent.id}</div>
                <div className="dashboard-item-meta">{agent.walletAddress}</div>
                {agent.error ? <div className="dashboard-item-error">{agent.error}</div> : null}
              </div>
              <div>
                {agent.status === "active" ? (
                  <Link href={`/agents/${agent.id}`} className="btn btn-primary btn-small">VIEW</Link>
                ) : (
                  <span className="dashboard-terminal">AGENT SETUP INCOMPLETE</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
