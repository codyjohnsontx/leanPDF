import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { AnnotationMode } from '../../lib/pdf/viewer';
import type { AnnotationRecord, StoredSignatureAsset, ViewerRotation, ViewerTool } from '../../lib/pdf/types';
import { AnnotationOverlay } from '../annotations/AnnotationOverlay';

const PLACEHOLDER_FALLBACK = { width: 612, height: 792 };

type PdfPageViewProps = {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  zoom: number;
  rotation: ViewerRotation;
  annotations: AnnotationRecord[];
  selectedAnnotationId: string | null;
  tool: ViewerTool;
  selectedSignature: StoredSignatureAsset | null;
  onCommitAnnotation: (annotation: AnnotationRecord) => void;
  onSelectAnnotation: (annotationId: string | null) => void;
  placeholderSize?: { width: number; height: number };
};

export function PdfPageView({
  pdfDocument,
  pageNumber,
  zoom,
  rotation,
  annotations,
  selectedAnnotationId,
  tool,
  selectedSignature,
  onCommitAnnotation,
  onSelectAnnotation,
  placeholderSize,
}: PdfPageViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [inView, setInView] = useState(false);

  // One-shot IntersectionObserver: once visible, never revert.
  useEffect(() => {
    const node = articleRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    async function renderPage() {
      const page = await pdfDocument.getPage(pageNumber);
      if (cancelled) return;

      const viewport = page.getViewport({ scale: zoom, rotation });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * devicePixelRatio);
      canvas.height = Math.floor(viewport.height * devicePixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      if (cancelled) return;

      renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
        annotationMode: AnnotationMode.ENABLE_FORMS,
      });
      const currentRenderTask = renderTask;
      try {
        await currentRenderTask.promise;
      } catch {
        return;
      }
      if (!cancelled) {
        setSize({ width: viewport.width, height: viewport.height });
      }
    }

    void renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [inView, pageNumber, pdfDocument, rotation, zoom]);

  const ph = placeholderSize ?? PLACEHOLDER_FALLBACK;
  const placeholderWidth = ph.width * zoom;
  const placeholderHeight = ph.height * zoom;

  return (
    <article
      ref={articleRef}
      data-page-number={pageNumber}
      style={{
        position: 'relative',
        width: 'fit-content',
        margin: '0 auto',
        padding: '16px',
        borderRadius: '28px',
        background: 'rgba(9, 12, 18, 0.84)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          zIndex: 2,
          borderRadius: '999px',
          padding: '0.28rem 0.68rem',
          background: 'rgba(15, 19, 28, 0.84)',
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
        }}
      >
        Page {pageNumber}
      </div>

      {inView ? (
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            borderRadius: '20px',
            boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
            background: '#fff',
          }}
        />
      ) : (
        <div
          style={{
            display: 'block',
            width: `${placeholderWidth}px`,
            height: `${placeholderHeight}px`,
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
      )}

      {size.width > 0 && size.height > 0 ? (
        <AnnotationOverlay
          pageIndex={pageNumber - 1}
          width={size.width}
          height={size.height}
          tool={tool}
          annotations={annotations}
          selectedAnnotationId={selectedAnnotationId}
          selectedSignature={selectedSignature}
          onCommit={onCommitAnnotation}
          onSelect={onSelectAnnotation}
        />
      ) : null}
    </article>
  );
}
