"use client";
import Link from "next/link";
import { useState } from "react";
import { createWalletClient, custom, type Address } from "viem";
import { registrationTypes } from "@/lib/contracts";

type EthereumProvider = Parameters<typeof custom>[0];
declare global { interface Window { ethereum?: EthereumProvider } }
type Agent = { id: string; name: string; status: string; walletAddress: string; txHash: string | null; error: string | null; typedData: Record<string, unknown> | null };
type PairingInfo = { agentId: string; pairingCode: string; installCommand: string; skillUrl: string; openApiUrl: string; expiresInSeconds: number };

const productUrl = (process.env.NEXT_PUBLIC_PRODUCT_URL ?? "https://buymesometokens.vercel.app").replace(/\/+$/, "");

export function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [walletAddress, setWalletAddress] = useState<Address>();
  const [status, setStatus] = useState("");
  const [pairingInfo, setPairingInfo] = useState<PairingInfo | null>(null);

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

  async function startPairing(agent: Agent) {
    try {
      if (!window.ethereum || !walletAddress) return;
      setStatus(`Preparing ${agent.name} pairing code...`);
      setPairingInfo(null);
      const wallet = createWalletClient({ transport: custom(window.ethereum) });
      const message = [
        "Pair Buy Me Some Tokens agent",
        `Agent: ${agent.id}`,
        `Wallet: ${walletAddress}`,
        `Product: ${productUrl}`,
        "This signature only creates a short-lived pairing code. It does not spend tokens.",
      ].join("\n");
      const signature = await wallet.signMessage({ account: walletAddress, message });
      const response = await fetch("/api/agent/pair/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, walletAddress, message, signature, runtime: "openclaw" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not create pairing code");
      setPairingInfo({ agentId: agent.id, ...body });
      setStatus("Pairing code created. Give it to the agent after installing the skill.");
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Could not start pairing"); }
  }

  async function configurePolicy(agent: Agent) {
    try {
      if (!window.ethereum || !walletAddress) return;
      const spendingWalletAddress = window.prompt("Low-balance spending wallet address for this agent. Leave blank to disable autonomous spending.", "");
      const canSpend = Boolean(spendingWalletAddress?.trim());
      const maxTipOg = canSpend ? window.prompt("Max autonomous tip in OG", "0.05") ?? "0" : "0";
      const dailyBudgetOg = canSpend ? window.prompt("Daily autonomous budget in OG", "0.25") ?? "0" : "0";
      const requireApprovalAboveOg = canSpend ? window.prompt("Require human approval above this OG amount. Use 0 to allow up to max tip.", "0") ?? "0" : "0";
      setStatus(`Signing ${agent.name} spending policy...`);
      const wallet = createWalletClient({ transport: custom(window.ethereum) });
      const message = [
        "Update Buy Me Some Tokens agent policy",
        `Agent: ${agent.id}`,
        `Wallet: ${walletAddress}`,
        `Product: ${productUrl}`,
        `Can spend: ${canSpend}`,
        `Spending wallet: ${spendingWalletAddress || "disabled"}`,
        `Max tip OG: ${maxTipOg}`,
        `Daily budget OG: ${dailyBudgetOg}`,
        `Approval above OG: ${requireApprovalAboveOg}`,
        "This signature only updates the agent API spending policy. It does not spend tokens.",
      ].join("\n");
      const signature = await wallet.signMessage({ account: walletAddress, message });
      const response = await fetch("/api/agent/policy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          walletAddress,
          message,
          signature,
          policy: { canSpend, spendingWalletAddress: canSpend ? spendingWalletAddress : null, maxTipOg, dailyBudgetOg, requireApprovalAboveOg },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not update spending policy");
      setStatus(canSpend ? "Autonomous spending policy saved. Fund only the low-balance spending wallet." : "Autonomous spending disabled.");
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Could not update policy"); }
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
                  <div className="dashboard-actions">
                    <Link href={`/agents/${agent.id}`} className="btn btn-primary btn-small">VIEW →</Link>
                    <button className="btn btn-accent btn-small" onClick={() => startPairing(agent)}>CONNECT SKILL →</button>
                    <button className="btn btn-white btn-small" onClick={() => configurePolicy(agent)}>SPEND POLICY →</button>
                  </div>
                ) : (
                  <button className="btn btn-accent btn-small" onClick={() => retry(agent)}>RETRY →</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {pairingInfo ? (
        <div className="pairing-panel">
          <div className="section-tag">AGENT SKILL PAIRING</div>
          <h3 className="pairing-title">Pairing code: <span>{pairingInfo.pairingCode}</span></h3>
          <p className="pairing-copy">Install the skill, then tell the agent to pair with this code. It expires in about 10 minutes.</p>
          <pre className="code-block">{pairingInfo.installCommand}</pre>
          <div className="pairing-links">
            <a href={pairingInfo.skillUrl} target="_blank" rel="noreferrer">Skill instructions</a>
            <a href={pairingInfo.openApiUrl} target="_blank" rel="noreferrer">OpenAPI spec</a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
