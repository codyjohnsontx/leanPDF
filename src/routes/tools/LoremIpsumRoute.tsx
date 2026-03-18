import { useState } from 'react';
import { generateLorem, type LoremMode } from '../../lib/text/loremIpsum';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';
import { downloadText } from '../../lib/utils/download';
import { Button } from '@/components/ui/button';

export default function LoremIpsumRoute() {
  const [mode, setMode] = useState<LoremMode>('paragraphs');
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    setOutput(generateLorem(mode, count, true));
  }

  function handleCopy() {
    void navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <ToolPageLayout title="Lorem Ipsum Generator" description="Generate placeholder text for design and layout projects.">
      <div className="stack">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['words', 'sentences', 'paragraphs'] as LoremMode[]).map((m) => (
              <button key={m} className={`chip-button ${mode === m ? 'is-active' : ''}`} type="button" onClick={() => setMode(m)}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <input
            className="field-input"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: '80px' }}
          />
          <Button type="button" onClick={handleGenerate}>Generate</Button>
        </div>

        {output ? (
          <div>
            <div className="text-tool-output-header">
              <span className="field-label">Output</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className={`chip-button ${copied ? 'is-active' : ''}`} type="button" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button className="chip-button" type="button" onClick={() => downloadText('lorem-ipsum.txt', output)}>
                  Download
                </button>
              </div>
            </div>
            <textarea className="field-textarea text-tool-textarea" value={output} readOnly style={{ cursor: 'default', resize: 'none' }} />
          </div>
        ) : null}
      </div>
    </ToolPageLayout>
  );
}
