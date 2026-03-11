import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface Props {
  inputLabel?: string;
  outputLabel?: string;
  placeholder?: string;
  controls?: ReactNode;
  transform: (input: string) => string;
}

export function TextToolShell({
  inputLabel = 'Input',
  outputLabel = 'Output',
  placeholder = 'Paste or type your text here…',
  controls,
  transform,
}: Props) {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const output = useMemo(() => (input ? transform(input) : ''), [input, transform]);

  function handleCopy() {
    void navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="text-tool-grid">
      <div>
        <span className="field-label">{inputLabel}</span>
        <textarea
          className="field-textarea text-tool-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
        />
      </div>

      {controls ? <div className="text-tool-controls">{controls}</div> : null}

      <div>
        <div className="text-tool-output-header">
          <span className="field-label">{outputLabel}</span>
          <button
            className={`chip-button ${copied ? 'is-active' : ''}`}
            type="button"
            onClick={handleCopy}
            disabled={!output}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <textarea
          className="field-textarea text-tool-textarea"
          value={output}
          readOnly
          placeholder="Output will appear here…"
          style={{ cursor: 'default', resize: 'none' }}
        />
      </div>
    </div>
  );
}
