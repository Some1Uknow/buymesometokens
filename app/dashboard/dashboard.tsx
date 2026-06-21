"use client";
import Link from "next/link";
import { useState } from "react";
import { createWalletClient, custom, type Address } from "viem";

type EthereumProvider = Parameters<typeof custom>[0];
declare global { interface Window { ethereum?: EthereumProvider } }
type Agent = { id: string; name: string; status: string; walletAddress: string; txHash: string | null; error: string | null };

export function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [walletAddress, setWalletAddress] = useState<Address>();
  const [status, setStatus] = useState("");

  async function connect() {
    try {
      if (!window.ethereum) throw new Error("Install an EVM wallet first.");
      const wallet = createWalletClient({ transport: custom(window.ethereum) });
      const [account] = await wallet.requestAddresses();
      setWalletAddress(account);
      setStatus("Loading...");
      const response = await fetch(`/api/agents?walletAddress=${account}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setAgents(body.agents);
      setStatus(body.agents.length ? "" : "No agent registrations for this wallet.");
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Could not connect"); }
  }

  return (
    <div className="form-panel dashboard-connect">
      <button className="btn btn-dark" onClick={connect}>
        {walletAddress ? "Refresh" : "Connect agent wallet"}
      </button>
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
                  <Link href={`/agents/${agent.id}`} className="btn btn-primary btn-small">VIEW →</Link>
                ) : (
                  <span className="dashboard-terminal">COMPLETE IN AGENT SKILL</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
