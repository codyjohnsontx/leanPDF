import { Link } from 'react-router-dom';
import { useDocument } from '../app/useDocument';
import { BrandMark } from '../app/BrandMark';

export function LandingRoute() {
  const { activeDocument } = useDocument();

  return (
    <main className="landing-shell">
      <div className="landing-backdrop" />
      <section className="landing-frame">
        <header className="landing-header">
          <BrandMark />

          <div className="landing-header-actions">
            <Link className="pill-button" to="/open">
              Open app
            </Link>
          </div>
        </header>

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
      </section>
    </main>
  );
}
