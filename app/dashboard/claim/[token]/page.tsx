import { ClaimDashboard } from "./claim-dashboard";

export default async function DashboardClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="page-shell-narrow">
      <div className="page-header">
        <div className="section-tag">DASHBOARD CLAIM</div>
        <h1 className="page-title">LINK AGENT.</h1>
        <p className="page-lede">
          This one-time link was created by the agent. Claim it here to manage the agent dashboard without importing the agent wallet.
        </p>
      </div>
      <ClaimDashboard token={token} />
    </div>
  );
}
