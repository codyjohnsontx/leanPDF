import { getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import JSZip from 'jszip';

export type ImageFormat = 'jpeg' | 'png' | 'webp';

async function pageToBlob(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  format: ImageFormat,
  scale: number,
  quality: number,
): Promise<Blob> {
  const page = await pdf.getPage(pageNumber);
  try {
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas export failed'));
        },
        `image/${format}`,
        quality,
      );
    });
  } finally {
    page.cleanup();
  }
}

export async function exportPdfAsImages(
  bytes: Uint8Array,
  format: ImageFormat,
  scale = 2,
  quality = 0.92,
  onProgress?: (current: number, total: number) => void,
): Promise<{ filename: string; data: Blob }> {
  const pdf = await getDocument({ data: bytes.slice() }).promise;
  const total = pdf.numPages;

  const ext = format === 'jpeg' ? 'jpg' : format;

  try {
    if (total === 1) {
      onProgress?.(0, 1);
      const blob = await pageToBlob(pdf, 1, format, scale, quality);
      onProgress?.(1, 1);
      return { filename: `page-1.${ext}`, data: blob };
    }

    const zip = new JSZip();
    for (let i = 1; i <= total; i++) {
      onProgress?.(i - 1, total);
      const blob = await pageToBlob(pdf, i, format, scale, quality);
      const pad = String(i).padStart(3, '0');
      zip.file(`page-${pad}.${ext}`, blob);
    }
    onProgress?.(total, total);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return { filename: `pages.zip`, data: zipBlob };
  } finally {
    await pdf.destroy();
  }
}
