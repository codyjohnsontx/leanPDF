import { useState } from 'react';
import { TextToolShell } from '../../features/tools/TextToolShell';
import { normalizeSpaces } from '../../lib/text/spaceNormalizer';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';

export default function RemoveSpacesRoute() {
  const [collapseSpaces, setCollapseSpaces] = useState(true);
  const [trimLines, setTrimLines] = useState(true);
  const [trimDocument, setTrimDocument] = useState(true);

  return (
    <ToolPageLayout title="Remove Extra Spaces" description="Remove unnecessary spaces and clean up messy text in one click.">
      <TextToolShell
        transform={(text) => normalizeSpaces(text, { collapseSpaces, trimLines, trimDocument })}
        controls={
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {([
              ['Collapse multiple spaces', collapseSpaces, setCollapseSpaces],
              ['Trim each line', trimLines, setTrimLines],
              ['Trim document start/end', trimDocument, setTrimDocument],
            ] as [string, boolean, (v: boolean) => void][]).map(([label, val, set]) => (
              <label key={label} className="toggle-row" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        }
      />
    </ToolPageLayout>
  );
}
