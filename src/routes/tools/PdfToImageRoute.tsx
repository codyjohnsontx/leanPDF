import { useState } from 'react';
import { PdfToolShell } from '../../features/tools/PdfToolShell';
import { exportPdfAsImages, type ImageFormat } from '../../lib/pdf/exportImages';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';
import { readFileAsBytes } from '../../lib/utils/fileReader';
import { downloadBlob } from '../../lib/utils/download';

const FORMATS: Array<{ id: ImageFormat; label: string }> = [
  { id: 'jpeg', label: 'JPG' },
  { id: 'png', label: 'PNG' },
  { id: 'webp', label: 'WEBP' },
];

const QUALITY_MAP = { low: 0.6, medium: 0.85, high: 0.95 };
type Quality = keyof typeof QUALITY_MAP;

export default function PdfToImageRoute() {
  const [format, setFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState<Quality>('high');

  return (
    <ToolPageLayout title="PDF to Image" description="Convert PDF pages into high-quality JPG, PNG, or WEBP images.">
      <PdfToolShell
        actionLabel="Convert to Images"
        onAction={async (files) => {
          const bytes = await readFileAsBytes(files[0]);
          const result = await exportPdfAsImages(bytes, format, 2, QUALITY_MAP[quality]);
          if (result.data instanceof Blob) {
            downloadBlob(result.filename, result.data);
            return { filename: result.filename, data: new Uint8Array() };
          }
          return { filename: result.filename, data: result.data as unknown as Uint8Array };
        }}
      >
        {() => (
          <div className="stack" style={{ gap: '12px' }}>
            <div>
              <span className="field-label">Output format</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {FORMATS.map((f) => (
                  <button key={f.id} className={`chip-button ${format === f.id ? 'is-active' : ''}`} type="button" onClick={() => setFormat(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="field-label">Quality</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {(['low', 'medium', 'high'] as Quality[]).map((q) => (
                  <button key={q} className={`chip-button ${quality === q ? 'is-active' : ''}`} type="button" onClick={() => setQuality(q)}>
                    {q.charAt(0).toUpperCase() + q.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <p className="helper-copy">Multi-page PDFs will be downloaded as a ZIP file.</p>
          </div>
        )}
      </PdfToolShell>
    </ToolPageLayout>
  );
}
