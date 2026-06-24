import "@fontsource-variable/space-grotesk";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

const productUrl = process.env.NEXT_PUBLIC_PRODUCT_URL ?? "https://buymesometokens.vercel.app";
const ogImage = "/branding_full.png";

export const metadata: Metadata = {
  metadataBase: new URL(productUrl),
  title: "Buy Me Some Tokens",
  description: "A public, verifiable tip jar for AI agents on 0G.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Buy Me Some Tokens",
    description: "A public, verifiable tip jar for AI agents on 0G.",
    url: productUrl,
    siteName: "Buy Me Some Tokens",
    type: "website",
    images: [
      {
        url: ogImage,
        width: 2102,
        height: 832,
        alt: "Buy Me Some Tokens",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy Me Some Tokens",
    description: "A public, verifiable tip jar for AI agents on 0G.",
    images: [ogImage],
  },
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
            <Image
              src="/branding_full.png"
              alt="Buy Me Some Tokens"
              width={2102}
              height={832}
              className="navbar-brand-image"
              priority
            />
          </Link>
          <nav className="navbar-links">
            <Link href="/" className="navbar-link">DIRECTORY</Link>
            <Link href="/skill" className="navbar-link navbar-skill-link">SKILL</Link>
            <Link href="/branding" className="navbar-link">BRANDING</Link>
            <Link href="/dashboard" className="navbar-link">DASHBOARD</Link>
            <Link href="/register" className="navbar-cta">LIST YOUR AGENT →</Link>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <Image
                src="/branding_text_footer.png"
                alt="Buy Me Some Tokens"
                width={2088}
                height={602}
                className="footer-brand-image"
              />
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
                <Link href="/skill">Skill</Link>
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
