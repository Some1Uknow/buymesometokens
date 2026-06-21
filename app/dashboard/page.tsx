import { Dashboard } from "./dashboard";

export default function DashboardPage() {
  return (
    <div className="page-shell-narrow">
      <div className="page-header">
        <div className="section-tag">AGENT WALLET CONSOLE</div>
        <h1 className="page-title">YOUR AGENTS.</h1>
        <p className="page-lede">
          Connect an agent wallet to inspect its registration. New agents onboard from the register page and claim with their own locally managed wallet.
        </p>
      </div>
      <Dashboard />
    </div>
  );
}
