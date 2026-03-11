import { useState, useMemo } from 'react';
import { analyzeKeywordDensity } from '../../lib/text/keywordDensity';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';

export default function KeywordDensityRoute() {
  const [text, setText] = useState('');
  const [filterStopWords, setFilterStopWords] = useState(true);
  const [minLength, setMinLength] = useState(3);
  const results = useMemo(() => analyzeKeywordDensity(text, filterStopWords, minLength), [text, filterStopWords, minLength]);

  return (
    <ToolPageLayout title="Keyword Density Checker" description="Analyze keyword frequency to improve SEO content optimization.">
      <div className="text-tool-grid">
        <div>
          <span className="field-label">Input text</span>
          <textarea className="field-textarea text-tool-textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your content here…" />
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <label className="toggle-row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={filterStopWords} onChange={(e) => setFilterStopWords(e.target.checked)} />
              Filter stop words
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="helper-copy">Min length</span>
              <input className="field-input" type="number" min={1} max={20} value={minLength} onChange={(e) => setMinLength(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: '60px' }} />
            </label>
          </div>
        </div>
        <div>
          <span className="field-label">Keyword density</span>
          {results.length === 0 ? (
            <p className="helper-copy" style={{ marginTop: '10px' }}>{text ? 'No keywords found.' : 'Paste text to analyze.'}</p>
          ) : (
            <table className="keyword-table">
              <thead>
                <tr>
                  <th className="field-label" style={{ textAlign: 'left', paddingBottom: '8px' }}>Keyword</th>
                  <th className="field-label" style={{ textAlign: 'right', paddingBottom: '8px' }}>Count</th>
                  <th className="field-label" style={{ textAlign: 'right', paddingBottom: '8px' }}>Density</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.keyword} className="keyword-row">
                    <td className="mono">{row.keyword}</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 700 }}>{row.occurrences}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{row.density}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ToolPageLayout>
  );
}
