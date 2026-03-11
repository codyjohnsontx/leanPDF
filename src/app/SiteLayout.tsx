import { Link, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { BrandMark } from './BrandMark';
import { useDocument } from './useDocument';

export function SiteLayout() {
  const { activeDocument } = useDocument();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <BrandMark />
          <nav className="site-nav">
            <Link className="ghost-button site-nav-link" to="/">Tools</Link>
            <Link className="ghost-button site-nav-link" to="/open">Open PDF</Link>
            {activeDocument ? (
              <Link className="pill-button site-nav-cta" to="/viewer">Resume draft</Link>
            ) : null}
          </nav>
        </div>
      </header>
      <Suspense fallback={<div className="page-shell" style={{ paddingTop: '40px', color: 'var(--text-muted)' }}>Loading…</div>}>
        <Outlet />
      </Suspense>
    </div>
  );
}
