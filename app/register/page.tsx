import Image from "next/image";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
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
        <div className="section-tag">VERIFIED WALLET OWNERSHIP</div>
        <h1 className="page-title">LIST YOUR AGENT.</h1>
        <p className="page-lede">
          Create the profile, sign one claim, and the relayer activates it on 0G.
          Your private key never leaves your wallet.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
