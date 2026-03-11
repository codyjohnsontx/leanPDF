import { useState } from 'react';
import { PdfToolShell } from '../../features/tools/PdfToolShell';
import { splitPdf } from '../../lib/pdf/split';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';
import { readFileAsBytes } from '../../lib/utils/fileReader';
import { downloadBlob } from '../../lib/utils/download';

export default function SplitPdfRoute() {
  const [rangeInput, setRangeInput] = useState('');

  return (
    <ToolPageLayout title="Split PDF" description="Extract specific pages or split a PDF into multiple separate documents.">
      <PdfToolShell
        actionLabel="Split PDF"
        onAction={async (files) => {
          const bytes = await readFileAsBytes(files[0]);
          const ranges = rangeInput
            ? rangeInput.split(';').map((r, i) => ({
                label: `Part ${i + 1}`,
                pages: r.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n > 0),
              })).filter((r) => r.pages.length > 0)
            : [];
          if (ranges.length === 0) throw new Error('Enter at least one page range.');
          const result = await splitPdf(bytes, ranges, files[0].name.replace('.pdf', ''));
          if (result.data instanceof Blob) {
            downloadBlob(result.filename, result.data);
            return { filename: result.filename, data: new Uint8Array() };
          }
          return result as { filename: string; data: Uint8Array };
        }}
      >
        {() => (
          <div>
            <span className="field-label">Page ranges</span>
            <input
              className="field-input"
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              placeholder="e.g. 1-3 ; 4-6 ; 7,8,9"
              style={{ marginTop: '6px' }}
            />
            <p className="helper-copy" style={{ marginTop: '6px' }}>Separate multiple output files with semicolons (;). Pages within a file separated by commas or ranges.</p>
          </div>
        )}
      </PdfToolShell>
    </ToolPageLayout>
  );
}
