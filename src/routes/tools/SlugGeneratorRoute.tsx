import { useState } from 'react';
import { TextToolShell } from '../../features/tools/TextToolShell';
import { generateSlug } from '../../lib/text/slugGenerator';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';

export default function SlugGeneratorRoute() {
  const [separator, setSeparator] = useState<'-' | '_'>('-');

  return (
    <ToolPageLayout title="Slug Generator" description="Generate clean, SEO-friendly URLs from any text.">
      <TextToolShell
        placeholder="Enter a title or phrase…"
        transform={(text) => generateSlug(text, separator)}
        controls={
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['-', '_'] as const).map((sep) => (
              <button key={sep} className={`chip-button ${separator === sep ? 'is-active' : ''}`} type="button" onClick={() => setSeparator(sep)}>
                Use {sep === '-' ? 'hyphens (-)' : 'underscores (_)'}
              </button>
            ))}
          </div>
        }
      />
    </ToolPageLayout>
  );
}
