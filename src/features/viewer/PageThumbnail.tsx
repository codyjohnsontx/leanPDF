import { useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

type PageThumbnailProps = {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
};

export function PageThumbnail({ pdfDocument, pageNumber, isActive, onClick }: PageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    async function renderThumbnail() {
      const page = await pdfDocument.getPage(pageNumber);
      if (cancelled) return;

      const viewport = page.getViewport({ scale: 0.22 });
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      if (cancelled) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
      });

      const currentRenderTask = renderTask;
      try {
        await currentRenderTask.promise;
      } catch {
        // cancelled or render error — ignore
      }
    }

    void renderThumbnail();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pageNumber, pdfDocument]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`ghost-button ${isActive ? 'is-active' : ''}`}
      style={{
        width: '100%',
        display: 'grid',
        gap: '10px',
        padding: '10px',
        borderRadius: '16px',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          borderRadius: '10px',
          background: '#fff',
          border: '1px solid var(--border-alpha)',
        }}
      />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Page {pageNumber}</span>
    </button>
  );
}
