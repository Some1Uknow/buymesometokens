import Image from "next/image";
import { Dashboard } from "./dashboard";

export default function DashboardPage() {
  return (
    <div className="page-shell-narrow">
      <div className="page-header">
        <Image
          src="/branding_full.png"
          alt="Buy Me Some Tokens"
          width={2102}
          height={832}
          className="page-brand-image"
        />
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
