import Image from "next/image";
import Link from "next/link";

const brandAssets = [
  {
    title: "FULL LOCKUP",
    src: "/branding_full.png",
    alt: "Buy Me Some Tokens full brand lockup",
    width: 2102,
    height: 832,
    note: "Primary lockup for navbar, footer, landing sections, and product headers.",
  },
  {
    title: "WORDMARK",
    src: "/branding_text.png",
    alt: "Buy Me Some Tokens wordmark",
    width: 2088,
    height: 602,
    note: "Text-only treatment for editorial layouts, social headers, and campaign blocks.",
  },
  {
    title: "SOLID ICON",
    src: "/logo.png",
    alt: "Buy Me Some Tokens icon",
    width: 1254,
    height: 1254,
    note: "Use for avatars, share cards, app tiles, and small-square placements.",
  },
  {
    title: "TRANSPARENT ICON",
    src: "/logo-transparent.png",
    alt: "Buy Me Some Tokens transparent icon",
    width: 500,
    height: 500,
    note: "Use when the mark needs to float on product surfaces without a boxed background.",
  },
];

export default function BrandingPage() {
  return (
    <div className="brand-page">
      <section className="brand-hero">
        <div className="brand-hero-copy">
          <div className="section-tag">BRAND SYSTEM</div>
          <h1 className="brand-hero-title">THE IDENTITY BEHIND EVERY TIP.</h1>
          <p className="brand-hero-lede">
            The product now uses the full lockup across shared chrome, supported by the icon
            and wordmark assets already living in `public/`.
          </p>
          <div className="brand-hero-actions">
            <Link href="/" className="btn btn-primary">VIEW DIRECTORY →</Link>
            <Link href="/register" className="btn btn-dark">LIST YOUR AGENT →</Link>
          </div>
        </div>

        <div className="brand-hero-panel">
          <div className="brand-display-card">
            <span className="brand-display-label">PRIMARY BRANDING</span>
            <Image
              src="/branding_full.png"
              alt="Buy Me Some Tokens full branding"
              width={2102}
              height={832}
              className="brand-display-image"
              priority
            />
          </div>
        </div>
      </section>

      <section className="brand-assets-section">
        <div className="section-content">
          <div className="section-tag">PUBLIC ASSETS</div>
          <div className="section-header">
            <h2 className="section-title">AVAILABLE BRAND FILES</h2>
            <span className="section-count">{brandAssets.length} assets in use</span>
          </div>

          <div className="brand-assets-grid">
            {brandAssets.map((asset) => (
              <article className="brand-asset-card" key={asset.src}>
                <span className="brand-asset-title">{asset.title}</span>
                <div className="brand-asset-frame">
                  <Image
                    src={asset.src}
                    alt={asset.alt}
                    width={asset.width}
                    height={asset.height}
                    className="brand-asset-image"
                  />
                </div>
                <p className="brand-asset-note">{asset.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-usage-section">
        <div className="section-content">
          <div className="section-tag">APPLICATION</div>
          <div className="section-header">
            <h2 className="section-title">HOW IT SHOWS UP IN PRODUCT</h2>
          </div>

          <div className="brand-usage-grid">
            <div className="brand-usage-card">
              <h3>Shared chrome</h3>
              <p>The full lockup now anchors the navbar and footer so every route carries the same brand signal.</p>
            </div>
            <div className="brand-usage-card">
              <h3>Landing experience</h3>
              <p>The homepage hero and brand callouts use the complete mark instead of a standalone icon.</p>
            </div>
            <div className="brand-usage-card">
              <h3>Inner pages</h3>
              <p>Registration, dashboard, and agent detail views now open with the full lockup to keep the product visually coherent.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
