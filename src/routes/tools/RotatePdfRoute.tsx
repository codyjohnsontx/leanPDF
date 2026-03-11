import { useState, useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfToolShell } from '../../features/tools/PdfToolShell';
import { rotatePdfPerPage } from '../../lib/pdf/rotate';
import { ToolPageLayout } from '../../features/tools/ToolPageLayout';
import { readFileAsBytes } from '../../lib/utils/fileReader';
import { loadPdfDocument } from '../../lib/pdf/viewer';

const MAX_PAGES = 12;
const PREVIEW_SCALE = 0.5;

type PreviewGridProps = {
  file: File | null;
  pageRotations: number[];
  onRotate: (pageIndex: number) => void;
};

function PdfPreviewGrid({ file, pageRotations, onRotate }: PreviewGridProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(file));
  const [loadError, setLoadError] = useState<string | null>(null);
  const canvasMapRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageCount = pdfDoc?.numPages ?? 0;

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let currentDoc: PDFDocumentProxy | null = null;

    setLoadError(null);
    void (async () => {
      try {
        const bytes = await readFileAsBytes(file);
        if (cancelled) return;
        const document = await loadPdfDocument(bytes);
        if (cancelled) {
          await document.destroy();
          return;
        }
        currentDoc = document;
        setPdfDoc(document);
      } catch (err) {
        if (!cancelled) {
          setPdfDoc(null);
          setLoadError(err instanceof Error ? err.message : 'Failed to load PDF.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      void currentDoc?.destroy();
    };
  }, [file]);

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
        const additionalRotation = pageRotations[n - 1] ?? 0;
        const viewport = page.getViewport({
          scale: PREVIEW_SCALE,
          rotation: (page.rotate + additionalRotation) % 360,
        });

        canvas.width = Math.round(viewport.width * dpr);
        canvas.height = Math.round(viewport.height * dpr);
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
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
  }, [pdfDoc, pageRotations, pageCount]);

  if (!file) return null;
  if (isLoading) return <div className="pdf-preview-loading">Loading preview…</div>;
  if (loadError) return <p className="field-error" role="alert">{loadError}</p>;

  const limit = Math.min(pageCount, MAX_PAGES);
  const overflow = pageCount - limit;

  return (
    <>
      <div className="pdf-preview-grid">
        {Array.from({ length: limit }, (_, i) => i + 1).map((n) => {
          const rotation = pageRotations[n - 1] ?? 0;
          return (
            <div key={n} className={`pdf-preview-card${rotation !== 0 ? ' is-rotated' : ''}`}>
              <div className="pdf-preview-canvas-wrap">
                <canvas
                  ref={(el) => {
                    const map = canvasMapRef.current;
                    if (el) map.set(n, el); else map.delete(n);
                  }}
                />
                <div className="pdf-preview-overlay" aria-hidden="true">
                  <span className="pdf-preview-overlay-icon">↻</span>
                </div>
              </div>
              <div className="pdf-preview-label">
                <span>Page {n}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {rotation !== 0 && (
                    <span className="pdf-preview-rotation-badge">+{rotation}°</span>
                  )}
                  <button
                    className="pdf-preview-rotate-btn"
                    type="button"
                    title="Rotate 90° clockwise"
                    onClick={() => onRotate(n - 1)}
                  >
                    ↻ Rotate
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {overflow > 0 && (
        <p className="helper-copy" style={{ marginTop: '8px' }}>
          + {overflow} more page{overflow !== 1 ? 's' : ''}
        </p>
      )}
    </>
  );
}

export default function RotatePdfRoute() {
  const [pageRotations, setPageRotations] = useState<number[]>([]);

  function handleRotate(pageIndex: number) {
    setPageRotations((prev) => {
      const next = [...prev];
      next[pageIndex] = ((next[pageIndex] ?? 0) + 90) % 360;
      return next;
    });
  }

  return (
    <ToolPageLayout title="Rotate PDF" description="Click ↻ on any page to rotate it 90° clockwise. Click Rotate PDF to download.">
      <PdfToolShell
        actionLabel="Rotate PDF"
        onAction={async (files) => {
          const bytes = await readFileAsBytes(files[0]);
          const data = await rotatePdfPerPage(bytes, pageRotations);
          return { filename: files[0].name.replace('.pdf', '-rotated.pdf'), data };
        }}
        onFilesChange={() => setPageRotations([])}
      >
        {(files) => (
          <PdfPreviewGrid
            key={files[0] ? `${files[0].name}:${files[0].lastModified}:${files[0].size}` : 'empty'}
            file={files[0] ?? null}
            pageRotations={pageRotations}
            onRotate={handleRotate}
          />
        )}
      </PdfToolShell>
    </ToolPageLayout>
  );
}
