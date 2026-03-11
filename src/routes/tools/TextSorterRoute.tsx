import { useState } from 'react';
import { TextToolShell } from '../../features/tools/TextToolShell';
import { sortText, type SortMode } from '../../lib/text/textSorter';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';

const MODES: Array<{ id: SortMode; label: string }> = [
  { id: 'alpha-asc', label: 'A → Z' },
  { id: 'alpha-desc', label: 'Z → A' },
  { id: 'numeric-asc', label: '0 → 9' },
  { id: 'numeric-desc', label: '9 → 0' },
  { id: 'length-asc', label: 'Shortest first' },
  { id: 'length-desc', label: 'Longest first' },
  { id: 'reverse', label: 'Reverse' },
];

export default function TextSorterRoute() {
  const [mode, setMode] = useState<SortMode>('alpha-asc');
  const [removeEmpty, setRemoveEmpty] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);

  return (
    <ToolPageLayout title="Text Sorter" description="Sort text lines alphabetically or numerically with ease.">
      <TextToolShell
        transform={(text) => sortText(text, { mode, removeEmptyLines: removeEmpty, caseSensitive })}
        controls={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {MODES.map((m) => (
              <button key={m.id} className={`chip-button ${mode === m.id ? 'is-active' : ''}`} type="button" onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
            <label className="toggle-row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={removeEmpty} onChange={(e) => setRemoveEmpty(e.target.checked)} />
              Remove empty lines
            </label>
            <label className="toggle-row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
              Case sensitive
            </label>
          </div>
        }
      />
    </ToolPageLayout>
  );
}
