"use client";
import { useState } from "react";
import { createWalletClient, custom, getAddress, type Address } from "viem";

type EthereumProvider = Parameters<typeof custom>[0];
declare global { interface Window { ethereum?: EthereumProvider } }

export function RegisterForm() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setBusy(true); setError(""); setStatus("Uploading profile to 0G Storage...");
    try {
      if (!window.ethereum) throw new Error("Install an EVM wallet such as MetaMask first.");
      const wallet = createWalletClient({ transport: custom(window.ethereum) });
      const [account] = await wallet.requestAddresses();
      const requested = String(formData.get("walletAddress") || account);
      if (getAddress(requested) !== getAddress(account)) throw new Error("The connected wallet must match the agent wallet.");
      const response = await fetch("/api/agents/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        name: formData.get("name"), description: formData.get("description"), walletAddress: account,
        avatarUrl: formData.get("avatarUrl"), tags: String(formData.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
      }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Registration failed");
      setStatus("Sign the claim in your wallet. This does not spend OG.");
      const signature = await wallet.signTypedData({ account, ...body.typedData, message: {
        ...body.typedData.message, wallet: body.typedData.message.wallet as Address,
        nonce: BigInt(body.typedData.message.nonce), deadline: BigInt(body.typedData.message.deadline),
      } });
      setStatus("Activating on 0G Chain...");
      const claim = await fetch("/api/agents/claim", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ agentId: body.agent.id, signature }) });
      const result = await claim.json();
      if (!claim.ok) throw new Error(result.error ?? "Activation failed");
      window.location.assign(`/agents/${body.agent.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong"); setStatus(""); }
    finally { setBusy(false); }
  }

  return (
    <form className="form-panel" action={submit}>
      <div className="field">
        <label className="field-label" htmlFor="name">Agent name</label>
        <input className="field-input" id="name" name="name" minLength={2} maxLength={64} required placeholder="ResearchBot" />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="description">What does it do?</label>
        <textarea className="field-textarea" id="description" name="description" minLength={10} maxLength={500} required rows={4} placeholder="Reads papers, tests claims, and returns cited research briefs." />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="avatarUrl">Avatar URL (optional)</label>
        <input className="field-input" id="avatarUrl" name="avatarUrl" type="url" placeholder="https://..." />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="tags">Tags, comma separated</label>
        <input className="field-input" id="tags" name="tags" placeholder="research, papers, citations" />
      </div>
      <button className="btn btn-dark" disabled={busy}>{busy ? "Working..." : "Connect wallet & claim"}</button>
      {status ? <div className="status-message" role="status">{status}</div> : null}
      {error ? <div className="status-message error" role="alert">{error}</div> : null}
    </form>
  );
}
