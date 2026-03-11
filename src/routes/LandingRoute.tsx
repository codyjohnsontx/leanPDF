import { Link } from 'react-router-dom';
import { useDocument } from '../app/useDocument';

const FEATURES = [
  { icon: '📄', title: 'View & Navigate', desc: 'Fast rendering, text search, and thumbnail sidebar' },
  { icon: '✏️', title: 'Annotate', desc: 'Highlight, draw, and add comments to any page' },
  { icon: '📋', title: 'Fill Forms', desc: 'Interact with PDF form fields natively' },
  { icon: '✍️', title: 'Sign', desc: 'Place your signature and initials anywhere' },
  { icon: '🔒', title: 'Protect', desc: 'Password-encrypt exported PDFs' },
  { icon: '🔗', title: 'Merge PDFs', desc: 'Combine multiple files into one document' },
  { icon: '✂️', title: 'Split PDFs', desc: 'Extract page ranges into separate files' },
  { icon: '🖼️', title: 'Export to Images', desc: 'Convert pages to JPEG or PNG' },
  { icon: '🔤', title: 'Text Tools', desc: 'Word counter, case converter, slug generator, and more' },
] as const;

const WHY_ITEMS = [
  'Files never leave your device — no uploads, no cloud',
  'No account required',
  'No upload limits or paywalls',
  'Works offline as an installed PWA',
  'Free forever',
] as const;

export function LandingRoute() {
  const { activeDocument } = useDocument();

  return (
    <main className="landing-shell">
      <div className="landing-backdrop" />
      <div className="landing-frame">
        <section className="landing-hero" aria-label="leanPDF introduction">
          <div className="landing-hero-inner">
            <h1 className="landing-title">A better PDF tool. Built for everyone.</h1>
            <p className="landing-copy">
              Open, review, annotate, fill forms, sign, and protect documents in one focused workspace. Files
              stay on your device, and protected exports can require a password to open.
            </p>

            <div className="landing-actions">
              <Link className="pill-button" to="/open">
                Open app
              </Link>
              {activeDocument ? (
                <Link className="ghost-button" to="/viewer">
                  Resume draft
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="landing-features" aria-label="Features">
          <h2 className="landing-section-title">Everything you need</h2>
          <div className="landing-features-grid">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="landing-feature-card">
                <span className="landing-feature-icon" aria-hidden="true">{icon}</span>
                <strong className="landing-feature-title">{title}</strong>
                <p className="landing-feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-why" aria-label="Why leanPDF">
          <h2 className="landing-section-title">Why leanPDF?</h2>
          <ul className="landing-why-list">
            {WHY_ITEMS.map((item) => (
              <li key={item} className="landing-why-item">
                <span className="landing-why-check" aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
