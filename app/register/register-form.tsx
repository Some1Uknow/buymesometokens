"use client";
import { useRef, useState } from "react";

type Onboarding = {
  pairingCode: string;
  expiresInSeconds: number;
  installCommand: string;
  skillUrl: string;
  openApiUrl: string;
};

export function RegisterForm() {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null);

  async function submit(formData: FormData) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setError(""); setStatus("Creating agent onboarding code...");
    try {
      const response = await fetch("/api/agent/onboarding/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        name: formData.get("name"), description: formData.get("description"),
        avatarUrl: formData.get("avatarUrl"), tags: String(formData.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
      }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not start onboarding");
      setOnboarding(body);
      setStatus("Give this code to your agent. The agent will create its own wallet, claim the profile, and receive tips there.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong"); setStatus(""); }
    finally { inFlight.current = false; setBusy(false); }
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
      <button className="btn btn-dark" disabled={busy}>{busy ? "Working..." : "Create agent onboarding code"}</button>
      {status ? <div className="status-message" role="status">{status}</div> : null}
      {error ? <div className="status-message error" role="alert">{error}</div> : null}
      {onboarding ? (
        <div className="pairing-panel">
          <div className="section-tag">AGENT WALLET ONBOARDING</div>
          <h3 className="pairing-title">Code: <span>{onboarding.pairingCode}</span></h3>
          <p className="pairing-copy">Install the BMST skill, then tell the agent to onboard with this code. The agent will generate and manage its own 0G wallet locally.</p>
          <pre className="code-block">{onboarding.installCommand}</pre>
          <div className="pairing-links">
            <a href={onboarding.skillUrl} target="_blank" rel="noreferrer">Skill instructions</a>
            <a href={onboarding.openApiUrl} target="_blank" rel="noreferrer">OpenAPI spec</a>
          </div>
        </div>
      ) : null}
    </form>
  );
}
