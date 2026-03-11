import { useState } from 'react';
import { TextToolShell } from '../../features/tools/TextToolShell';
import { convertCase, type CaseMode } from '../../lib/text/caseConverter';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';

const MODES: Array<{ id: CaseMode; label: string }> = [
  { id: 'upper', label: 'UPPER' },
  { id: 'lower', label: 'lower' },
  { id: 'title', label: 'Title' },
  { id: 'sentence', label: 'Sentence' },
  { id: 'camel', label: 'camelCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
];

export default function CaseConverterRoute() {
  const [mode, setMode] = useState<CaseMode>('upper');

  return (
    <ToolPageLayout title="Text Case Converter" description="Convert text to uppercase, lowercase, title case, and more.">
      <TextToolShell
        transform={(text) => convertCase(text, mode)}
        controls={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {MODES.map((m) => (
              <button
                key={m.id}
                className={`chip-button ${mode === m.id ? 'is-active' : ''}`}
                type="button"
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        }
      />
    </ToolPageLayout>
  );
}
