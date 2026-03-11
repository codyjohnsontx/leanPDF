import { useState, useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfToolShell } from '../../features/tools/PdfToolShell';
import { rotatePdf } from '../../lib/pdf/rotate';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';
import { readFileAsBytes } from '../../lib/utils/fileReader';
import { loadPdfDocument } from '../../lib/pdf/pdf';

const MAX_PAGES = 12;
const PREVIEW_SCALE = 0.5;

type PreviewGridProps = {
  file: File | null;
  angle: 90 | 180 | 270;
  target: 'all' | number[];
};

function PdfPreviewGrid({ file, angle, target }: PreviewGridProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const canvasMapRef = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // Effect 1 — load document
  useEffect(() => {
    if (!file) {
      setPdfDoc(null);
      setPageCount(0);
      return;
    }
    let cancelled = false;
    setIsLoading(true);

    async function load() {
      const bytes = await readFileAsBytes(file!);
      if (cancelled) return;
      const doc = await loadPdfDocument(bytes);
      if (cancelled) return;
      setPdfDoc(doc);
      setPageCount(doc.numPages);
      setIsLoading(false);
    }

    void load();
    return () => { cancelled = true; };
  }, [file]);

  // Effect 2 — render pages
  useEffect(() => {
    if (!pdfDoc || pageCount === 0) return;
    let cancelled = false;
    const renderTasks: { cancel: () => void; promise: Promise<void> }[] = [];

    async function renderAll() {
      const limit = Math.min(pageCount, MAX_PAGES);
      for (let n = 1; n <= limit; n++) {
        if (cancelled) break;
        const page = await pdfDoc!.getPage(n);
        if (cancelled) break;

        const canvas = canvasMapRef.current.get(n);
        if (!canvas) continue;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: PREVIEW_SCALE, rotation: (page.rotate + angle) % 360 });

        canvas.width = Math.round(viewport.width * dpr);
        canvas.height = Math.round(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const task = page.render({ canvas, canvasContext: ctx, viewport });
        renderTasks.push(task);
        try {
          await task.promise;
        } catch {
          // cancelled or render error — ignore
        }
      }
    }

    void renderAll();
    return () => {
      cancelled = true;
      renderTasks.forEach((t) => t.cancel());
    };
  }, [pdfDoc, angle, pageCount]);

  if (!file) return null;

  if (isLoading) {
    return <div className="pdf-preview-loading">Loading preview…</div>;
  }

  const limit = Math.min(pageCount, MAX_PAGES);
  const overflow = pageCount - limit;

  function willRotate(pageNum: number): boolean {
    return target === 'all' || (target as number[]).includes(pageNum);
  }

  return (
    <>
      <div className="pdf-preview-grid">
        {Array.from({ length: limit }, (_, i) => i + 1).map((n) => {
          const rotates = willRotate(n);
          return (
            <div key={n} className={`pdf-preview-card ${rotates ? 'will-rotate' : 'no-rotate'}`}>
              <canvas
                ref={(el) => {
                  const map = canvasMapRef.current;
                  if (el) map.set(n, el); else map.delete(n);
                }}
                style={{ width: '100%', borderRadius: '8px', background: '#fff' }}
              />
              <div className="pdf-preview-label">
                <span>Page {n}</span>
                {rotates && <span className="pdf-preview-badge">will rotate</span>}
              </div>
            </div>
          );
        })}
      </div>
      {overflow > 0 && (
        <p className="helper-copy" style={{ marginTop: '8px' }}>+ {overflow} more page{overflow !== 1 ? 's' : ''}</p>
      )}
    </>
  );
}

export default function RotatePdfRoute() {
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [target, setTarget] = useState<'all' | 'custom'>('all');
  const [pageInput, setPageInput] = useState('');

  const pageNumbers: 'all' | number[] = target === 'all'
    ? 'all'
    : pageInput.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));

  return (
    <ToolPageLayout title="Rotate PDF" description="Rotate PDF pages to the correct orientation in just a few clicks.">
      <PdfToolShell
        actionLabel="Rotate PDF"
        onAction={async (files) => {
          const bytes = await readFileAsBytes(files[0]);
          const data = await rotatePdf(bytes, angle, pageNumbers);
          return { filename: files[0].name.replace('.pdf', '-rotated.pdf'), data };
        }}
      >
        {(files) => (
          <div className="stack" style={{ gap: '12px' }}>
            <div>
              <span className="field-label">Rotation angle</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {([90, 180, 270] as const).map((a) => (
                  <button key={a} className={`chip-button ${angle === a ? 'is-active' : ''}`} type="button" onClick={() => setAngle(a)}>
                    {a === 90 ? '90° CW' : a === 180 ? '180°' : '90° CCW'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="field-label">Pages to rotate</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button className={`chip-button ${target === 'all' ? 'is-active' : ''}`} type="button" onClick={() => setTarget('all')}>All pages</button>
                <button className={`chip-button ${target === 'custom' ? 'is-active' : ''}`} type="button" onClick={() => setTarget('custom')}>Custom pages</button>
                {target === 'custom' && (
                  <input className="field-input" value={pageInput} onChange={(e) => setPageInput(e.target.value)} placeholder="e.g. 1, 3, 5" style={{ width: '180px' }} />
                )}
              </div>
            </div>
            <PdfPreviewGrid file={files[0] ?? null} angle={angle} target={pageNumbers} />
          </div>
        )}
      </PdfToolShell>
    </ToolPageLayout>
  );
}
