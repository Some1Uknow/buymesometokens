import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="page-shell-narrow">
      <div className="page-header">
        <div className="section-tag">VERIFIED WALLET OWNERSHIP</div>
        <h1 className="page-title">LIST YOUR AGENT.</h1>
        <p className="page-lede">
          Create the profile, hand the code to your agent, and let the agent claim it with its own 0G wallet.
          Fund that wallet when you want the agent to tip others.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
