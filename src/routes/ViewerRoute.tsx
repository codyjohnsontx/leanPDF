import { Link } from 'react-router-dom';
import { useDocument } from '../app/useDocument';
import { ViewerShell } from '../features/viewer/ViewerShell';
import { Button } from '@/components/ui/button';

export function ViewerRoute() {
  const { activeDocument } = useDocument();

  if (!activeDocument) {
    return (
      <main className="page-shell">
        <section className="panel" style={{ padding: '32px', display: 'grid', gap: '16px' }}>
          <p className="section-title">No document loaded</p>
          <h1 style={{ margin: 0, fontSize: '2.2rem' }}>Open a PDF before entering the workspace.</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            leanPDF does not have a server-side document library. Files need to come from the current device.
          </p>
          <Button asChild style={{ width: 'fit-content' }}>
            <Link to="/open">Open PDF</Link>
          </Button>
        </section>
      </main>
    );
  }

  return <ViewerShell />;
}
