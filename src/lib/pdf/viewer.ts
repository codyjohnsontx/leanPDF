import { AnnotationMode, GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { SearchIndexEntry } from '../utils/search';

GlobalWorkerOptions.workerSrc = workerSrc;

export async function loadPdfDocument(bytes: Uint8Array, password?: string): Promise<PDFDocumentProxy> {
  const loadingTask = getDocument({ data: bytes.slice(), password });
  return loadingTask.promise;
}

export async function buildPdfSearchIndex(
  pdfDocument: PDFDocumentProxy,
  onCancel: () => boolean,
): Promise<SearchIndexEntry[]> {
  const entries: SearchIndexEntry[] = [];
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    if (onCancel()) return entries;
    const page = await pdfDocument.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    entries.push({ pageNumber: i, text });
  }
  return entries;
}

export { AnnotationMode };
