import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { AnnotationMode } from '../../lib/pdf/pdf';
import type { AnnotationRecord, StoredSignatureAsset, ViewerRotation, ViewerTool } from '../../lib/pdf/types';
import { AnnotationOverlay } from '../annotations/AnnotationOverlay';

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
}: PdfPageViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
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
  }, [pageNumber, pdfDocument, rotation, zoom]);

  return (
    <article
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
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          borderRadius: '20px',
          boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
          background: '#fff',
        }}
      />

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
