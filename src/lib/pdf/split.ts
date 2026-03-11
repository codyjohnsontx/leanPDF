import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export async function splitPdf(
  bytes: Uint8Array,
  ranges: Array<{ label: string; pages: number[] }>,
  baseName: string,
): Promise<{ filename: string; data: Uint8Array } | { filename: string; data: Blob }> {
  const src = await PDFDocument.load(bytes);

  if (ranges.length === 1) {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, ranges[0].pages.map((p) => p - 1));
    copied.forEach((page) => out.addPage(page));
    const data = await out.save();
    return { filename: `${baseName}-split.pdf`, data };
  }

  const zip = new JSZip();
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, range.pages.map((p) => p - 1));
    copied.forEach((page) => out.addPage(page));
    const data = await out.save();
    zip.file(`${baseName}-part-${i + 1}.pdf`, data);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  return { filename: `${baseName}-split.zip`, data: blob };
}
