import { Link } from 'react-router-dom';

export function BrandMark() {
  return (
    <Link className="landing-brand-link" to="/" aria-label="Go to home">
      <div className="landing-brand">
        <strong className="landing-wordmark">leanPDF</strong>
        <span className="landing-tagline">Focused PDF workspace</span>
      </div>
    </Link>
  );
}
