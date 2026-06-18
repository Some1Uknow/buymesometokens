"use client";
import Link from "next/link";
import { useState } from "react";
import { createWalletClient, custom, type Address } from "viem";
import { registrationTypes } from "@/lib/contracts";

type EthereumProvider = Parameters<typeof custom>[0];
declare global { interface Window { ethereum?: EthereumProvider } }
type Agent = { id: string; name: string; status: string; txHash: string | null; error: string | null; typedData: Record<string, unknown> | null };

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
      setStatus(body.agents.length ? "" : "No registrations for this wallet.");
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Could not connect"); }
  }

  async function retry(agent: Agent) {
    try {
      if (!window.ethereum || !walletAddress || !agent.typedData) return;
      setStatus(`Signing ${agent.name} claim...`);
      const wallet = createWalletClient({ transport: custom(window.ethereum) });
      const typedData = agent.typedData as { domain: { name: string; version: string; chainId: number; verifyingContract: Address }; message: { agentId: `0x${string}`; wallet: Address; profileRootHash: `0x${string}`; nonce: string; deadline: string } };
      const signature = await wallet.signTypedData({ account: walletAddress, domain: typedData.domain, types: registrationTypes, primaryType: "Registration", message: { ...typedData.message, nonce: BigInt(typedData.message.nonce), deadline: BigInt(typedData.message.deadline) } });
      setStatus("Activating...");
      const response = await fetch("/api/agents/claim", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ agentId: agent.id, signature }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      await connect();
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Retry failed"); }
  }

  return (
    <div className="form-panel dashboard-connect">
      <button className="btn btn-dark" onClick={connect}>
        {walletAddress ? "Refresh" : "Connect wallet"}
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
              </div>
              <div>
                {agent.status === "active" ? (
                  <Link href={`/agents/${agent.id}`} className="btn btn-primary btn-small">VIEW →</Link>
                ) : (
                  <button className="btn btn-accent btn-small" onClick={() => retry(agent)}>RETRY →</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
