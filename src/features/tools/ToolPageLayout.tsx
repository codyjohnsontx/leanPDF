import type { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  children: ReactNode;
}

export function ToolPageLayout({ title, description, children }: Props) {
  return (
    <main className="page-shell">
      <div className="tool-page-header">
        <h1 className="tool-page-title">{title}</h1>
        <p className="helper-copy tool-page-desc">{description}</p>
      </div>
      <section className="panel tool-page-body">
        {children}
      </section>
    </main>
  );
}
