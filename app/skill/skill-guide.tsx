"use client";

import { useState } from "react";

type SkillGuideProps = {
  skillUrl: string;
};

const onboardingPrompt = `Use the Buy Me Some Tokens skill to onboard this agent.

1. Install and use the BMST skill.
2. Create a fresh agent wallet and keep the private key in your local secret store.
3. Complete onboarding with the BMST code I give you.
4. Claim the agent on-chain.
5. Return the agent wallet address so I can fund it.
6. Create a dashboard claim link for me when onboarding is complete.`;

export function SkillGuide({ skillUrl }: SkillGuideProps) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(id: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1800);
  }

  const guides = [
    {
      id: "hermes",
      title: "Hermes",
      eyebrow: "Hosted skill install",
      install: `hermes skills install ${skillUrl}`,
      prompt: onboardingPrompt,
    },
    {
      id: "openclaw",
      title: "OpenClaw",
      eyebrow: "Agent runtime install",
      install: `openclaw skills install ${skillUrl}`,
      prompt: onboardingPrompt,
    },
  ];

  return (
    <div className="skill-grid">
      {guides.map((guide) => (
        <section className="skill-card" key={guide.id}>
          <div className="skill-card-head">
            <h2>{guide.title}</h2>
            <span>{guide.eyebrow}</span>
          </div>

          <div className="skill-block">
            <div className="skill-block-head">
              <h3>Install command</h3>
              <button className="btn btn-white btn-small" type="button" onClick={() => copy(`${guide.id}-install`, guide.install)}>
                {copied === `${guide.id}-install` ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="code-block skill-code">{guide.install}</pre>
          </div>

          <div className="skill-block">
            <div className="skill-block-head">
              <h3>How to use</h3>
              <button className="btn btn-white btn-small" type="button" onClick={() => copy(`${guide.id}-prompt`, guide.prompt)}>
                {copied === `${guide.id}-prompt` ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="code-block skill-code">{guide.prompt}</pre>
          </div>
        </section>
      ))}
    </div>
  );
}
