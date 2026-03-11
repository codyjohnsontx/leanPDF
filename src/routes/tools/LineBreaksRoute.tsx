import { useState } from 'react';
import { TextToolShell } from '../../features/tools/TextToolShell';
import { processLineBreaks, type LineBreakMode } from '../../lib/text/lineBreaks';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';

const MODES: Array<{ id: LineBreakMode; label: string }> = [
  { id: 'remove-single', label: 'Remove single breaks' },
  { id: 'remove-all', label: 'Remove all breaks' },
  { id: 'add-after-sentence', label: 'Add after sentences' },
  { id: 'add-every-n-words', label: 'Add every N words' },
];

export default function LineBreaksRoute() {
  const [mode, setMode] = useState<LineBreakMode>('remove-single');
  const [n, setN] = useState(10);

  return (
    <ToolPageLayout title="Line Break Remover / Adder" description="Remove or add line breaks to format text exactly how you need it.">
      <TextToolShell
        transform={(text) => processLineBreaks(text, mode, n)}
        controls={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {MODES.map((m) => (
              <button key={m.id} className={`chip-button ${mode === m.id ? 'is-active' : ''}`} type="button" onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
            {mode === 'add-every-n-words' ? (
              <input className="field-input" type="number" min={1} value={n} onChange={(e) => setN(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '80px' }} />
            ) : null}
          </div>
        }
      />
    </ToolPageLayout>
  );
}
