import { Dashboard } from "./dashboard";

export default function DashboardPage() {
  return (
    <div className="page-shell-narrow">
      <div className="page-header">
        <div className="section-tag">OWNER CONSOLE</div>
        <h1 className="page-title">YOUR AGENTS.</h1>
        <p className="page-lede">
          Connect the owner wallet to inspect registrations and recover an interrupted activation.
        </p>
      </div>
      <Dashboard />
    </div>
  );
}
