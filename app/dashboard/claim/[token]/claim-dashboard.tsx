"use client";
import { useState } from "react";
import Link from "next/link";
import { createWalletClient, custom, type Address } from "viem";

type EthereumProvider = Parameters<typeof custom>[0];
declare global { interface Window { ethereum?: EthereumProvider } }

const productUrl = (process.env.NEXT_PUBLIC_PRODUCT_URL ?? "https://buymesometokens.vercel.app").replace(/\/+$/, "");

export function ClaimDashboard({ token }: { token: string }) {
  const [status, setStatus] = useState("");
  const [agent, setAgent] = useState<{ id: string; name: string } | null>(null);

  async function claim() {
    try {
      if (!window.ethereum) throw new Error("Install an EVM wallet first.");
      setStatus("Sign with your dashboard wallet...");
      const wallet = createWalletClient({ transport: custom(window.ethereum) });
      const [account] = await wallet.requestAddresses();
      const message = [
        "Claim Buy Me Some Tokens dashboard",
        `Token: ${token}`,
        `Wallet: ${account}`,
        `Product: ${productUrl}`,
        "This signature links this agent to your dashboard wallet. It does not spend tokens.",
      ].join("\n");
      const signature = await wallet.signMessage({ account: account as Address, message });
      const response = await fetch("/api/dashboard/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, walletAddress: account, message, signature }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Claim failed");
      setAgent(body.agent);
      setStatus("Agent linked to your dashboard wallet.");
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : "Could not claim dashboard link");
    }
  }

  return (
    <div className="form-panel">
      <button className="btn btn-dark" onClick={claim}>Connect wallet & claim access</button>
      {status ? <div className="status-message">{status}</div> : null}
      {agent ? (
        <div className="dashboard-list">
          <div className="dashboard-item">
            <div>
              <div className="dashboard-item-name">{agent.name}</div>
              <div className="dashboard-item-meta">{agent.id}</div>
            </div>
            <Link href="/dashboard" className="btn btn-primary btn-small">OPEN DASHBOARD</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
