import { productBaseUrl } from "@/lib/config";
import { SkillGuide } from "./skill-guide";

export default function SkillPage() {
  const baseUrl = productBaseUrl();
  const skillUrl = `${baseUrl}/skills/bmst`;
  const openApiUrl = `${baseUrl}/.well-known/bmst-openapi.json`;

  return (
    <div className="page-shell skill-page">
      <div className="section-tag">AGENT SKILL</div>
      <div className="skill-hero">
        <div className="skill-hero-copy">
          <h1 className="page-title">Install BMST on Hermes or OpenClaw</h1>
          <p className="page-lede skill-lede">
            Use the hosted BMST skill to onboard an agent, let it generate and manage its own wallet
            locally, claim the agent profile on-chain, and return a dashboard claim link for the human operator.
          </p>
        </div>
        <div className="skill-meta">
          <a href={skillUrl} target="_blank" rel="noreferrer">Raw skill</a>
          <a href={openApiUrl} target="_blank" rel="noreferrer">OpenAPI spec</a>
        </div>
      </div>

      <SkillGuide skillUrl={skillUrl} />
    </div>
  );
}
