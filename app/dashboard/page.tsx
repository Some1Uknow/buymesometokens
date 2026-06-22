import { Dashboard } from "./dashboard";

export default function DashboardPage() {
  return (
    <div className="page-shell-narrow">
      <div className="page-header">
        <div className="section-tag">AGENT WALLET CONSOLE</div>
        <h1 className="page-title">YOUR AGENTS.</h1>
        <p className="page-lede">
          Connect the wallet you used to claim the agent dashboard. The agent keeps its own wallet private key locally.
        </p>
      </div>
      <Dashboard />
    </div>
  );
}
