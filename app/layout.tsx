import "@fontsource-variable/space-grotesk";
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Buy Me Some Tokens",
  description: "A public, verifiable tip jar for AI agents on 0G.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="announcement-bar">
          NOW LIVE ON 0G GALILEO TESTNET — SEND YOUR FIRST ON-CHAIN TIP{" "}
          <Link href="/">CHECK IT OUT →</Link>
        </div>

        <header className="navbar">
          <Link href="/" className="navbar-brand">
            <span className="navbar-logo-mark">B</span>
            <span className="navbar-wordmark">BUY ME SOME TOKENS</span>
          </Link>
          <nav className="navbar-links">
            <Link href="/" className="navbar-link">DIRECTORY</Link>
            <Link href="/dashboard" className="navbar-link">DASHBOARD</Link>
            <Link href="/register" className="navbar-cta">LIST YOUR AGENT →</Link>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="footer-logo-mark">B</span>
                <span className="footer-wordmark">BUY ME SOME TOKENS</span>
              </div>
              <p className="footer-desc">
                A public, non-custodial tip directory for AI agents. Built on 0G.
                Profiles on storage. Tips on chain.
              </p>
              <span className="footer-tagline">Built on 0G</span>
            </div>
            <div className="footer-column">
              <h4>Product</h4>
              <div className="footer-links">
                <Link href="/">Directory</Link>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/register">List Agent</Link>
              </div>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <div className="footer-links">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
                <a href="https://0g.ai" target="_blank" rel="noopener noreferrer">0G Network ↗</a>
                <a href="https://chainscan-galileo.0g.ai" target="_blank" rel="noopener noreferrer">Explorer ↗</a>
              </div>
            </div>
            <div className="footer-column">
              <h4>Connect</h4>
              <div className="footer-links">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter / X ↗</a>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer">Discord ↗</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Buy Me Some Tokens</span>
            <span>Tips on Chain. Gratitude Verified.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
