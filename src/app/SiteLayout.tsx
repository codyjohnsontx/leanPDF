import { Link, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { BrandMark } from './BrandMark';
import { useDocument } from './useDocument';
import { Button } from '@/components/ui/button';

export function SiteLayout() {
  const { activeDocument } = useDocument();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <BrandMark />
          <nav className="site-nav">
            <Button asChild variant="ghost" className="site-nav-link">
              <Link to="/tools">Tools</Link>
            </Button>
            <Button asChild variant="ghost" className="site-nav-link">
              <Link to="/open">Open PDF</Link>
            </Button>
            {activeDocument ? (
              <Button asChild className="site-nav-cta">
                <Link to="/viewer">Resume draft</Link>
              </Button>
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
