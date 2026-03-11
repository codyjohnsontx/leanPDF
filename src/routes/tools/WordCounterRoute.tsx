import { useState, useMemo } from 'react';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';
import { countWords } from '../../lib/text/wordCounter';

export default function WordCounterRoute() {
  const [text, setText] = useState('');
  const stats = useMemo(() => countWords(text), [text]);

  return (
    <ToolPageLayout title="Word Counter" description="Count words, characters, sentences, and paragraphs in real time.">
      <div className="text-tool-grid">
        <div>
          <span className="field-label">Input text</span>
          <textarea
            className="field-textarea text-tool-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your text here…"
          />
        </div>
        <div className="word-counter-stats">
          {([
            ['Words', stats.words],
            ['Characters (with spaces)', stats.charsWithSpaces],
            ['Characters (no spaces)', stats.charsWithoutSpaces],
            ['Sentences', stats.sentences],
            ['Paragraphs', stats.paragraphs],
          ] as [string, number][]).map(([label, value]) => (
            <div key={label} className="word-counter-stat">
              <span className="mono word-counter-value" style={{ color: 'var(--accent)' }}>{value.toLocaleString()}</span>
              <span className="helper-copy">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </ToolPageLayout>
  );
}
