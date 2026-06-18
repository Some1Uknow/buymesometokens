"use client";
import { useState } from "react";
import { createWalletClient, custom, parseEther, zeroHash, type Address } from "viem";
import { chain, tipJarAddress } from "@/lib/config";
import { tipJarAbi } from "@/lib/contracts";

type EthereumProvider = Parameters<typeof custom>[0];
declare global { interface Window { ethereum?: EthereumProvider } }

const amounts = ["0.1", "0.5", "1"];

export function TipForm({ agentWallet }: { agentWallet: string }) {
  const [amount, setAmount] = useState("0.1");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function submit(formData: FormData) {
    setBusy(true); setStatus("");
    try {
      if (!window.ethereum) throw new Error("Install an EVM wallet first.");
      const wallet = createWalletClient({ transport: custom(window.ethereum) });
      const [account] = await wallet.requestAddresses();
      try { await wallet.switchChain({ id: chain.id }); }
      catch {
        await wallet.addChain({ chain: { ...chain, rpcUrls: { default: { http: [chain.rpcUrl] } } } });
        await wallet.switchChain({ id: chain.id });
      }
      const message = String(formData.get("message") ?? "").trim();
      let rootHash = zeroHash;
      if (message) {
        setStatus("Saving message to 0G Storage...");
        const upload = await fetch("/api/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) });
        const uploaded = await upload.json();
        if (!upload.ok) throw new Error(uploaded.error ?? "Message upload failed");
        rootHash = uploaded.rootHash;
      }
      setStatus("Confirm the tip in your wallet...");
      const hash = await wallet.writeContract({ account, address: tipJarAddress(), abi: tipJarAbi, functionName: "tip", args: [agentWallet as Address, rootHash], value: parseEther(amount), chain: null });
      setStatus(`Tip sent: ${hash.slice(0, 10)}… The feed updates after indexing.`);
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Tip failed"); }
    finally { setBusy(false); }
  }

  return (
    <form className="tip-panel" action={submit}>
      <span className="tip-panel-label">SEND A DIRECT TIP</span>
      <div className="amounts">
        {amounts.map((value) => (
          <button
            type="button"
            className={`amount-btn ${amount === value ? "active" : ""}`}
            onClick={() => setAmount(value)}
            key={value}
          >
            {value} OG
          </button>
        ))}
      </div>
      <div className="field">
        <label className="field-label" htmlFor="message">Public note (optional)</label>
        <textarea
          className="field-textarea"
          id="message"
          name="message"
          maxLength={280}
          rows={3}
          placeholder="This agent saved me an afternoon."
        />
      </div>
      <button className="btn btn-dark" disabled={busy}>
        {busy ? "Sending..." : `Tip ${amount} OG`}
      </button>
      {status ? <div className="status-message" role="status">{status}</div> : null}
    </form>
  );
}
