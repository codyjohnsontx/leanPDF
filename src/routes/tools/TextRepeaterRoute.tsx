import { useState } from 'react';
import { TextToolShell } from '../../features/tools/TextToolShell';
import { repeatText } from '../../lib/text/textRepeater';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';

export default function TextRepeaterRoute() {
  const [count, setCount] = useState(3);
  const [separator, setSeparator] = useState('\\n');

  return (
    <ToolPageLayout title="Text Repeater" description="Repeat text multiple times with custom separators.">
      <TextToolShell
        transform={(text) => {
          try { return repeatText(text, count, separator); }
          catch (e) { return e instanceof Error ? e.message : ''; }
        }}
        controls={
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="field-label" style={{ margin: 0 }}>Repeat</span>
              <input className="field-input" type="number" min={1} max={10000} value={count} onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '80px' }} />
              <span className="helper-copy">times</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="field-label" style={{ margin: 0 }}>Separator</span>
              <input className="field-input" value={separator} onChange={(e) => setSeparator(e.target.value)} placeholder="\n" style={{ width: '100px' }} />
            </label>
          </div>
        }
      />
    </ToolPageLayout>
  );
}
